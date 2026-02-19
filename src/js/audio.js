let audioCtx = null;

function getCtx() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = "sine", volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.05) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

export function playPour() {
  playNoise(0.15, 0.04);
  playTone(200 + Math.random() * 100, 0.1, "sine", 0.03);
}

export function playSuccess() {
  playTone(523, 0.12, "sine", 0.12);
  setTimeout(() => playTone(659, 0.12, "sine", 0.12), 100);
  setTimeout(() => playTone(784, 0.2, "sine", 0.15), 200);
  setTimeout(() => playTone(1047, 0.3, "sine", 0.1), 320);
}

export function playFail() {
  playTone(392, 0.15, "sawtooth", 0.08);
  setTimeout(() => playTone(311, 0.15, "sawtooth", 0.08), 120);
  setTimeout(() => playTone(261, 0.3, "sawtooth", 0.06), 240);
}

export function playTimerLow() {
  playTone(880, 0.08, "square", 0.06);
  setTimeout(() => playTone(880, 0.08, "square", 0.06), 150);
}

export function playAchievement() {
  playTone(659, 0.1, "sine", 0.12);
  setTimeout(() => playTone(784, 0.1, "sine", 0.12), 80);
  setTimeout(() => playTone(1047, 0.15, "sine", 0.12), 160);
  setTimeout(() => playTone(1319, 0.3, "sine", 0.1), 260);
}

export function playDecrement() {
  playTone(440, 0.06, "triangle", 0.06);
  setTimeout(() => playTone(349, 0.08, "triangle", 0.05), 60);
}
