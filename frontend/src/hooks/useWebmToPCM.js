// src/hooks/useWebmToPCM.js
import { useState, useCallback } from 'react';
import realtimeService from '../services/gemini/GeminiRealtimeAudioService.js';

const float32To16BitPCM = (float32Array) => {
  const length = float32Array.length;
  const buffer = new ArrayBuffer(length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, slice);
  }
  return btoa(binary);
};

const safeDecodeAudioData = (audioContext, arrayBuffer) => {
  try {
    const maybe = audioContext.decodeAudioData(arrayBuffer);
    if (maybe && typeof maybe.then === 'function') return maybe;
  } catch (e) {}
  return new Promise((resolve, reject) => {
    try { audioContext.decodeAudioData(arrayBuffer, resolve, reject); } catch (err) { reject(err); }
  });
};

const mixChannelsToMono = (audioBuffer) => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  if (numberOfChannels === 1) return audioBuffer.getChannelData(0);
  const length = audioBuffer.length;
  const mixed = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < numberOfChannels; ch++) {
      sum += audioBuffer.getChannelData(ch)[i];
    }
    mixed[i] = sum / numberOfChannels;
  }
  return mixed;
};

const useWebmToPCM = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);

  const convertWebmToPCM = useCallback(async (webmBlob) => {
    setIsConverting(true);
    setError(null);
    let audioContext = null;
    try {
      if (!webmBlob || typeof webmBlob.arrayBuffer !== 'function') {
        throw new Error('Invalid Blob provided');
      }
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await safeDecodeAudioData(audioContext, arrayBuffer);
      const float32Mono = mixChannelsToMono(audioBuffer);
      const pcmBytes = float32To16BitPCM(float32Mono);
      const base64PCM = arrayBufferToBase64(pcmBytes.buffer);
      return { data: base64PCM, sampleRate: audioBuffer.sampleRate, channels: 1, mimeType: 'audio/pcm' };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert WebM to PCM');
      console.error('[useWebmToPCM] Conversion error:', err);
      return null;
    } finally {
      setIsConverting(false);
      if (audioContext) try { await audioContext.close(); } catch {}
    }
  }, []);

  const sendToBackend = useCallback(async (pcmResult, isFinal = false) => {
    if (!pcmResult || !pcmResult.data) { console.error('[useWebmToPCM] No PCM data to send'); return; }
    try {
      realtimeService.sendAudioChunk({ data: pcmResult.data, mimeType: pcmResult.mimeType, final: isFinal });
    } catch (err) {
      console.error('[useWebmToPCM] Error sending to backend:', err);
      setError('Failed to send audio to backend');
    }
  }, []);

  return { convertWebmToPCM, sendToBackend, isConverting, error };
};

export { useWebmToPCM };
