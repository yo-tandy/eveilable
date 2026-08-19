/* Procedural sound effects — WebAudio, no samples.
   Everything is synthesized: little wooden knocks, brass swishes, a sheep's bleat. */
(function () {
  'use strict';

  var MUTE_KEY = 'wolveswool.muted.v1';
  var ctx = null;
  var master = null;
  var muted = localStorage.getItem(MUTE_KEY) === '1';

  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* unlock on first gesture (autoplay policy) */
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, ensureCtx, { once: true, capture: true });
  });

  function now() { return ctx.currentTime; }

  /* a tone with pitch + gain envelopes */
  function tone(opts) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = opts.type || 'sine';
    var t0 = now() + (opts.delay || 0);
    var dur = opts.dur || 0.15;
    o.frequency.setValueAtTime(opts.f0, t0);
    if (opts.f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.gain || 0.2, t0 + (opts.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(opts.dest || master);
    o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }

  /* filtered noise burst */
  function noise(opts) {
    var dur = opts.dur || 0.2;
    var t0 = now() + (opts.delay || 0);
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var flt = ctx.createBiquadFilter();
    flt.type = opts.filter || 'bandpass';
    flt.frequency.setValueAtTime(opts.f0 || 800, t0);
    if (opts.f1) flt.frequency.exponentialRampToValueAtTime(opts.f1, t0 + dur);
    flt.Q.value = opts.q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.gain || 0.15, t0 + (opts.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt).connect(g).connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  var FX = {
    click: function () {
      tone({ type: 'square', f0: 1400, f1: 900, dur: 0.035, gain: 0.045 });
    },
    rotate: function () {
      noise({ f0: 500, f1: 1600, dur: 0.22, gain: 0.07, q: 2 });
      tone({ type: 'triangle', f0: 320, f1: 480, dur: 0.1, gain: 0.05, delay: 0.02 });
      tone({ type: 'square', f0: 1900, dur: 0.025, gain: 0.03, delay: 0.2 });
    },
    step: function () {
      /* wooden thump — a small herd of them */
      tone({ type: 'sine', f0: 150, f1: 55, dur: 0.13, gain: 0.28 });
      noise({ filter: 'lowpass', f0: 420, dur: 0.07, gain: 0.1 });
      tone({ type: 'sine', f0: 130, f1: 50, dur: 0.11, gain: 0.16, delay: 0.045 });
    },
    bump: function () {
      /* knocking on a crate */
      tone({ type: 'sine', f0: 95, f1: 45, dur: 0.1, gain: 0.26 });
      noise({ filter: 'lowpass', f0: 300, dur: 0.06, gain: 0.14 });
      tone({ type: 'triangle', f0: 240, f1: 120, dur: 0.05, gain: 0.08 });
    },
    slide: function () {
      /* brass skid */
      noise({ f0: 700, f1: 2400, dur: 0.28, gain: 0.09, q: 3, attack: 0.03 });
      tone({ type: 'sine', f0: 500, f1: 900, dur: 0.22, gain: 0.03 });
    },
    poof: function () {
      /* wolves undone — a soft pop and a puff */
      tone({ type: 'sine', f0: 300, f1: 70, dur: 0.16, gain: 0.22 });
      noise({ filter: 'highpass', f0: 1200, dur: 0.32, gain: 0.1, attack: 0.005 });
    },
    baa: function () {
      /* the sheep's complaint — vibrato saw, falling */
      var t0 = now();
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(240, t0);
      o.frequency.linearRampToValueAtTime(185, t0 + 0.42);
      var vib = ctx.createOscillator();
      vib.frequency.value = 9;
      var vibGain = ctx.createGain();
      vibGain.gain.value = 22;
      vib.connect(vibGain).connect(o.frequency);
      var flt = ctx.createBiquadFilter();
      flt.type = 'bandpass'; flt.frequency.value = 900; flt.Q.value = 1.2;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.05);
      g.gain.setValueAtTime(0.16, t0 + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.46);
      o.connect(flt).connect(g).connect(master);
      o.start(t0); vib.start(t0);
      o.stop(t0 + 0.5); vib.stop(t0 + 0.5);
    },
    win: function () {
      /* three-note brass toast */
      [[392, 0], [523.25, 0.14], [659.25, 0.28], [783.99, 0.42]].forEach(function (n) {
        tone({ type: 'triangle', f0: n[0], dur: 0.34, gain: 0.14, delay: n[1], attack: 0.02 });
        tone({ type: 'sawtooth', f0: n[0] / 2, dur: 0.3, gain: 0.04, delay: n[1], attack: 0.02 });
      });
    },
    lose: function () {
      tone({ type: 'sawtooth', f0: 220, f1: 110, dur: 0.7, gain: 0.09, attack: 0.05 });
      tone({ type: 'sawtooth', f0: 277, f1: 139, dur: 0.7, gain: 0.07, attack: 0.05 });
      tone({ type: 'sine', f0: 55, dur: 0.8, gain: 0.14, attack: 0.1 });
    }
  };

  window.Sound = {
    play: function (name) {
      if (muted) return;
      if (!ensureCtx()) return;
      var fx = FX[name];
      if (fx) { try { fx(); } catch (e) {} }
    },
    isMuted: function () { return muted; },
    toggleMute: function () {
      muted = !muted;
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
      if (master) master.gain.value = muted ? 0 : 1;
      return muted;
    }
  };
})();
