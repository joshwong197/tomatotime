
export class AudioService {
  private ctx: AudioContext | null = null;
  private ambienceNodes: AudioScheduledSourceNode[] = [];
  private ambienceGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playChime() {
    const ctx = this.init();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const frequencies = [880, 1320, 1760, 2640];
    const gains = [0.4, 0.2, 0.1, 0.05];
    const decays = [1.5, 0.8, 0.4, 0.2];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gains[i], now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[i]);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decays[i] + 0.1);
    });
  }

  public stopAmbience() {
    this.ambienceNodes.forEach(node => {
        try { node.stop(); } catch (e) {}
        try { node.disconnect(); } catch (e) {}
    });
    this.ambienceNodes = [];
    if (this.ambienceGain) {
        this.ambienceGain.disconnect();
        this.ambienceGain = null;
    }
  }

  public startAmbience(type: 'rain' | 'wind') {
    const ctx = this.init();
    if (!ctx) return;

    this.stopAmbience();

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate Noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
            // Pink-ish noise for rain
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        } else {
            // Brown-ish noise for wind (smoother)
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
            // Additional smoothing in post loop or filter could be added, 
            // but simply lowering frequency via lowpass filter below is effective
        }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to shape the tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'rain' ? 800 : 400; // Rain is brighter, wind is darker

    this.ambienceGain = ctx.createGain();
    this.ambienceGain.gain.value = 0.05; // Low volume background

    noise.connect(filter);
    filter.connect(this.ambienceGain);
    this.ambienceGain.connect(ctx.destination);

    noise.start();
    this.ambienceNodes.push(noise);
  }
}

export const audioService = new AudioService();
