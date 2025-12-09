// src/hooks/useGeminiRealtime.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import audioService from '../services/gemini/GeminiRealtimeAudioService.js'; // <-- adjust path if needed

// Replace with your backend socket URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://medical-records-updates2.onrender.com/';

const DEFAULT_STATUS = 'disconnected';

export default function useGeminiRealtime() {
  const socketRef = useRef(null);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [serviceMessages, setServiceMessages] = useState([]);
  const [audioMessages, setAudioMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  const dedupeTextSet = useRef(new Set());
  const dedupeAudioSet = useRef(new Set());

  // Create/connect socket on mount
  useEffect(() => {
    mountedRef.current = true;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });
      console.debug('[useGeminiRealtime] socket created');
    }

    const s = socketRef.current;

    const onConnect = () => {
      console.debug('[useGeminiRealtime] socket connected', s.id);
      if (!mountedRef.current) return;
      setSocketConnected(true);
      // if we were in the process of connecting, keep that status
      setStatus(prev => (prev === 'connecting' ? prev : (startedRef.current ? 'session-active' : 'disconnected')));
    };

    const onDisconnect = (reason) => {
      console.log('[useGeminiRealtime] socket disconnected', reason);
      if (!mountedRef.current) return;
      setSocketConnected(false);
      setStatus('disconnected');
      startedRef.current = false;
    };

    const onSessionStarted = () => {
      console.debug('[useGeminiRealtime] session-started received');
      if (!mountedRef.current) return;
      setStatus('session-active');
      startedRef.current = true;
    };

    const onSessionClosed = (payload) => {
      console.log('[useGeminiRealtime] session-closed', payload);
      if (!mountedRef.current) return;
      setStatus('disconnected');
      startedRef.current = false;
    };

    const onSessionError = (err) => {
      console.log('[useGeminiRealtime] session-error', err);
      if (!mountedRef.current) return;
      setStatus('disconnected');
      startedRef.current = false;
      pushSystemMessage(`Session error: ${err?.message || JSON.stringify(err)}`);
    };

    const onTextPart = (payload) => {
      if (!payload || !payload.text) return;
      const user = payload.user || 'bot';
      const text = String(payload.text).trim();
      if (!text) return;

      const key = `${user}:${text}`;
      if (dedupeTextSet.current.has(key)) return;
      dedupeTextSet.current.add(key);
      if (dedupeTextSet.current.size > 200) {
        dedupeTextSet.current = new Set(Array.from(dedupeTextSet.current).slice(-100));
      }

      pushServiceMessage({
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: user === 'user' ? 'user' : 'assistant',
        content: text,
        timestamp: new Date(payload.timestamp || Date.now()),
        role: user === 'user' ? 'user' : 'assistant'
      });
    };

    const onAudioPart = (payload) => {
      if (!payload || !payload.audio || !payload.audio.data) return;
      const b64 = payload.audio.data;
      const shortHash = b64.slice(0, 40);
      if (dedupeAudioSet.current.has(shortHash)) return;
      dedupeAudioSet.current.add(shortHash);
      if (dedupeAudioSet.current.size > 200) {
        dedupeAudioSet.current = new Set(Array.from(dedupeAudioSet.current).slice(-100));
      }

      const msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: 'assistant',
        content: '(audio reply played)',
        audio: { data: b64, mimeType: payload.audio.mimeType },
        timestamp: new Date()
      };
      setAudioMessages(prev => [...prev, msg]);

      audioService.playAudioFromBase64(b64, { mimeHint: payload.audio.mimeType }).catch(err => {
        console.error('[useGeminiRealtime] audio play error', err);
      });
    };

    const onTurnCompleted = () => { pushSystemMessage('(turn-complete)'); };
    const onTurnInterrupted = () => { pushSystemMessage('(turn-interrupted)'); };

    // Attach listeners
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('session-started', onSessionStarted);
    s.on('session-closed', onSessionClosed);
    s.on('session-error', onSessionError);
    s.on('text-part', onTextPart);
    s.on('audio-part', onAudioPart);
    s.on('turn-completed', onTurnCompleted);
    s.on('turn-interrupted', onTurnInterrupted);

    return () => {
      mountedRef.current = false;
      try {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
        s.off('session-started', onSessionStarted);
        s.off('session-closed', onSessionClosed);
        s.off('session-error', onSessionError);
        s.off('text-part', onTextPart);
        s.off('audio-part', onAudioPart);
        s.off('turn-completed', onTurnCompleted);
        s.off('turn-interrupted', onTurnInterrupted);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const pushServiceMessage = useCallback((msg) => {
    setServiceMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.content === msg.content && last.type === msg.type) return prev;
      return [...prev, msg];
    });
  }, []);

  const pushSystemMessage = useCallback((text) => {
    setServiceMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: text,
      timestamp: new Date()
    }]);
  }, []);

  const startSession = useCallback(async (opts = {}) => {
    // Ensure socket exists; do not assume null means permanently gone
    if (!socketRef.current) {
      // Recreate socket if needed (listeners were attached in useEffect only for the first instance).
      // Safer approach: throw so consumer can remount hook; but in our flow we keep socketRef alive.
      throw new Error('Socket not initialized');
    }

    const s = socketRef.current;
    console.log('[useGeminiRealtime] startSession called, socket connected:', s.connected);

    if (startedRef.current) {
      console.log('[useGeminiRealtime] Session already active, skipping');
      return;
    }

    if (!s.connected) {
      console.log('[useGeminiRealtime] Socket not connected, waiting for connection...');
      setStatus('connecting');
      let connected = false;
      await new Promise((resolve, reject) => {
        const onConnect = () => {
          connected = true;
          s.off('connect', onConnect);
          resolve();
        };
        s.once('connect', onConnect);

        if (s.connect) {
          try { s.connect(); } catch (e) { /* ignore */ }
        }

        setTimeout(() => {
          s.off('connect', onConnect);
          if (!connected) {
            reject(new Error('Socket connect timeout'));
          }
        }, 8000);
      }).catch((err) => {
        console.error('[useGeminiRealtime] Socket connection failed:', err);
        setStatus('disconnected');
        throw err;
      });
    }

    setStatus('connecting');
    return new Promise((resolve, reject) => {
      let settled = false;

      const onStarted = () => {
        if (settled) return;
        settled = true;
        startedRef.current = true;
        setStatus('session-active');
        dedupeTextSet.current.clear();
        dedupeAudioSet.current.clear();
        resolve();
      };

      const onError = (err) => {
        if (settled) return;
        settled = true;
        setStatus('disconnected');
        startedRef.current = false;
        reject(err || new Error('session-error'));
      };

      s.once('session-started', onStarted);
      s.once('session-error', onError);

      try {
        console.log('[useGeminiRealtime] Emitting start-session with opts:', Object.keys(opts).length ? opts : '(no-opts)');
        s.emit('start-session', opts);
      } catch (e) {
        console.error('[useGeminiRealtime] Failed to emit start-session:', e);
        s.off('session-started', onStarted);
        s.off('session-error', onError);
        setStatus('disconnected');
        startedRef.current = false;
        reject(e);
      }

      setTimeout(() => {
        if (!settled) {
          s.off('session-started', onStarted);
          s.off('session-error', onError);
          startedRef.current = false;
          setStatus('disconnected');
          reject(new Error('session-start timeout'));
        }
      }, 10000);
    });
  }, []);

  const endSession = useCallback(async () => {
    if (!socketRef.current) return;
    try {
      socketRef.current.emit('end-session');
      startedRef.current = false;
      setStatus('disconnected');
    } catch (e) {
      console.error('[useGeminiRealtime] endSession error', e);
    }
  }, []);

  // IMPORTANT: do NOT set socketRef.current = null here. Keep the socket object so startSession can reconnect.
  const disconnect = useCallback(() => {
    if (!socketRef.current) return;
    try {
      // graceful disconnect but keep ref (so consumer can call startSession() again which uses s.connect())
      socketRef.current.disconnect();
    } catch (e) {
      console.warn('[useGeminiRealtime] disconnect() socket disconnect failed', e);
    } finally {
      setStatus('disconnected');
      // do NOT drop the socketRef.current to null — listeners remain attached, and `.connect()` will reuse it
      startedRef.current = false;
      setSocketConnected(false);
    }
  }, []);

  const sendTextPart = useCallback((text, medicalContext) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[useGeminiRealtime] cannot send text: socket not connected');
      return;
    }
    
    console.log('[useGeminiRealtime] sendTextPart called with:');
    console.log('- Text:', text);
    console.log('- Medical context length:', medicalContext?.length || 0);
    console.log('- Medical context preview:', medicalContext?.substring(0, 200) + '...');
    
    // Include medical context directly in the message if available
    let enhancedText = text;
    if (medicalContext && medicalContext.trim()) {
      enhancedText = `${medicalContext}\n\nUSER QUESTION: ${text}\n\nYou are a medical AI assistant. Answer the user's question using ONLY the medical data provided above. If they ask about RBC, hemoglobin, or any lab values, provide the exact results, dates, and reference ranges from their medical records. Be specific and detailed.`;
      console.log('[useGeminiRealtime] Enhanced text length:', enhancedText.length);
    } else {
      console.log('[useGeminiRealtime] No medical context available, sending text as-is');
    }
    
    socketRef.current.emit('send-text', enhancedText);
  }, []);

  const sendAudioChunk = useCallback((audioPayload) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[useGeminiRealtime] cannot send audio: socket not connected');
      return;
    }
    socketRef.current.emit('send-audio-chunk', audioPayload);
  }, []);

  return {
    status,
    socketConnected,
    messages: serviceMessages,
    audioMessages,
    startSession,
    endSession,
    sendAudioChunk,
    sendTextPart,
    disconnect
  };
}
