// src/utils/webmToPcm.js
export const float32To16BitPCM = (float32Array) => {
  const length = float32Array.length;
  const buffer = new ArrayBuffer(length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
};

export const arrayBufferToBase64 = (buffer) => {
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
    try {
      audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    } catch (err) { reject(err); }
  });
};

const mixToMono = (audioBuffer) => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  if (numberOfChannels === 1) return audioBuffer.getChannelData(0);
  const length = audioBuffer.length;
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < numberOfChannels; ch++) {
      sum += audioBuffer.getChannelData(ch)[i];
    }
    result[i] = sum / numberOfChannels;
  }
  return result;
};

export async function convertWebmBlobToPCM(webmBlob) {
  if (!webmBlob) throw new Error('No blob provided');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('Web Audio API not supported');

  const audioContext = new AC();
  try {
    if (audioContext.state === 'suspended') await audioContext.resume();
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await safeDecodeAudioData(audioContext, arrayBuffer);
    const float32Mono = mixToMono(audioBuffer);
    const pcmBytes = float32To16BitPCM(float32Mono);
    const base64PCM = arrayBufferToBase64(pcmBytes.buffer);
    return { data: base64PCM, sampleRate: audioBuffer.sampleRate, channels: 1, mimeType: 'audio/pcm' };
  } finally {
    try { await audioContext.close(); } catch {}
  }
}