// src/services/audioService.js
const audioService = (() => {
  let audioContext = null;
  let initialized = false;
  const activeSources = new Set();

  async function initializeAudio() {
    if (initialized && audioContext) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Web Audio API not supported in this browser');
    audioContext = new AC();
    if (audioContext.state === 'suspended') {
      try { await audioContext.resume(); } catch {}
    }
    initialized = true;
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function safeDecodeAudioData(ac, arrayBuffer) {
    try {
      const decoded = ac.decodeAudioData(arrayBuffer);
      if (decoded && typeof decoded.then === 'function') return decoded;
    } catch (e) {}
    return new Promise((resolve, reject) => {
      try { ac.decodeAudioData(arrayBuffer, resolve, reject); } catch (err) { reject(err); }
    });
  }

  async function playAudioFromBase64(base64, { mimeHint } = {}) {
    if (!base64) throw new Error('No base64 audio provided');
    try {
      if (!audioContext) await initializeAudio();
      const arrayBuffer = base64ToArrayBuffer(base64);
      const audioBuffer = await safeDecodeAudioData(audioContext, arrayBuffer).catch(() => null);
      if (audioBuffer) {
        const src = audioContext.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(audioContext.destination);
        src.start(0);
        activeSources.add(src);
        src.onended = () => activeSources.delete(src);
        return;
      }
    } catch (err) {
      // fallback
    }

    try {
      const dataUrl = `data:${mimeHint || 'audio/webm'};base64,${base64}`;
      const audio = new Audio(dataUrl);
      try { await audio.play(); } catch (e) { /* ignore autoplay errors */ }
      return;
    } catch (err) {
      throw new Error('Failed to play audio');
    }
  }

  async function cleanup() {
    try {
      for (const s of Array.from(activeSources)) {
        try { s.stop?.(); } catch {}
        try { s.disconnect?.(); } catch {}
      }
      activeSources.clear();
      if (audioContext) {
        try { await audioContext.close(); } catch {}
      }
    } finally {
      audioContext = null;
      initialized = false;
    }
  }

  return { initializeAudio, playAudioFromBase64, cleanup };
})();

export default audioService;
