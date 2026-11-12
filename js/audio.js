/* ============================================================
   咒语旅团 THE SPELL BRIGADE — 程序化音频
   无外部素材，使用 WebAudio 实时合成。
   对外接口：window.SBAudio
     init(), music(track), sfx(name), getSettings(), setSettings(obj),
     set(part, enabled) / set({music,sfx}), toggleMusic(), toggleSfx(),
     setMusicEnabled(bool), setSfxEnabled(bool), isReady()
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'sb.audio.v1';
  var AudioCtx = window.AudioContext || window.webkitAudioContext;

  var ctx = null;
  var master = null;
  var musicBus = null;
  var sfxBus = null;
  var reverb = null;
  var reverbSend = null;
  var started = false;
  var state = {
    music: true,
    sfx: true
  };

  var currentTrack = null;
  var pendingTrack = null;
  var nextNoteTime = 0;
  var step = 0;
  var scheduleTimer = null;
  var lastSfx = {};
  var noiseBuffer = null;
  var mutedByVisibility = false;

  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (typeof saved.music === 'boolean') state.music = saved.music;
    if (typeof saved.sfx === 'boolean') state.sfx = saved.sfx;
  } catch (e) {}

  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function createImpulse(seconds, decay) {
    var rate = ctx.sampleRate;
    var len = Math.max(1, Math.floor(rate * seconds));
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var data = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function createNoiseBuffer() {
    var len = Math.floor(ctx.sampleRate * 0.7);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function setupGraph() {
    master = ctx.createGain();
    master.gain.value = 0.82;

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 22;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.006;
    comp.release.value = 0.22;

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.28;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.72;

    reverb = ctx.createConvolver();
    reverb.buffer = createImpulse(2.4, 2.6);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.32;

    musicBus.connect(master);
    sfxBus.connect(master);
    musicBus.connect(reverbSend);
    sfxBus.connect(reverbSend);
    reverbSend.connect(reverb);
    reverb.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);

    noiseBuffer = createNoiseBuffer();
    applyEnabled();
  }

  function applyEnabled() {
    if (!ctx) return;
    var now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    sfxBus.gain.cancelScheduledValues(now);
    musicBus.gain.setTargetAtTime(state.music ? 0.28 : 0.0001, now, 0.08);
    sfxBus.gain.setTargetAtTime(state.sfx ? 0.72 : 0.0001, now, 0.08);
    if (!state.music) stopScheduler();
    else if (currentTrack) startScheduler();
  }

  function init() {
    if (started) {
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return true;
    }
    if (!AudioCtx) return false;
    try {
      ctx = new AudioCtx();
      setupGraph();
      started = true;
      try { ctx.resume(); } catch (e) {}
      if (pendingTrack) {
        var t = pendingTrack;
        pendingTrack = null;
        music(t);
      } else if (state.music) {
        music('home');
      }
      document.addEventListener('visibilitychange', onVisibility);
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  function onVisibility() {
    if (!ctx) return;
    if (document.hidden) {
      if (ctx.state === 'running') {
        mutedByVisibility = true;
        ctx.suspend();
      }
    } else if (mutedByVisibility) {
      mutedByVisibility = false;
      ctx.resume();
    }
  }

  /* ---------- synth primitives ---------- */

  function now() { return ctx.currentTime; }

  function envGain(t, attack, dur, peak) {
    var g = ctx.createGain();
    var p = Math.max(0.0001, peak);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(p, t + Math.max(0.003, attack));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }

  function tone(opts) {
    if (!ctx || !state.sfx && !opts.music) return;
    var t = opts.t !== undefined ? opts.t : now();
    var dur = opts.dur || 0.15;
    var osc = ctx.createOscillator();
    var gain = envGain(t, opts.attack || 0.008, dur, opts.gain || 0.2);
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, opts.freq || 440), t);
    if (opts.endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), t + dur);
    var dest = gain;
    if (opts.filter) {
      var f = ctx.createBiquadFilter();
      f.type = opts.filter;
      f.frequency.setValueAtTime(opts.cutoff || 1200, t);
      if (opts.cutoffEnd) f.frequency.exponentialRampToValueAtTime(Math.max(40, opts.cutoffEnd), t + dur);
      f.Q.value = opts.q || 0.8;
      gain.connect(f);
      dest = f;
    }
    osc.connect(gain);
    dest.connect(opts.bus || sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.04);
    osc.onended = function () { try { osc.disconnect(); gain.disconnect(); if (dest !== gain) dest.disconnect(); } catch (e) {} };
  }

  function noise(opts) {
    if (!ctx || !noiseBuffer) return;
    var t = opts.t !== undefined ? opts.t : now();
    var dur = opts.dur || 0.12;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.playbackRate.value = opts.rate || 1;
    var filter = ctx.createBiquadFilter();
    filter.type = opts.filter || 'bandpass';
    filter.frequency.setValueAtTime(opts.freq || 1000, t);
    if (opts.endFreq) filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.endFreq), t + dur);
    filter.Q.value = opts.q || 0.9;
    var gain = envGain(t, opts.attack || 0.006, dur, opts.gain || 0.15);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(opts.bus || sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
    src.onended = function () { try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) {} };
  }

  var SFX = {
    'ui-click': function () {
      tone({ freq: 640, endFreq: 920, type: 'triangle', dur: 0.055, gain: 0.12 });
    },
    'ui-confirm': function () {
      tone({ freq: 520, type: 'triangle', dur: 0.09, gain: 0.13 });
      tone({ freq: 780, type: 'triangle', dur: 0.16, gain: 0.11, t: now() + 0.07 });
    },
    'ui-back': function () {
      tone({ freq: 420, endFreq: 280, type: 'triangle', dur: 0.12, gain: 0.1 });
    },
    'shoot-fire': function () {
      noise({ freq: 1500, endFreq: 400, dur: 0.09, gain: 0.08, q: 0.7 });
      tone({ freq: 240, endFreq: 90, type: 'sawtooth', dur: 0.1, gain: 0.07 });
    },
    'shoot-ice': function () {
      tone({ freq: 980, endFreq: 1560, type: 'sine', dur: 0.11, gain: 0.055 });
      noise({ freq: 3200, dur: 0.06, gain: 0.03, filter: 'highpass' });
    },
    'shoot-lightning': function () {
      tone({ freq: 1400, endFreq: 220, type: 'square', dur: 0.07, gain: 0.04 });
      noise({ freq: 2400, endFreq: 600, dur: 0.07, gain: 0.05 });
    },
    'shoot-acid': function () {
      tone({ freq: 330, endFreq: 140, type: 'square', dur: 0.1, gain: 0.05 });
      noise({ freq: 700, endFreq: 300, dur: 0.12, gain: 0.06, filter: 'lowpass' });
    },
    'hit': function () {
      noise({ freq: 900, endFreq: 300, dur: 0.05, gain: 0.055, filter: 'bandpass' });
    },
    'enemy-die': function () {
      tone({ freq: 170, endFreq: 50, type: 'triangle', dur: 0.18, gain: 0.1 });
      noise({ freq: 500, endFreq: 160, dur: 0.16, gain: 0.06, filter: 'lowpass' });
    },
    'pickup': function () {
      tone({ freq: 820, type: 'sine', dur: 0.06, gain: 0.05 });
      tone({ freq: 1230, type: 'sine', dur: 0.1, gain: 0.04, t: now() + 0.04 });
    },
    'level-up': function () {
      var base = now();
      [523, 659, 784, 1046, 1318].forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.34, gain: 0.09, t: base + i * 0.075 });
      });
      noise({ freq: 4600, endFreq: 2200, dur: 0.5, gain: 0.03, filter: 'highpass', t: base });
    },
    'hurt': function () {
      tone({ freq: 110, endFreq: 60, type: 'sawtooth', dur: 0.22, gain: 0.14, filter: 'lowpass', cutoff: 500 });
      noise({ freq: 500, endFreq: 120, dur: 0.2, gain: 0.08, filter: 'lowpass' });
    },
    'dash': function () {
      noise({ freq: 700, endFreq: 2600, dur: 0.18, gain: 0.1, filter: 'bandpass', q: 1.3 });
    },
    'boss-roar': function () {
      var t = now();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      var f = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.linearRampToValueAtTime(42, t + 0.9);
      osc.frequency.linearRampToValueAtTime(55, t + 1.3);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(700, t);
      f.frequency.exponentialRampToValueAtTime(180, t + 1.2);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(f); f.connect(g); g.connect(sfxBus);
      osc.start(t); osc.stop(t + 1.45);
      noise({ freq: 220, endFreq: 80, dur: 1.1, gain: 0.09, filter: 'lowpass' });
      tone({ freq: 90, endFreq: 48, type: 'sine', dur: 1.3, gain: 0.1 });
    },
    'wave': function () {
      var t = now();
      tone({ freq: 196, type: 'sine', dur: 1.6, gain: 0.1, t: t });
      tone({ freq: 294, type: 'sine', dur: 1.4, gain: 0.08, t: t + 0.03 });
      tone({ freq: 392, type: 'triangle', dur: 1.1, gain: 0.05, t: t + 0.06 });
    },
    'victory': function () {
      var base = now();
      [392, 523, 659, 784, 1046].forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.9, gain: 0.08, t: base + i * 0.16 });
        tone({ freq: f * 2, type: 'sine', dur: 0.5, gain: 0.025, t: base + i * 0.16 });
      });
    },
    'defeat': function () {
      var base = now();
      [392, 349, 294, 220].forEach(function (f, i) {
        tone({ freq: f, endFreq: f * 0.86, type: 'triangle', dur: 1.0, gain: 0.09, t: base + i * 0.25 });
      });
      noise({ freq: 260, endFreq: 80, dur: 1.8, gain: 0.05, filter: 'lowpass' });
    }
  };

  function sfx(name) {
    if (!ctx || !state.sfx || !started) return;
    var fn = SFX[name];
    if (!fn) return;
    var t = ctx.currentTime;
    var throttle = name === 'hit' ? 0.045 : name === 'pickup' ? 0.06 : 0.03;
    if (lastSfx[name] && t - lastSfx[name] < throttle) return;
    lastSfx[name] = t;
    try { fn(); } catch (e) {}
  }

  /* ---------- procedural music ---------- */

  var TRACKS = {
    home: { bpm: 68, steps: 16, volume: 0.22 },
    battle: { bpm: 108, steps: 16, volume: 0.24 },
    result: { bpm: 62, steps: 16, volume: 0.2 }
  };

  var THEMES = {
    home: {
      root: 'D',
      scale: [0, 2, 3, 5, 7, 10, 12, 14, 15, 17, 19, 22],
      bass: [0, 0, -5, -5, -3, -3, -7, -7],
      pad: [[0, 3, 7], [0, 3, 7], [-5, -1, 2], [-5, -1, 2], [-3, 0, 4], [-3, 0, 4], [-7, -3, 0], [-7, -3, 0]]
    },
    battle: {
      root: 'A',
      scale: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19],
      bass: [0, 0, 3, 0, -2, -2, -5, -5],
      pad: [[0, 3, 7], [0, 3, 8], [-2, 2, 5], [-2, 2, 7], [-5, 0, 3], [-5, 0, 4], [-3, 2, 7], [-3, 2, 6]]
    },
    result: {
      root: 'F',
      scale: [0, 2, 3, 5, 7, 10, 12, 14, 15, 17, 19, 22],
      bass: [0, 0, -2, -2, -4, -4, -5, -5],
      pad: [[0, 4, 7], [0, 4, 9], [-2, 2, 5], [-2, 2, 7], [-4, 0, 5], [-4, 0, 7], [-5, 0, 4], [-5, 0, 7]]
    }
  };

  var ROOT_HZ = { A: 110, C: 130.81, D: 146.83, E: 164.81, F: 174.61, G: 196 };

  function noteFreq(root, semitone) {
    return (ROOT_HZ[root] || 110) * Math.pow(2, semitone / 12);
  }

  function padChord(freqs, t, dur, gain, type) {
    for (var i = 0; i < freqs.length; i++) {
      tone({
        freq: freqs[i],
        type: type || 'triangle',
        dur: dur,
        gain: gain || 0.028,
        attack: 0.5,
        t: t,
        bus: musicBus,
        music: true,
        filter: 'lowpass',
        cutoff: 900,
        cutoffEnd: 500,
        q: 0.5
      });
    }
  }

  function scheduleStep(track, theme, stepIndex, time) {
    var config = TRACKS[track];
    var beat = 60 / config.bpm;
    var stepDur = beat / 4;
    var s = stepIndex % 16;
    var bar = Math.floor(stepIndex / 16) % theme.bass.length;

    if (track === 'home') {
      // sparse music-box melody
      if (s % 2 === 0) {
        var note = theme.scale[Math.floor(Math.random() * theme.scale.length)];
        var oct = Math.random() < 0.22 ? 2 : 1;
        tone({
          freq: noteFreq(theme.root, note) * oct,
          type: 'sine',
          dur: stepDur * 3.2,
          gain: 0.035,
          attack: 0.02,
          t: time,
          bus: musicBus,
          music: true
        });
      }
      if (s === 0) {
        var chord = theme.pad[bar % theme.pad.length].map(function (n) { return noteFreq(theme.root, n); });
        padChord(chord, time, beat * 6, 0.024, 'triangle');
        tone({
          freq: noteFreq(theme.root, theme.bass[bar % theme.bass.length]) * 0.5,
          type: 'sine', dur: beat * 4, gain: 0.05, attack: 0.6, t: time, bus: musicBus, music: true
        });
      }
      if (s === 8 && Math.random() < 0.5) {
        tone({ freq: 2637, type: 'sine', dur: 0.9, gain: 0.012, t: time, bus: musicBus, music: true });
      }
      return;
    }

    if (track === 'result') {
      if (s === 0) {
        var resChord = theme.pad[bar % theme.pad.length].map(function (n) { return noteFreq(theme.root, n); });
        padChord(resChord, time, beat * 6.5, 0.03, 'sine');
        tone({
          freq: noteFreq(theme.root, theme.bass[bar % theme.bass.length]) * 0.5,
          type: 'triangle', dur: beat * 5, gain: 0.045, attack: 0.9, t: time, bus: musicBus, music: true
        });
      }
      if (s === 10 && bar % 2 === 0) {
        tone({ freq: noteFreq(theme.root, theme.scale[4]) * 2, type: 'sine', dur: 1.6, gain: 0.03, t: time, bus: musicBus, music: true });
      }
      return;
    }

    // battle track
    if (s === 0 || s === 6 || s === 8) {
      // kick
      tone({ freq: 120, endFreq: 42, type: 'sine', dur: 0.18, gain: 0.14, t: time, bus: musicBus, music: true });
    }
    if (s === 4 || s === 12) {
      noise({ freq: 1600, endFreq: 500, dur: 0.12, gain: 0.05, filter: 'bandpass', t: time, bus: musicBus });
    }
    if (s % 2 === 0) {
      noise({ freq: 7600, dur: 0.03, gain: 0.012, filter: 'highpass', t: time, bus: musicBus });
    }
    if (s === 0 || s === 4 || s === 8 || s === 12) {
      tone({
        freq: noteFreq(theme.root, theme.bass[bar % theme.bass.length]) * 0.5,
        type: 'sawtooth',
        dur: stepDur * 2.4,
        gain: 0.028,
        attack: 0.01,
        t: time,
        bus: musicBus,
        music: true,
        filter: 'lowpass',
        cutoff: 320,
        cutoffEnd: 180
      });
    }
    if (s === 0) {
      var battlePad = theme.pad[bar % theme.pad.length].map(function (n) { return noteFreq(theme.root, n); });
      padChord(battlePad, time, beat * 4, 0.012, 'triangle');
    }
    if (s === 2 || s === 7 || s === 10 || s === 14) {
      if (Math.random() < 0.7) {
        var lead = theme.scale[Math.floor(Math.random() * theme.scale.length)];
        tone({
          freq: noteFreq(theme.root, lead) * 2,
          type: 'square',
          dur: stepDur * 1.2,
          gain: 0.012,
          attack: 0.01,
          t: time,
          bus: musicBus,
          music: true,
          filter: 'lowpass',
          cutoff: 2200,
          cutoffEnd: 1100
        });
      }
    }
  }

  function scheduler() {
    if (!ctx || !currentTrack || !state.music) return;
    var config = TRACKS[currentTrack];
    var stepDur = (60 / config.bpm) / 4;
    var horizon = ctx.currentTime + 0.35;
    var guard = 0;
    while (nextNoteTime < horizon && guard < 64) {
      scheduleStep(currentTrack, THEMES[currentTrack], step, nextNoteTime);
      nextNoteTime += stepDur;
      step++;
      guard++;
    }
  }

  function startScheduler() {
    if (scheduleTimer) return;
    if (!ctx) return;
    nextNoteTime = Math.max(ctx.currentTime + 0.06, nextNoteTime || 0);
    scheduleTimer = setInterval(scheduler, 120);
    scheduler();
  }

  function stopScheduler() {
    if (scheduleTimer) {
      clearInterval(scheduleTimer);
      scheduleTimer = null;
    }
  }

  function music(track) {
    if (!started) {
      pendingTrack = track;
      return;
    }
    if (!ctx) return;
    if (!TRACKS[track]) {
      stopMusic();
      return;
    }
    if (currentTrack === track) {
      if (state.music) startScheduler();
      return;
    }
    var wasEnabled = state.music;
    if (wasEnabled) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
    }
    currentTrack = track;
    step = 0;
    nextNoteTime = ctx.currentTime + 0.18;
    setTimeout(function () {
      if (!ctx || currentTrack !== track) return;
      if (state.music) {
        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.setTargetAtTime(0.28, ctx.currentTime, 0.15);
        startScheduler();
      }
    }, 130);
  }

  function stopMusic() {
    stopScheduler();
    currentTrack = null;
    if (ctx) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
    }
  }

  function setSettings(patch) {
    if (!patch) return;
    if (typeof patch.music === 'boolean') state.music = patch.music;
    if (typeof patch.sfx === 'boolean') state.sfx = patch.sfx;
    saveState();
    if (!ctx) return;
    applyEnabled();
  }

  function set(part, value) {
    if (typeof part === 'object' && part) return setSettings(part);
    if (part === 'music' || part === 'sfx') {
      var patch = {};
      patch[part] = !!value;
      setSettings(patch);
    }
  }

  function setMusicEnabled(v) { setSettings({ music: !!v }); }
  function setSfxEnabled(v) { setSettings({ sfx: !!v }); }
  function toggleMusic() { setSettings({ music: !state.music }); return state.music; }
  function toggleSfx() { setSettings({ sfx: !state.sfx }); return state.sfx; }
  function getSettings() { return { music: state.music, sfx: state.sfx }; }
  function isReady() { return started && !!ctx; }

  window.SBAudio = {
    init: init,
    music: music,
    stopMusic: stopMusic,
    sfx: sfx,
    getSettings: getSettings,
    setSettings: setSettings,
    set: set,
    setMusicEnabled: setMusicEnabled,
    setSfxEnabled: setSfxEnabled,
    toggleMusic: toggleMusic,
    toggleSfx: toggleSfx,
    isReady: isReady
  };
})();
