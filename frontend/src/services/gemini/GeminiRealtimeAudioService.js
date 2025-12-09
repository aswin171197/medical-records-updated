// src/services/GeminiRealtimeAudioService.js
// Lightweight audio helper: initialize audio context and play base64 audio serially.
// Usage: import audioService from '../services/GeminiRealtimeAudioService';
//        await audioService.playAudioFromBase64(base64, { mimeHint: 'audio/mp3' });

const audioService = (() => {
  let audioContext = null;
  let playing = false;
  let queue = [];
  let initialized = false;

  const ensureContext = async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    initialized = true;
  };

  // decode base64 to ArrayBuffer
  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // internal play implementation: uses AudioContext.decodeAudioData and plays buffer
  const playBuffer = async (arrayBuffer) => {
    await ensureContext();
    if (!audioContext) throw new Error('AudioContext not available');

    try {
      // decode audio
      const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const source = audioContext.createBufferSource();
      source.buffer = decoded;
      const gain = audioContext.createGain();
      source.connect(gain);
      gain.connect(audioContext.destination);

      return new Promise((resolve, reject) => {
        source.onended = () => {
          try { source.disconnect(); gain.disconnect(); } catch (e) {}
          resolve();
        };
        source.start(0);
      });
    } catch (err) {
      // fallback: try using an audio element
      return new Promise((resolve, reject) => {
        try {
          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.addEventListener('ended', () => {
            URL.revokeObjectURL(url);
            resolve();
          });
          audio.addEventListener('error', (e) => {
            URL.revokeObjectURL(url);
            reject(e);
          });
          audio.play().catch((e) => {
            // may be due to autoplay policy — still resolve to avoid blocking queue forever
            console.warn('[audioService] audio.play() failed:', e);
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    }
  };

  // Ensure audio parts are played serially
  const playAudioFromBase64 = async (base64, options = {}) => {
    if (!base64) return Promise.reject(new Error('No audio data'));

    // Add to queue and process only one by one
    return new Promise((resolve, reject) => {
      queue.push({ base64, options, resolve, reject });
      if (!playing) {
        _processQueue().catch(err => {
          console.error('[audioService] queue processing error', err);
        });
      }
    });
  };

  const _processQueue = async () => {
    playing = true;
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        await ensureContext();
        const arrayBuffer = base64ToArrayBuffer(item.base64);
        await playBuffer(arrayBuffer);
        item.resolve();
      } catch (err) {
        console.error('[audioService] play error', err);
        try { item.reject(err); } catch (e) {}
      }
    }
    playing = false;
  };

  // Optional initialize function used by your UI to prompt microphone permission if needed
  const initializeAudio = async () => {
    // no-op for playback; included because previous code called audioService.initializeAudio()
    // We'll create an AudioContext now to reduce first-play latency and satisfy autoplay constraints
    try {
      await ensureContext();
      // Some browsers require resume after user gesture; that's up to UI
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const cleanup = async () => {
    try {
      if (audioContext && audioContext.close) {
        await audioContext.close();
      }
    } catch (e) { /* ignore */ }
    audioContext = null;
    initialized = false;
    queue = [];
    playing = false;
  };

  return {
    playAudioFromBase64,
    initializeAudio,
    cleanup
  };
})();

export default audioService;
