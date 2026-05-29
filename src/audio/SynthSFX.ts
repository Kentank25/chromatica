/**
 * SynthSFX - Procedural sound effects generator using the Web Audio API.
 * Contains stateless static play methods that construct, connect, and trigger audio nodes.
 */
export class SynthSFX {
  private static noiseBuffer: AudioBuffer | null = null;

  /**
   * Generates a shared white noise buffer for noise-based sound effects.
   */
  private static getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!SynthSFX.noiseBuffer) {
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      SynthSFX.noiseBuffer = buffer;
    }
    return SynthSFX.noiseBuffer;
  }

  /**
   * pour: filtered noise burst + sine sweep 200 -> 100 Hz, 200ms
   */
  static playPour(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;

    // 1. Filtered Noise Burst
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = SynthSFX.getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(destination);

    // 2. Sine Sweep
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(destination);

    // Play both
    noiseSource.start(now);
    noiseSource.stop(now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * success: ascending major triad C5-E5-G5, sine, 400ms total
   */
  static playSuccess(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.25;
    const overlap = 0.08;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * overlap);

      const gainNode = ctx.createGain();
      const startTime = now + idx * overlap;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

      osc.connect(gainNode);
      gainNode.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  /**
   * failure: descending minor 2nd Eb4 -> D4, sawtooth, 300ms
   */
  static playFailure(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    // Eb4 (311.13 Hz) -> D4 (293.66 Hz)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(311.13, now);
    osc.frequency.linearRampToValueAtTime(293.66, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * uiClick: 800 Hz sine, 30ms decay
   */
  static playUiClick(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * uiHover: 1200 Hz sine blip, 15ms, -20dB (volume * 0.1)
   */
  static playUiHover(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.1, now); // -20dB amplitude
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  /**
   * comboMilestone: ascending arpeggio C5-E5-G5-C6, 600ms total
   */
  static playComboMilestone(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.3;
    const overlap = 0.1;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * overlap);

      const gainNode = ctx.createGain();
      const startTime = now + idx * overlap;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

      osc.connect(gainNode);
      gainNode.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  /**
   * waveClear: C major chord C4-E4-G4, 1.2s warm decay
   */
  static playWaveClear(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
    const duration = 1.2;

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle'; // Smooth and organ-like
      osc.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + duration);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Client arrival sounds by client type
   */
  static playClientArrive(
    ctx: AudioContext,
    destination: AudioNode,
    type: 'wizard' | 'zombie' | 'villager' | 'noble',
    volume: number
  ): void {
    const now = ctx.currentTime;

    if (type === 'wizard') {
      // Wizard: Magical pentatonic sweep C5 -> D5 -> E5 -> G5 -> A5, 300ms
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        const gainNode = ctx.createGain();
        const startTime = now + idx * 0.05;
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);

        osc.connect(gainNode);
        gainNode.connect(destination);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } else if (type === 'zombie') {
      // Zombie: Low frequency rumbling growl (90 -> 70 Hz modulated)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.6);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);

      // Tremolo LFO to add growling texture
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(8, now); // 8 Hz wobble

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.2, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(volume * 0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(destination);

      lfo.start(now);
      lfo.stop(now + 0.65);
      osc.start(now);
      osc.stop(now + 0.65);
    } else {
      // Villager & Noble: Friendly chime (G4 -> C5)
      const notes = [392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const gainNode = ctx.createGain();
        const startTime = now + idx * 0.08;
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

        osc.connect(gainNode);
        gainNode.connect(destination);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    }
  }

  /**
   * achievementUnlock: sparkling major 7th chord C5-E5-G5-B5-C6 with bright decay and final G6 chime.
   */
  static playAchievementUnlock(ctx: AudioContext, destination: AudioNode, volume: number): void {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
    const noteDuration = 0.5;
    const overlap = 0.08;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle'; // Smooth, magical chime tone
      osc.frequency.setValueAtTime(freq, now + idx * overlap);

      const gainNode = ctx.createGain();
      const startTime = now + idx * overlap;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

      osc.connect(gainNode);
      gainNode.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });

    // High magic chime ping
    const chimeOsc = ctx.createOscillator();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(1567.98, now + 0.4); // G6
    
    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0.0001, now + 0.4);
    chimeGain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.42);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(destination);

    chimeOsc.start(now + 0.4);
    chimeOsc.stop(now + 0.9);
  }
}

