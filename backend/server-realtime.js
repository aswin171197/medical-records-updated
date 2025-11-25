const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const mkdirp = require('mkdirp');
const axios = require('axios');

const PORT = process.env.PORT || 3001;
console.log(`Realtime server using port: ${PORT}`);
const TMP_DIR = path.join(__dirname, 'tmp_audio');
mkdirp.sync(TMP_DIR);

// Optional: Google Cloud Speech client (install @google-cloud/speech and set GOOGLE_APPLICATION_CREDENTIALS)
let speechClient = null;
try {
  const { SpeechClient } = require('@google-cloud/speech');
  speechClient = new SpeechClient();
  console.log('Google Cloud Speech client ready');
} catch (e) {
  console.log('Google Cloud Speech not configured (install @google-cloud/speech and set GOOGLE_APPLICATION_CREDENTIALS to enable).');
}

// Helper: convert incoming WebM/Opus Buffer -> WAV (PCM16LE) 16k mono
function convertToWavPcm16(webmBuffer, { sampleRate = 16000 } = {}) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-f', 'wav',
      '-acodec', 'pcm_s16le',
      '-ac', '1',
      '-ar', String(sampleRate),
      'pipe:1'
    ]);

    const out = [];
    const err = [];

    ff.stdout.on('data', d => out.push(d));
    ff.stderr.on('data', d => err.push(d));
    ff.on('error', reject);
    ff.on('close', code => {
      if (code === 0) resolve(Buffer.concat(out));
      else {
        const msg = Buffer.concat(err).toString() || `ffmpeg exited ${code}`;
        reject(new Error(msg));
      }
    });

    ff.stdin.write(webmBuffer);
    ff.stdin.end();
  });
}

// Optional: transcribe using Google Cloud Speech-to-Text
async function transcribeWithGoogle(wavBuffer) {
  if (!speechClient) throw new Error('speechClient not configured.');
  const audioBytes = wavBuffer.toString('base64');
  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    }
  };
  const [response] = await speechClient.recognize(request);
  const results = response.results || [];
  const transcript = results.map(r => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '').join(' ');
  return transcript.trim();
}

// Replace this with call to your Gemini service endpoint (Nest V3AiService or direct SDK).
// The server expects an HTTP POST to GEMINI_ENDPOINT with body { transcript } and receivs back:
// { text: 'assistant reply', ttsBase64?: '<base64 audio>', mimeType?: 'audio/mp3' }
async function sendToGeminiBackend(transcript) {
  const url = process.env.GEMINI_ENDPOINT;
  if (!url) {
    // No Gemini endpoint configured — fallback return
    return { text: `(Gemini endpoint not configured) Received: ${transcript}` };
  }
  const resp = await axios.post(url, { transcript }, { timeout: 20000 });
  return resp.data;
}

const server = http.createServer();
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  // per-socket buffer for current recording
  socket._chunkBuffer = [];

  // Receive base64 webm chunks from client
  socket.on('send-audio-chunk', async (chunk) => {
    try {
      if (!chunk || !chunk.data) return;
      const buf = Buffer.from(chunk.data, 'base64');
      socket._chunkBuffer.push(buf);
      console.log(`recv chunk size=${buf.length} final=${!!chunk.final} from ${socket.id}`);

      // If not final, we just buffer
      if (!chunk.final) {
        socket.emit('chunk-ack', { ok: true });
        return;
      }

      // Final chunk arrived => combine and process
      const combined = Buffer.concat(socket._chunkBuffer);
      socket._chunkBuffer = [];

      // convert to WAV PCM16 16k
      let wavBuffer;
      try {
        wavBuffer = await convertToWavPcm16(combined, { sampleRate: 16000 });
        console.log('converted to WAV length=', wavBuffer.length);
      } catch (convErr) {
        console.error('Conversion error', convErr);
        socket.emit('error', { message: 'Audio conversion failed' });
        return;
      }

      // Transcribe
      let transcript = '';
      try {
        if (speechClient) {
          transcript = await transcribeWithGoogle(wavBuffer);
        } else {
          // If no STT configured, optionally send a minimal hint or error
          transcript = '(No STT configured) Please configure STT on server.';
        }
      } catch (sttErr) {
        console.error('STT error', sttErr);
        socket.emit('error', { message: 'Transcription failed' });
        return;
      }

      console.log('transcript:', transcript);

      // Send user transcript back to client (replace placeholder)
      socket.emit('text-part', { text: transcript, user: 'user', id: Date.now() });

      // Forward transcript to Gemini backend (HTTP) which should return assistant text and optionally TTS audio base64
      let assistantResult;
      try {
        assistantResult = await sendToGeminiBackend(transcript);
      } catch (gemErr) {
        console.error('Gemini backend error', gemErr);
        socket.emit('error', { message: 'AI backend error' });
        return;
      }

      const assistantText = assistantResult?.text || '(No assistant response)';
      socket.emit('text-part', { text: assistantText, user: 'bot', id: Date.now() });

      // If TTS audio returned, emit audio-part
      if (assistantResult?.ttsBase64) {
        const mime = assistantResult.mimeType || 'audio/mp3';
        socket.emit('audio-part', { audio: { data: assistantResult.ttsBase64, mimeType: mime }, id: Date.now() });
      }

      // Indicate turn complete
      socket.emit('turn-completed', {});
    } catch (err) {
      console.error('send-audio-chunk handler error', err);
      socket.emit('error', { message: err?.message || String(err) });
    }
  });

  socket.on('start-session', () => {
    console.log('start-session', socket.id);
    socket.emit('session-started');
  });

  socket.on('send-text', async (text) => {
    console.log('send-text from client', text?.slice?.(0,200));
    try {
      const assistantResult = await sendToGeminiBackend(text);
      const assistantText = assistantResult?.text || '(No assistant response)';
      socket.emit('text-part', { text: assistantText, user: 'bot', id: Date.now() });
      if (assistantResult?.ttsBase64) {
        socket.emit('audio-part', { audio: { data: assistantResult.ttsBase64, mimeType: assistantResult.mimeType || 'audio/mp3' }, id: Date.now() });
      }
      socket.emit('turn-completed', {});
    } catch (e) {
      console.error('send-text -> Gemini error', e);
      socket.emit('error', { message: 'AI backend error' });
    }
  });

  socket.on('end-session', () => {
    console.log('end-session', socket.id);
    socket._chunkBuffer = [];
    socket.emit('session-closed');
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    socket._chunkBuffer = [];
  });
});

server.listen(PORT, () => console.log(`realtime server running on ${PORT}`));