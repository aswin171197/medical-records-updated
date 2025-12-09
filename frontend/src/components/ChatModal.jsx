// frontend/src/components/ChatModal.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography,
  IconButton, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  InputAdornment, CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import useGeminiRealtime from '../hooks/useGeminiRealtime';
import audioService from '../services/audioService';

const ChatModal = ({ open, onClose }) => {
  const [messages, setMessages] = useState([{
    id: 'welcome',
    type: 'assistant',
    content: "Hello! I'm your AI Health Assistant. I can help you with medical questions and analyze your health data. Start a session to begin voice interaction.",
    timestamp: new Date(),
    role: 'assistant'
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const messagesEndRef = useRef(null);

  // dedupe sets: server ids we've already processed
  const seenServerIdsRef = useRef(new Set());
  // local message ids (UI-level) to avoid duplicates
  const seenUIMessageIdsRef = useRef(new Set());

  // useGeminiRealtime hook
  const {
    status: connectionStatus,
    serviceMessages,
    audioMessages,
    startSession,
    endSession,
    sendAudioChunk,
    sendTextPart,
    disconnect
  } = useGeminiRealtime();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // helper to push a message once (avoid duplicate UI id)
  const pushMessageIfNew = useCallback((msg) => {
    // msg must have 'id' and 'content' (or 'text') and optionally 'type'/'role'
    const id = msg.id ?? (`ui-${Date.now()}-${Math.random()}`);
    if (seenUIMessageIdsRef.current.has(String(id))) return;
    seenUIMessageIdsRef.current.add(String(id));

    const out = {
      id,
      type: msg.type ?? (msg.user === 'user' ? 'user' : 'assistant'),
      role: msg.role ?? (msg.user === 'user' ? 'user' : 'assistant'),
      content: msg.content ?? msg.text ?? '',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    };

    setMessages(prev => [...prev, out]);
  }, []);

  // process incoming server messages (text-part & audio-part)
  useEffect(() => {
    // Combine arrays (they are appended by the hook)
    const combined = [
      ...(Array.isArray(serviceMessages) ? serviceMessages : []),
      ...(Array.isArray(audioMessages) ? audioMessages : [])
    ];

    combined.forEach((msg) => {
      // derive id (server should provide id from backend)
      const msgId = msg?.id ?? (msg?.payload?.id) ?? (msg?.payload?.messageId) ?? (msg?.text ? `txt:${msg.text.slice(0,200)}` : null);

      // skip if we've already processed this server id
      if (msgId && seenServerIdsRef.current.has(String(msgId))) {
        return;
      }

      // mark seen early (prevents race duplicates)
      if (msgId) seenServerIdsRef.current.add(String(msgId));

      // AUDIO messages emitted from server have shape: { id, audio: { data, mimeType } }
      if (msg?.audio?.data) {
        // play audio once
        audioService.playAudioFromBase64(msg.audio.data, { mimeHint: msg.audio.mimeType })
          .then(() => {
            // push a single textual indicator for audio play if you want
            pushMessageIfNew({
              id: `${msgId ?? `audio-${Date.now()}`}-played`,
              type: 'assistant',
              content: '(audio reply played)',
              timestamp: Date.now()
            });
          })
          .catch((err) => {
            console.error('Failed to play audio', err);
            setAudioError('Failed to play audio reply');
          });
        return;
      }

      // TEXT messages: { id, text, user }
      if (msg?.text) {
        // If user==user, treat as user's transcription; else assistant
        const role = msg.user === 'user' ? 'user' : 'assistant';
        pushMessageIfNew({
          id: msgId ?? `text-${Date.now()}`,
          type: role === 'user' ? 'user' : 'assistant',
          role,
          text: msg.text,
          timestamp: msg.timestamp || Date.now()
        });
        setIsTyping(false);
        return;
      }

      // fallback: if msg has payload as string
      if (typeof msg === 'string') {
        pushMessageIfNew({
          id: `str-${Date.now()}-${Math.random()}`,
          type: 'assistant',
          content: msg,
          timestamp: Date.now()
        });
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceMessages, audioMessages]);

  // Start / stop recording using WebAudio and streaming chunks (your existing logic)
  const handleStartRecording = async () => {
    if (connectionStatus !== 'session-active') {
      alert('Please start a session first!');
      return;
    }

    try {
      setIsRecording(true);
      setIsTyping(true);

      // Add listening placeholder if not already present
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const lastVals = [last?.content, last?.text, last?.payload].filter(Boolean);
        const alreadyListening = lastVals.some(v => v === '...(Listening)' || v === '...(listening)');
        if (alreadyListening) return prev;
        return [...prev, { id: `listening-${Date.now()}`, role: 'user', type: 'user', content: '...(Listening)', timestamp: new Date() }];
      });

      // Start capturing audio with same approach as earlier
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true
        }
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const pcmFloat = inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(pcmFloat.length);
        for (let i = 0; i < pcmFloat.length; i++) {
          const sample = Math.max(-1, Math.min(1, pcmFloat[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // to base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const slice = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, slice);
        }
        const base64PCM = btoa(binary);

        // send
        try {
          sendAudioChunk({
            mimeType: 'audio/pcm;rate=16000',
            data: base64PCM,
            final: false
          });
        } catch (e) {
          console.error('Error sending audio chunk', e);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // keep refs globally for stop
      window.audioContext = audioContext;
      window.audioSource = source;
      window.audioProcessor = processor;
      window.audioStream = stream;
    } catch (error) {
      console.error('start recording error', error);
      setAudioError(error.message || 'Failed to start recording');
      setIsRecording(false);
      setIsTyping(false);
    }
  };

  const handleStopRecording = () => {
    try {
      if (window.audioProcessor) {
        window.audioProcessor.disconnect();
        window.audioProcessor = null;
      }
      if (window.audioSource) {
        window.audioSource.disconnect();
        window.audioSource = null;
      }
      if (window.audioContext) {
        window.audioContext.close();
        window.audioContext = null;
      }
      if (window.audioStream) {
        window.audioStream.getTracks().forEach(t => t.stop());
        window.audioStream = null;
      }

      // send final empty chunk to indicate end
      try {
        sendAudioChunk({ mimeType: 'audio/pcm', data: '', final: true });
      } catch (e) {
        console.error('Error sending final chunk', e);
      }

      setIsRecording(false);
      setIsTyping(false);
    } catch (err) {
      console.error('stop recording error', err);
    }
  };

  const handleConnect = async () => {
    try {
      await startSession();
    } catch (e) {
      console.error('startSession failed', e);
    }
  };

  const handleDisconnect = async () => {
    if (isRecording) handleStopRecording();
    try {
      await endSession();
      disconnect();
    } catch (e) {
      console.error('endSession failed', e);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = {
      id: `user-text-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
      role: 'user'
    };
    pushMessageIfNew(userMessage);
    setInput('');
    setIsTyping(true);

    if (connectionStatus === 'session-active') {
      sendTextPart(input);
    } else {
      // simulated reply fallback
      setTimeout(() => {
        pushMessageIfNew({
          id: `bot-sim-${Date.now()}`,
          type: 'assistant',
          content: "This is an offline simulated reply.",
          timestamp: new Date()
        });
        setIsTyping(false);
      }, 1200);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { height: '600px', maxHeight: '80vh', borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            <AssistantIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>AI Health Assistant</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Voice-powered medical assistant</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button size="small" variant="contained" onClick={handleConnect} disabled={connectionStatus === 'session-active' || connectionStatus === 'connecting'} startIcon={<PlayArrowIcon />}>
            {connectionStatus === 'connecting' ? 'Connecting...' : connectionStatus === 'session-active' ? 'Session Active' : 'Start Session'}
          </Button>
          <Button size="small" variant="contained" onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={connectionStatus !== 'session-active'} startIcon={<MicIcon />}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <Button size="small" variant="contained" onClick={handleDisconnect} disabled={connectionStatus === 'disconnected' || connectionStatus === 'connecting'} startIcon={<StopIcon />}>
            {connectionStatus === 'disconnected' ? 'Session Ended' : 'End Session'}
          </Button>
          <Typography variant="caption" sx={{ color: 'white', ml: 1 }}>{`Status: ${connectionStatus}`}</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '500px' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ alignItems: 'flex-start', px: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: message.type === 'assistant' ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                    {message.type === 'assistant' ? <AssistantIcon /> : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {message.type === 'assistant' ? 'Health Assistant' : 'You'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{message.timestamp.toLocaleTimeString()}</Typography>
                    </Box>
                  }
                  secondary={
                    <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: message.type === 'assistant' ? 'grey.50' : 'primary.light', borderRadius: 2 }}>
                      <Typography variant="body2">{message.content}</Typography>
                    </Paper>
                  }
                />
              </ListItem>
            ))}
            {isTyping && (
              <ListItem sx={{ alignItems: 'flex-start', px: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}><AssistantIcon /></Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Health Assistant</Typography>}
                  secondary={<Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: 'grey.50', borderRadius: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={16} /><Typography variant="body2" color="text.secondary">Thinking...</Typography></Box></Paper>}
                />
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Type your message or use voice commands..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSend} disabled={!input.trim() || isTyping} color="primary">
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
