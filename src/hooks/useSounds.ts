'use client';
// ============================================================================
// Pablo Card Game — Sound Effects Hook
// ============================================================================

import { useCallback, useRef, useEffect } from 'react';

// Sound effect types
type SoundType =
  | 'card_flip'
  | 'card_deal'
  | 'card_shuffle'
  | 'card_place'
  | 'pablo_call'
  | 'turn_start'
  | 'special_ability'
  | 'game_over'
  | 'button_click'
  | 'error'
  | 'success'
  | 'timer_tick';

// Web Audio API based sound effects (no external files needed)
class SoundEngine {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  play(type: SoundType) {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      switch (type) {
        case 'card_flip':
          this.playCardFlip(ctx);
          break;
        case 'card_deal':
          this.playCardDeal(ctx);
          break;
        case 'card_shuffle':
          this.playCardShuffle(ctx);
          break;
        case 'card_place':
          this.playCardPlace(ctx);
          break;
        case 'pablo_call':
          this.playPabloCall(ctx);
          break;
        case 'turn_start':
          this.playTurnStart(ctx);
          break;
        case 'special_ability':
          this.playSpecialAbility(ctx);
          break;
        case 'game_over':
          this.playGameOver(ctx);
          break;
        case 'button_click':
          this.playButtonClick(ctx);
          break;
        case 'error':
          this.playError(ctx);
          break;
        case 'success':
          this.playSuccess(ctx);
          break;
        case 'timer_tick':
          this.playTimerTick(ctx);
          break;
      }
    } catch {
      // Silently fail — sound is non-essential
    }
  }

  private createGain(ctx: AudioContext, volume?: number): GainNode {
    const gain = ctx.createGain();
    gain.gain.value = (volume ?? 1) * this.volume;
    gain.connect(ctx.destination);
    return gain;
  }

  private playCardFlip(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.4);
    // Quick snap sound
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);

    // Noise burst for paper-like sound
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.createGain(ctx, 0.15);
    noise.connect(noiseGain);
    noise.start(ctx.currentTime);
  }

  private playCardDeal(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.3);
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.connect(gain);
    noise.start(ctx.currentTime);
  }

  private playCardShuffle(ctx: AudioContext) {
    // Multiple rapid card sounds
    for (let i = 0; i < 5; i++) {
      const gain = this.createGain(ctx, 0.15);
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / bufferSize, 2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(gain);
      noise.start(ctx.currentTime + i * 0.06);
    }
  }

  private playCardPlace(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.35);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  private playPabloCall(ctx: AudioContext) {
    // Triumphant fanfare
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const gain = this.createGain(ctx, 0.4);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  }

  private playTurnStart(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.25);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  private playSpecialAbility(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.35);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }

  private playGameOver(ctx: AudioContext) {
    const notes = [523.25, 493.88, 440, 392, 349.23, 329.63, 293.66, 261.63];
    notes.forEach((freq, i) => {
      const gain = this.createGain(ctx, 0.3);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  }

  private playButtonClick(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.2);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 600;
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  private playError(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.3);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  private playSuccess(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.25);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  private playTimerTick(ctx: AudioContext) {
    const gain = this.createGain(ctx, 0.1);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.02);
  }
}

// Singleton
let soundEngineInstance: SoundEngine | null = null;

function getSoundEngine(): SoundEngine {
  if (!soundEngineInstance) {
    soundEngineInstance = new SoundEngine();
  }
  return soundEngineInstance;
}

export function useSounds() {
  const engineRef = useRef<SoundEngine>(null);

  useEffect(() => {
    engineRef.current = getSoundEngine();
  }, []);

  const play = useCallback((type: SoundType) => {
    engineRef.current?.play(type);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    engineRef.current?.setEnabled(enabled);
  }, []);

  const setVolume = useCallback((volume: number) => {
    engineRef.current?.setVolume(volume);
  }, []);

  return { play, setEnabled, setVolume };
}
