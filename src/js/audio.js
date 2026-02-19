// Menu BGM: soft pad with gentle shimmer arpeggio (lighter than in-game track).
export function startMenuBgm() {
  if (menuBgmGain) return;
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  menuBgmGain = ctx.createGain();
  menuBgmGain.gain.setValueAtTime(0.0001, ctx.currentTime);

  menuBgmFilter = ctx.createBiquadFilter();
  menuBgmFilter.type = "lowpass";
  menuBgmFilter.frequency.setValueAtTime(1400, ctx.currentTime);
  menuBgmFilter.Q.value = 0.6;

  menuBgmFilter.connect(menuBgmGain);
  menuBgmGain.connect(ctx.destination);

  menuPadOsc = ctx.createOscillator();
  menuPadOsc.type = "triangle";
  menuPadOsc.frequency.setValueAtTime(220, ctx.currentTime); // A3 base

  menuLfo = ctx.createOscillator();
  menuLfo.type = "sine";
  menuLfo.frequency.setValueAtTime(0.35, ctx.currentTime);
  menuLfoGain = ctx.createGain();
  menuLfoGain.gain.setValueAtTime(10, ctx.currentTime);
  menuLfo.connect(menuLfoGain);
  menuLfoGain.connect(menuPadOsc.frequency);

  menuShimmerOsc = ctx.createOscillator();
  menuShimmerOsc.type = "sine";
  menuShimmerOsc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
  menuShimmerGain = ctx.createGain();
  menuShimmerGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  menuShimmerOsc.connect(menuShimmerGain);
  menuShimmerGain.connect(menuBgmFilter);

  menuPadOsc.connect(menuBgmFilter);

  menuPadOsc.start();
  menuLfo.start();
  menuShimmerOsc.start();

  const shimmerNotes = [659.25, 783.99, 880, 698.46]; // E5, G5, A5, F5
  let idx = 0;
  menuArpTimer = setInterval(() => {
    idx = (idx + 1) % shimmerNotes.length;
    const now = ctx.currentTime;
    menuShimmerOsc.frequency.setTargetAtTime(shimmerNotes[idx], now, 0.2);
    menuShimmerGain.gain.cancelScheduledValues(now);
    menuShimmerGain.gain.setValueAtTime(0.015, now);
    menuShimmerGain.gain.exponentialRampToValueAtTime(0.0002, now + 0.45);
  }, 1500);

  menuBgmGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1.0);
}

export function stopMenuBgm() {
  if (!menuBgmGain) return;
  const ctx = getCtx();
  menuBgmGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
  if (menuArpTimer) clearInterval(menuArpTimer);
  menuArpTimer = null;
  setTimeout(() => {
    try { menuPadOsc?.stop(); } catch (_) {}
    try { menuLfo?.stop(); } catch (_) {}
    try { menuShimmerOsc?.stop(); } catch (_) {}
    menuPadOsc = null;
    menuLfo = null;
    menuLfoGain = null;
    menuShimmerOsc = null;
    menuShimmerGain = null;
    menuBgmGain?.disconnect();
    menuBgmFilter?.disconnect();
    menuBgmGain = null;
    menuBgmFilter = null;
  }, 1000);
}
let audioCtx = null;
let gameBgmGain = null;
let gameBgmFilter = null;
let gameBgmOscillators = [];
let gameBgmChordTimer = null;

let menuBgmGain = null;
let menuBgmFilter = null;
let menuPadOsc = null;
let menuLfo = null;
let menuLfoGain = null;
let menuShimmerOsc = null;
let menuShimmerGain = null;
let menuArpTimer = null;

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

// Lightweight ambient BGM: brighter, cheerful pad progression.
const gameBgmChords = [
  [261.63, 329.63, 392.0], // C
  [349.23, 440.0, 523.25], // F
  [220.0, 261.63, 329.63], // Am
  [196.0, 246.94, 392.0], // G
];

function setChord(chord) {
  const ctx = getCtx();
  chord.forEach((freq, i) => {
    const osc = gameBgmOscillators[i];
    if (osc) {
      osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.8);
      osc.detune.setTargetAtTime((Math.random() - 0.5) * 6, ctx.currentTime, 1.5);
    }
  });
}

export function startGameBgm() {
  if (gameBgmGain) return; // already running
  const ctx = getCtx();

  // Ensure audio context is running (some browsers start suspended until user gesture).
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {/* ignore resume errors */});
  }

  gameBgmGain = ctx.createGain();
  gameBgmGain.gain.setValueAtTime(0.0001, ctx.currentTime);

  gameBgmFilter = ctx.createBiquadFilter();
  gameBgmFilter.type = "lowpass";
  gameBgmFilter.frequency.setValueAtTime(1800, ctx.currentTime);
  gameBgmFilter.Q.value = 0.9;

  gameBgmFilter.connect(gameBgmGain);
  gameBgmGain.connect(ctx.destination);

  gameBgmOscillators = [0, 1, 2].map(() => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.connect(gameBgmFilter);
    osc.start();
    return osc;
  });

  let idx = 0;
  setChord(gameBgmChords[idx]);
  gameBgmGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.6);

  gameBgmChordTimer = setInterval(() => {
    idx = (idx + 1) % gameBgmChords.length;
    setChord(gameBgmChords[idx]);
  }, 4800);
}

export function stopGameBgm() {
  if (!gameBgmGain) return;
  const ctx = getCtx();
  gameBgmGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

  if (gameBgmChordTimer) clearInterval(gameBgmChordTimer);
  gameBgmChordTimer = null;

  setTimeout(() => {
    gameBgmOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        /* noop */
      }
    });
    gameBgmOscillators = [];
    gameBgmGain?.disconnect();
    gameBgmFilter?.disconnect();
    gameBgmGain = null;
    gameBgmFilter = null;
  }, 1400);
}
