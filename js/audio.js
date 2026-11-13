// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - PROCEDURAL WEBAUDIO & RADIO ENGINE
// ============================================================================
window.CS = window.CS || {};

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.7;
    this.muted = false;
    this.noiseBuffer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Pre-generate 2 seconds of white noise buffer for gunshots & explosions
    const sr = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, sr * 2, sr);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
  }

  // Calculate stereo pan and distance attenuation relative to player camera
  getSpatialNodes(sourcePos, listenerPos, listenerForward, maxDist = 90) {
    this.init();
    if (!this.ctx) return null;

    const outGain = this.ctx.createGain();
    if (!sourcePos || !listenerPos) {
      outGain.gain.value = 1.0;
      outGain.connect(this.masterGain);
      return outGain;
    }

    const dx = sourcePos.x - listenerPos.x;
    const dy = (sourcePos.y || 0) - (listenerPos.y || 0);
    const dz = sourcePos.z - listenerPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > maxDist) return null;

    const atten = Math.max(0.03, Math.pow(1 - Math.min(dist / maxDist, 0.98), 1.55));
    outGain.gain.value = atten;

    if (this.ctx.createStereoPanner && listenerForward) {
      const panner = this.ctx.createStereoPanner();
      // Right vector = forward x up -> ( -forward.z, 0, forward.x )
      const rx = -listenerForward.z;
      const rz = listenerForward.x;
      const len = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
      const pan = Math.max(-0.95, Math.min(0.95, (dx * rx + dz * rz) / len));
      panner.pan.value = pan;
      outGain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      outGain.connect(this.masterGain);
    }
    return outGain;
  }

  playGunshot(soundType, sourcePos = null, listenerPos = null, listenerForward = null) {
    this.init();
    if (!this.ctx) return;
    const dest = this.getSpatialNodes(sourcePos, listenerPos, listenerForward, 110);
    if (!dest) return;

    const now = this.ctx.currentTime;

    if (soundType === 'knife') {
      // Crisp metallic blade slash
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(650, now + 0.12);
      filter.Q.value = 3.0;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      noise.connect(filter);
      filter.connect(g);
      g.connect(dest);
      noise.start(now);
      noise.stop(now + 0.14);
      return;
    }

    // Gun parameters by type
    const presets = {
      pistol_light:    { punchFreq: 190, punchEnd: 55, dur: 0.15, filterFreq: 1800, gain: 0.55, tail: 0.18 },
      pistol_silenced: { punchFreq: 150, punchEnd: 45, dur: 0.09, filterFreq: 900,  gain: 0.28, tail: 0.08 },
      pistol_med:      { punchFreq: 170, punchEnd: 48, dur: 0.18, filterFreq: 1650, gain: 0.65, tail: 0.22 },
      deagle:          { punchFreq: 130, punchEnd: 32, dur: 0.34, filterFreq: 1300, gain: 0.95, tail: 0.42 },
      smg:             { punchFreq: 210, punchEnd: 60, dur: 0.13, filterFreq: 2100, gain: 0.52, tail: 0.16 },
      smg_heavy:       { punchFreq: 165, punchEnd: 45, dur: 0.17, filterFreq: 1550, gain: 0.62, tail: 0.20 },
      shotgun:         { punchFreq: 105, punchEnd: 28, dur: 0.38, filterFreq: 1100, gain: 0.98, tail: 0.46 },
      shotgun_auto:    { punchFreq: 115, punchEnd: 32, dur: 0.32, filterFreq: 1250, gain: 0.90, tail: 0.38 },
      rifle_light:     { punchFreq: 160, punchEnd: 44, dur: 0.21, filterFreq: 1750, gain: 0.72, tail: 0.26 },
      rifle_silenced:  { punchFreq: 140, punchEnd: 42, dur: 0.11, filterFreq: 950,  gain: 0.32, tail: 0.10 },
      rifle_m4:        { punchFreq: 155, punchEnd: 40, dur: 0.23, filterFreq: 1850, gain: 0.78, tail: 0.28 },
      rifle_ak:        { punchFreq: 125, punchEnd: 34, dur: 0.28, filterFreq: 1450, gain: 0.92, tail: 0.35 },
      sniper_scout:    { punchFreq: 115, punchEnd: 30, dur: 0.38, filterFreq: 1500, gain: 0.95, tail: 0.48 },
      sniper_awp:      { punchFreq: 85,  punchEnd: 22, dur: 0.62, filterFreq: 1050, gain: 1.15, tail: 0.75 }
    };
    const p = presets[soundType] || presets.rifle_m4;

    // 1. Low-end chest punch oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(p.punchFreq, now);
    osc.frequency.exponentialRampToValueAtTime(p.punchEnd, now + p.dur * 0.65);
    oscGain.gain.setValueAtTime(p.gain * 0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + p.dur * 0.75);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(now);
    osc.stop(now + p.dur * 0.8);

    // 2. High-energy gunpowder crack & tail (filtered noise)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(p.filterFreq * 1.6, now);
    filter.frequency.exponentialRampToValueAtTime(p.filterFreq * 0.35, now + p.tail);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(p.gain, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + p.tail);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(dest);
    noise.start(now);
    noise.stop(now + p.tail + 0.02);

    // 3. Metallic bolt clack
    const clack = this.ctx.createOscillator();
    const clackGain = this.ctx.createGain();
    clack.type = 'square';
    clack.frequency.setValueAtTime(1150, now + 0.02);
    clack.frequency.exponentialRampToValueAtTime(340, now + 0.065);
    clackGain.gain.setValueAtTime(p.gain * 0.22, now + 0.02);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    clack.connect(clackGain);
    clackGain.connect(dest);
    clack.start(now + 0.02);
    clack.stop(now + 0.075);
  }

  playReloadStep(step = 'mag_out') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    if (step === 'mag_out') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (step === 'mag_in') {
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else {
      // bolt pull
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.11);
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playHitmarker(isHeadshot = false) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    if (isHeadshot) {
      // Iconic CS Helmet "Dink!" metallic ring
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2450, now);
      osc.frequency.exponentialRampToValueAtTime(1750, now + 0.14);
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.055);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playFootstep(surface = 'stone', sourcePos = null, listenerPos = null, listenerForward = null) {
    this.init();
    if (!this.ctx) return;
    const dest = this.getSpatialNodes(sourcePos, listenerPos, listenerForward, 38);
    if (!dest) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = surface === 'metal' ? 950 : (surface === 'wood' ? 420 : 620);
    filter.Q.value = 2.4;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    noise.connect(filter);
    filter.connect(g);
    g.connect(dest);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  playBombBeep(pitchFactor = 1.0, sourcePos = null, listenerPos = null, listenerForward = null) {
    this.init();
    if (!this.ctx) return;
    const dest = this.getSpatialNodes(sourcePos, listenerPos, listenerForward, 120);
    if (!dest) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2950 * pitchFactor, now);
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playExplosion(type = 'he', sourcePos = null, listenerPos = null, listenerForward = null) {
    this.init();
    if (!this.ctx) return;
    const dest = this.getSpatialNodes(sourcePos, listenerPos, listenerForward, 140);
    if (!dest) return;
    const now = this.ctx.currentTime;

    if (type === 'smoke') {
      // Hissing gas release
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.value = 1.2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
      noise.connect(filter);
      filter.connect(g);
      g.connect(dest);
      noise.start(now);
      noise.stop(now + 1.45);
      return;
    }

    if (type === 'flash') {
      // Sharp concussion bang
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.85, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      noise.connect(g);
      g.connect(dest);
      noise.start(now);
      noise.stop(now + 0.46);
      return;
    }

    // HE, Molotov or C4 Explosion
    const dur = type === 'c4' ? 1.8 : 0.95;
    const osc = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'c4' ? 95 : 115, now);
    osc.frequency.exponentialRampToValueAtTime(18, now + dur * 0.8);
    og.gain.setValueAtTime(1.1, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);
    osc.connect(og);
    og.connect(dest);
    osc.start(now);
    osc.stop(now + dur * 0.9);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + dur);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(1.0, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(dest);
    noise.start(now);
    noise.stop(now + dur + 0.05);
  }

  playFlashRing(intensity = 1.0) {
    this.init();
    if (!this.ctx || intensity <= 0.1) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 3950;
    const dur = Math.min(3.2, intensity * 2.8);
    g.gain.setValueAtTime(0.18 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  playUISound(type = 'click') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    if (type === 'tick') {
      // Authentic CS:GO / CS2 mechanical roulette card-pass tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1180, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.028);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (type === 'case_unlock') {
      // Metallic CS case key turn + latch pop
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(390, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'buy') {
      // Cash register / gear equip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.setValueAtTime(880, now + 0.055);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'unbox_win') {
      // Rare skin / knife drop fanfare chord
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const o = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.06);
        og.gain.setValueAtTime(0.22, now + idx * 0.06);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.9 + idx * 0.06);
        o.connect(og);
        og.connect(this.masterGain);
        o.start(now + idx * 0.06);
        o.stop(now + 0.95 + idx * 0.06);
      });
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  announce(text) {
    this.init();
    // Play a short tactical radio squelch beep
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.setValueAtTime(1920, now + 0.04);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    if ('speechSynthesis' in window && !this.muted) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = 1.05;
        utter.pitch = 0.82;
        utter.volume = Math.min(1, this.volume * 0.85);
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  }

  // ==========================================================================
  // PLAYER DEATH SOUND EFFECT
  // ==========================================================================
  playDeathSound(isHeadshot = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Dramatic low sub-bass body fall thud
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 185 : 135, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.55);
    g.gain.setValueAtTime(0.55, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);

    // Muffled impact noise burst
    const nSrc = this.ctx.createBufferSource();
    nSrc.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHeadshot ? 1400 : 720, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.45);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.35, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    nSrc.connect(filter);
    filter.connect(ng);
    ng.connect(this.masterGain);
    nSrc.start(now);
    nSrc.stop(now + 0.46);
  }

  playKillStreakSound(streak = 2) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const chordSets = {
      1: [440, 554.37],
      2: [523.25, 659.25, 783.99],
      3: [587.33, 739.99, 880, 1174.66],
      4: [659.25, 830.61, 987.77, 1318.51],
      5: [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
    };
    const notes = chordSets[Math.min(5, Math.max(1, streak))] || chordSets[2];

    notes.forEach((freq, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = streak >= 4 ? 'sawtooth' : 'triangle';
      const t0 = now + idx * 0.045;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(streak >= 5 ? 0.20 : 0.16, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (streak >= 5 ? 0.75 : 0.42));
      o.connect(g);
      g.connect(this.masterGain);
      o.start(t0);
      o.stop(t0 + (streak >= 5 ? 0.8 : 0.45));
    });
  }

  playShellClink() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 3100 + Math.random() * 650;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.045);
    g.gain.setValueAtTime(0.065, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // ==========================================================================
  // ZOMBIE SURVIVAL & MYSTERY BOX AUDIO
  // ==========================================================================
  playZombieGrowl(isBrute = false, sourcePos = null, listenerPos = null, listenerForward = null) {
    this.init();
    if (!this.ctx || this.muted) return;
    const dest = this.getSpatialNodes(sourcePos, listenerPos, listenerForward, 45);
    if (!dest) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    const base = isBrute ? 68 : (92 + Math.random() * 35);
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 0.68, now + 0.48);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBrute ? 320 : 540, now);
    g.gain.setValueAtTime(isBrute ? 0.28 : 0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  playZombieHit() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Sharp claw swipe + heavy impact
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + 0.18);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.42, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.21);

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.2);
    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playMysteryBoxTick(step = 0) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 987.77, 783.99];
    const freq = scale[step % scale.length];
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playPowerupPickup() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.055);
      g.gain.setValueAtTime(0.18, now + i * 0.055);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.25);
      o.connect(g);
      g.connect(this.masterGain);
      o.start(now + i * 0.055);
      o.stop(now + i * 0.055 + 0.27);
    });
  }

  playWaveStart(wave = 1) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = wave % 3 === 0 ? [110, 130.81, 164.81, 220] : [130.81, 164.81, 196.0];
    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(480, now);
      o.frequency.setValueAtTime(f, now + i * 0.09);
      g.gain.setValueAtTime(0.15, now + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
      o.connect(filt);
      filt.connect(g);
      g.connect(this.masterGain);
      o.start(now + i * 0.09);
      o.stop(now + 1.2);
    });
  }
}

CS.audio = new AudioManager();
