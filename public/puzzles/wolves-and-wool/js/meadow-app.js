/* Meadow mode app: world rendering, steering input, game loop, HUD.
   Animals are fully 3D: CSS-box constructions (wooden-toy style) that rotate
   with their heading and are correct from every viewing angle. */
(function () {
  'use strict';

  var BEST_KEY = 'wolveswool.meadowbest.v1';
  var NUDGE_MS = 90;

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    scene: $('scene'), tilt: $('tilt'), world: $('mworld'),
    ground: $('mground'), pieces: $('mpieces'),
    hudLevel: $('hudLevel'), hudTime: $('hudTime'), hudBest: $('hudBest'),
    startOverlay: $('startOverlay'), startLevelName: $('startLevelName'),
    overlay: $('overlay'), overlayKicker: $('overlayKicker'),
    overlayTitle: $('overlayTitle'), overlayBody: $('overlayBody'),
    overlayActions: $('overlayActions'),
    levelsModal: $('levelsModal'), meadowList: $('meadowList'),
    helpModal: $('helpModal')
  };

  var SPEED_KEY = 'wolveswool.meadowspeed.v1';
  var levelIndex = 0, state = null;
  var running = false, paused = false, lastTs = 0;
  var speedScale = parseFloat(localStorage.getItem(SPEED_KEY)) || 1;
  if (!(speedScale > 0.3 && speedScale < 3)) speedScale = 1;
  var worldW = 0, worldH = 0;
  var charEls = {};
  var lastBumpSfx = 0, lastBaaSfx = 0;

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function px(v) { return v.toFixed(1) + 'px'; }
  function toWorld(x, y) { return { x: x + worldW / 2, y: y + worldH / 2 }; }

  /* ---------- ground SVG ---------- */

  function blobPath(fence, offset, samples) {
    var pts = [];
    for (var i = 0; i < samples; i++) {
      var th = (i / samples) * Math.PI * 2;
      var r = MeadowSim.fenceRadius(fence, th) + offset;
      var p = toWorld(fence.cx + Math.cos(th) * r, fence.cy + Math.sin(th) * r);
      pts.push(p.x.toFixed(1) + ' ' + p.y.toFixed(1));
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  function puddleBlob(p, seed) {
    var rand = rng(seed);
    var pts = [];
    var n = 14;
    for (var i = 0; i < n; i++) {
      var th = (i / n) * Math.PI * 2;
      var r = p.r * (0.82 + rand() * 0.3);
      var c = toWorld(p.x + Math.cos(th) * r, p.y + Math.sin(th) * r);
      pts.push(c.x.toFixed(1) + ' ' + c.y.toFixed(1));
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  function groundSVG(level) {
    var fence = level.fence;
    var rand = rng(1234 + levelIndex * 77);
    var svg = '<svg viewBox="0 0 ' + worldW + ' ' + worldH + '" xmlns="http://www.w3.org/2000/svg">';
    svg += '<defs>' +
      '<radialGradient id="gGrass" cx="46%" cy="40%" r="72%">' +
        '<stop offset="0%" stop-color="#87b562"/><stop offset="55%" stop-color="#6d9c4d"/>' +
        '<stop offset="88%" stop-color="#527d3c"/><stop offset="100%" stop-color="#44672f"/>' +
      '</radialGradient>' +
      '<radialGradient id="gPud" cx="42%" cy="36%" r="70%">' +
        '<stop offset="0%" stop-color="#b7d6ec"/><stop offset="55%" stop-color="#7fa9cd"/><stop offset="100%" stop-color="#54799e"/>' +
      '</radialGradient>' +
      '<filter id="gNoise"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" stitchTiles="stitch"/>' +
        '<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.28 0"/><feComposite operator="in" in2="SourceGraphic"/></filter>' +
      '<clipPath id="gClip"><path d="' + blobPath(fence, 0, 72) + '"/></clipPath>' +
    '</defs>';

    svg += '<path d="' + blobPath(fence, 12, 72) + '" fill="#4a3423"/>';
    svg += '<path d="' + blobPath(fence, 0, 72) + '" fill="url(#gGrass)"/>';
    svg += '<path d="' + blobPath(fence, 0, 72) + '" fill="#385a28" filter="url(#gNoise)" opacity=".5"/>';

    svg += '<g clip-path="url(#gClip)">';
    for (var i = 0; i < 110; i++) {
      var th = rand() * Math.PI * 2;
      var rr = Math.sqrt(rand()) * (fence.R0 * 0.92);
      var x = fence.cx + Math.cos(th) * rr, y = fence.cy + Math.sin(th) * rr;
      if (MeadowSim.fenceExcess(fence, x, y, 26) > 0) continue;
      var p = toWorld(x, y);
      var s = 0.7 + rand() * 0.9;
      if (rand() < 0.82) {
        svg += '<path d="M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) +
          ' m' + (-3 * s) + ' 0 q' + (1.5 * s) + ' ' + (-7 * s) + ' ' + (3 * s) + ' 0' +
          ' m' + (1 * s) + ' 0 q' + (1.5 * s) + ' ' + (-6 * s) + ' ' + (3 * s) + ' 0"' +
          ' stroke="#3f6631" stroke-width="' + (1.6 * s) + '" fill="none" stroke-linecap="round" opacity=".7"/>';
      } else {
        var col = rand() < 0.5 ? '#f3ead0' : '#e8c95c';
        svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (2.4 * s).toFixed(1) + '" fill="' + col + '" opacity=".9"/>';
      }
    }
    svg += '</g>';

    level.puddles.forEach(function (p, i) {
      svg += '<path d="' + puddleBlob({ x: p.x, y: p.y, r: p.r + 6 }, 500 + i) + '" fill="#3f5a44" opacity=".55"/>';
      svg += '<path d="' + puddleBlob(p, 900 + i) + '" fill="url(#gPud)"/>';
      var hl = toWorld(p.x - p.r * 0.25, p.y - p.r * 0.3);
      svg += '<ellipse cx="' + hl.x.toFixed(1) + '" cy="' + hl.y.toFixed(1) + '" rx="' + (p.r * 0.42).toFixed(1) +
        '" ry="' + (p.r * 0.2).toFixed(1) + '" fill="#eaf4fb" opacity=".45"/>';
    });

    svg += '<path d="' + blobPath(fence, 4, 72) + '" fill="none" stroke="#5a3a22" stroke-width="5" stroke-dasharray="24 14" opacity=".8"/>';
    svg += '</svg>';
    return svg;
  }

  /* ---------- 3D construction helpers ----------
     Local animal frame (inside the heading rotation): forward = -y, up = +z.
     A "standing face" is anchored at its top edge and hangs down; rz spins it
     about the vertical axis: 0 → normal +y (rear), 90 → -x, 180 → -y (front),
     270 → +x. */

  function sFace(w, h, tx, ty, tz, rz, bg, extra, inner) {
    return '<div class="f3" style="width:' + w + 'px;height:' + h + 'px;' +
      'transform:translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px) rotateZ(' + rz + 'deg) rotateX(-90deg);' +
      'background:' + bg + ';' + (extra || '') + '">' + (inner || '') + '</div>';
  }

  function tFace(w, d, tx, ty, tz, bg, extra) {
    return '<div class="f3" style="width:' + w + 'px;height:' + d + 'px;' +
      'transform:translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px);' +
      'background:' + bg + ';' + (extra || '') + '"></div>';
  }

  /* box footprint sx×sy centred at (cx,cy), from height z0 to z1.
     cols: {top, front, back, side}; front faces forward (-y). */
  function box3(cx, cy, sx, sy, z0, z1, cols, r, frontInner) {
    var h = z1 - z0;
    var rad = r ? 'border-radius:' + r + 'px;' : '';
    return (
      /* rear (+y) */  sFace(sx, h, cx - sx / 2, cy + sy / 2, z1, 0, cols.back, rad) +
      /* front (-y) */ sFace(sx, h, cx + sx / 2, cy - sy / 2, z1, 180, cols.front, rad, frontInner) +
      /* west (-x) */  sFace(sy, h, cx - sx / 2, cy - sy / 2, z1, 90, cols.side, rad) +
      /* east (+x) */  sFace(sy, h, cx + sx / 2, cy + sy / 2, z1, 270, cols.side, rad) +
      /* top */        tFace(sx, sy, cx - sx / 2, cy - sy / 2, z1, cols.top, rad)
    );
  }

  function legHTML(hx, hy, hz, sx, sy, len, cols, swingClass) {
    return '<div class="legpos" style="transform:translate3d(' + hx + 'px,' + hy + 'px,' + hz + 'px)">' +
      '<div class="' + swingClass + '">' + box3(0, 0, sx, sy, -len, 0, cols, 2) + '</div></div>';
  }

  function eyesHTML(w, iris, pupil) {
    /* dots for the head's front face (face-local coords) */
    var y = '38%';
    return '<i class="dot" style="left:22%;top:' + y + ';width:4.5px;height:4.5px;background:' + iris + '"></i>' +
           '<i class="dot" style="right:22%;top:' + y + ';width:4.5px;height:4.5px;background:' + iris + '"></i>' +
           '<i class="dot" style="left:26%;top:42%;width:2px;height:2px;background:' + pupil + '"></i>' +
           '<i class="dot" style="right:26%;top:42%;width:2px;height:2px;background:' + pupil + '"></i>';
  }

  function wolf3D() {
    var body = { top: '#98a4b3', front: '#7c8794', side: '#6b7684', back: '#5a636e' };
    var dark = { top: '#5a636e', front: '#4f5863', side: '#49525c', back: '#414a54' };
    var snout = { top: '#aab4c0', front: '#8d98a5', side: '#9aa5b1', back: '#9aa5b1' };
    return (
      /* torso */
      box3(0, 2, 20, 38, 13, 31, body, 5) +
      /* head, eyes on the front face */
      box3(0, -25, 17, 15, 22, 39, body, 4, eyesHTML(17, '#e2a63d', '#1c1410')) +
      /* snout with nose dot */
      box3(0, -35, 9, 8, 24, 31, snout, 2,
        '<i class="dot" style="left:32%;top:18%;width:3.4px;height:3px;background:#23282f"></i>') +
      /* ears */
      box3(-5.5, -22, 5, 4, 39, 46, dark, 1.5) +
      box3(5.5, -22, 5, 4, 39, 46, dark, 1.5) +
      /* tail (wags) */
      '<div class="legpos" style="transform:translate3d(0px,20px,24px)"><div class="tailwag3">' +
        box3(0, 7, 5, 14, 0, 6, dark, 2.5) +
      '</div></div>' +
      /* legs */
      legHTML(-6.5, -11, 14, 6, 6, 14, dark, 'legswingA') +
      legHTML(6.5, -11, 14, 6, 6, 14, dark, 'legswingB') +
      legHTML(-6.5, 13, 14, 6, 6, 14, dark, 'legswingB') +
      legHTML(6.5, 13, 14, 6, 6, 14, dark, 'legswingA')
    );
  }

  function sheep3D() {
    var wool = { top: '#f4eee0', front: '#e9e0cc', side: '#ded4bd', back: '#d3c8ae' };
    var woolHi = { top: '#faf5e9', front: '#f0e8d6', side: '#e6dcc7', back: '#dcd2b9' };
    var dark = { top: '#6d5c4f', front: '#5d4d41', side: '#55463c', back: '#4a3c33' };
    return (
      /* woolly torso + fluff slab */
      box3(0, 3, 24, 34, 11, 30, wool, 8) +
      box3(0, 3, 26, 36, 30, 37, woolHi, 10) +
      /* dark head, white eyes */
      box3(0, -21, 14, 12, 20, 34, dark, 3.5, eyesHTML(14, '#f7f3ea', '#241a10')) +
      /* wool cap on the head */
      box3(0, -21, 15, 13, 34, 39, woolHi, 6) +
      /* ears sticking out */
      box3(-10, -21, 7, 3.5, 27, 30, dark, 1.5) +
      box3(10, -21, 7, 3.5, 27, 30, dark, 1.5) +
      /* tail puff (wags) */
      '<div class="legpos" style="transform:translate3d(0px,19px,23px)"><div class="tailwag3">' +
        box3(0, 4, 7, 7, 0, 6, woolHi, 3.5) +
      '</div></div>' +
      /* legs */
      legHTML(-7, -9, 12, 5, 5, 12, dark, 'legswingA') +
      legHTML(7, -9, 12, 5, 5, 12, dark, 'legswingB') +
      legHTML(-7, 11, 12, 5, 5, 12, dark, 'legswingB') +
      legHTML(7, 11, 12, 5, 5, 12, dark, 'legswingA')
    );
  }

  function rockSVG(seed) {
    var rand = rng(seed);
    var pts = [];
    var n = 9;
    for (var i = 0; i < n; i++) {
      var th = (i / n) * Math.PI * 2;
      var r = 42 * (0.72 + rand() * 0.35);
      pts.push((50 + Math.cos(th) * r).toFixed(1) + ' ' + (56 - Math.abs(Math.sin(th)) * r * 1.05).toFixed(1));
    }
    return '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="' + pts.join(',') + '" fill="#8d8a80" stroke="#55524a" stroke-width="2" stroke-linejoin="round"/>' +
      '<polygon points="' + pts.slice(0, 5).join(',') + ',50 56" fill="#a5a298" opacity=".55"/>' +
      '<circle cx="38" cy="48" r="4" fill="#6d8a52" opacity=".8"/>' +
      '<circle cx="60" cy="52" r="3" fill="#6d8a52" opacity=".6"/>' +
    '</svg>';
  }

  /* ---------- build world ---------- */

  function build() {
    var level = MEADOW_LEVELS[levelIndex];
    state = MeadowSim.createState(level);
    /* size the world by the fence's true extent (pinched shapes are elongated) */
    var maxR = 0;
    for (var s = 0; s < 96; s++) {
      maxR = Math.max(maxR, MeadowSim.fenceRadius(level.fence, (s / 96) * Math.PI * 2));
    }
    var R = maxR + 80;
    worldW = Math.round(R * 2); worldH = Math.round(R * 2);
    els.world.style.width = worldW + 'px';
    els.world.style.height = worldH + 'px';
    els.world.style.left = (-worldW / 2) + 'px';
    els.world.style.top = (-worldH / 2) + 'px';
    document.documentElement.style.setProperty('--bw', worldW + 'px');
    document.documentElement.style.setProperty('--bh', worldH + 'px');

    els.ground.innerHTML = groundSVG(level);
    els.pieces.innerHTML = '';
    charEls = {};

    /* fence posts at even arc-length spacing (angle spacing bunches on pinched fences) */
    var SAMP = 288, ring = [], perim = 0;
    for (var i = 0; i <= SAMP; i++) {
      var th = (i / SAMP) * Math.PI * 2;
      var r = MeadowSim.fenceRadius(level.fence, th) + 4;
      var pt = { x: level.fence.cx + Math.cos(th) * r, y: level.fence.cy + Math.sin(th) * r };
      if (i > 0) perim += Math.hypot(pt.x - ring[ring.length - 1].x, pt.y - ring[ring.length - 1].y);
      ring.push(pt);
    }
    var spacing = perim / Math.max(24, Math.round(perim / 62));
    var acc = spacing;
    for (var j = 1; j <= SAMP; j++) {
      acc += Math.hypot(ring[j].x - ring[j - 1].x, ring[j].y - ring[j - 1].y);
      if (acc >= spacing) {
        acc -= spacing;
        var p = toWorld(ring[j].x, ring[j].y);
        var post = document.createElement('div');
        post.className = 'post';
        post.style.transform = 'translate3d(' + px(p.x) + ',' + px(p.y) + ',0)';
        post.innerHTML = '<div class="pshadow"></div><div class="stick"></div>';
        els.pieces.appendChild(post);
      }
    }

    state.rocks.forEach(function (rk, i) {
      var p = toWorld(rk.x, rk.y);
      var el = document.createElement('div');
      el.className = 'rock';
      el.style.transform = 'translate3d(' + px(p.x) + ',' + px(p.y) + ',0)';
      var W = rk.r * 2.3, H = rk.r * 1.5;
      var svg = rockSVG(42 + i * 17 + levelIndex * 3);
      el.innerHTML =
        '<div class="rshadow" style="left:' + px(-rk.r * 1.1) + ';top:' + px(-rk.r * 0.8) + ';width:' + px(rk.r * 2.2) + ';height:' + px(rk.r * 1.6) + '"></div>' +
        '<div class="rplw"><div class="rpl" style="width:' + px(W) + ';height:' + px(H) + ';left:' + px(-W / 2) + ';top:' + px(-H) + '">' + svg + '</div></div>';
      els.pieces.appendChild(el);
    });

    /* fully 3D animals */
    state.chars.forEach(function (ch) {
      var el = document.createElement('div');
      el.className = 'manimal ' + ch.type;
      el.innerHTML =
        '<div class="aturn">' +
          '<div class="mshadow"></div>' +
          '<div class="body3d">' + (ch.type === 'wolf' ? wolf3D() : sheep3D()) + '</div>' +
        '</div>';
      els.pieces.appendChild(el);
      charEls[ch.id] = el;
    });

    syncDom();
    fit();
    updateHud(true);
  }

  function syncDom() {
    state.chars.forEach(function (ch) {
      var el = charEls[ch.id];
      if (!el) return;
      if (!ch.alive) { el.classList.add('dead'); return; }
      var p = toWorld(ch.x, ch.y);
      el.style.transform = 'translate3d(' + px(p.x) + ',' + px(p.y) + ',0)';
      el.querySelector('.aturn').style.transform =
        'rotateZ(' + ch.heading.toFixed(1) + 'deg) scale3d(1.15,1.15,1.15)';
      el.classList.toggle('splashing', !!ch.inPuddle);
    });
  }

  function fit() {
    var sceneW = els.scene.clientWidth, sceneH = els.scene.clientHeight;
    var scale = Math.min(1.05, (sceneW - 40) / (worldW + 60), (sceneH + 60) / (worldH * 0.78 + 140));
    els.tilt.style.setProperty('--scale', scale.toFixed(3));
  }

  /* ---------- fx & events ---------- */

  function poofAt(x, y, caught) {
    var p = toWorld(x, y);
    var el = document.createElement('div');
    el.className = 'mpoof' + (caught ? ' caught' : '');
    el.style.transform = 'translate3d(' + px(p.x) + ',' + px(p.y) + ',0)';
    for (var i = 0; i < 12; i++) {
      var s = document.createElement('span');
      s.className = 'p';
      var a = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      var d = 24 + Math.random() * 34;
      s.style.setProperty('--px', (Math.cos(a) * d).toFixed(1) + 'px');
      s.style.setProperty('--py', (Math.sin(a) * d).toFixed(1) + 'px');
      s.style.animationDelay = (Math.random() * 80) + 'ms';
      el.appendChild(s);
    }
    els.pieces.appendChild(el);
    setTimeout(function () { el.remove(); }, 900);
  }

  function handleEvents(events) {
    var now = performance.now();
    events.forEach(function (ev) {
      if (ev.kind === 'bump') {
        if (now - lastBumpSfx > 220) { Sound.play('bump'); lastBumpSfx = now; }
      } else if (ev.kind === 'poof') {
        poofAt(ev.x, ev.y, false);
        Sound.play('poof');
      } else if (ev.kind === 'caught') {
        poofAt(ev.x, ev.y, true);
        Sound.play('poof'); Sound.play('baa');
      } else if (ev.kind === 'shy') {
        if (now - lastBaaSfx > 900) { Sound.play('baa'); lastBaaSfx = now; }
      }
    });
  }

  /* ---------- loop ---------- */

  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (!running || paused || !state) return;
    dt *= speedScale;              /* game-speed setting: uniform time scaling */
    applySteer(dt);
    var events = MeadowSim.step(state, dt);
    handleEvents(events);
    syncDom();
    updateHud(false);
    if (state.status !== 'playing') {
      running = false;
      setTimeout(showOutcome, 750);
    }
  }
  requestAnimationFrame(function (ts) { lastTs = ts; requestAnimationFrame(frame); });

  function updateHud(full) {
    els.hudTime.textContent = state ? state.t.toFixed(1) + 's' : '';
    if (full) {
      var name = MEADOW_LEVELS[levelIndex].name;
      els.hudLevel.textContent = I18n.levelName(name);
      var best = bestTime(name);
      els.hudBest.textContent = best ? ' ' + I18n.t('best_hud', { n: best.toFixed(1) + 's' }) : '';
    }
  }

  function bestTime(name) {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}')[name] || null; } catch (e) { return null; }
  }

  function recordBest(name, t) {
    try {
      var map = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      if (!map[name] || t < map[name]) { map[name] = Math.round(t * 10) / 10; localStorage.setItem(BEST_KEY, JSON.stringify(map)); return true; }
    } catch (e) {}
    return false;
  }

  /* ---------- steering ----------
     A press gives an instant 10° nudge; holding steers continuously from the
     game loop (frame-rate independent), tracing a smooth arc. */

  var TURN_RATE = MeadowSim.TURN_STEP * (1000 / NUDGE_MS);   /* ≈111°/s while held */
  var HOLD_GRACE_MS = 150;
  var steerDir = 0, steerSince = 0;

  function startSteer(dir) {
    steerDir = dir;
    steerSince = performance.now();
    if (running && !paused && state) MeadowSim.turnAll(state, dir * MeadowSim.TURN_STEP);
  }

  function stopSteer() { steerDir = 0; }

  function applySteer(dt) {
    /* dt arrives pre-scaled by the speed setting, so steering scales with it */
    if (!steerDir || !running || paused || !state) return;
    if (performance.now() - steerSince < HOLD_GRACE_MS) return;
    MeadowSim.turnAll(state, steerDir * TURN_RATE * dt);
  }

  function bindHold(el, dir) {
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); startSteer(dir); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      el.addEventListener(ev, stopSteer);
    });
  }

  bindHold($('btnTurnLeft'), -1);
  bindHold($('btnTurnRight'), 1);

  var keyHeld = null;
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      var dir = e.key === 'ArrowLeft' ? -1 : 1;
      if (keyHeld !== dir) { keyHeld = dir; startSteer(dir); }
    } else if (e.key === 'r' || e.key === 'R') {
      resetLevel();
    } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
    } else if (e.key === 'Escape') {
      hideModals();
    }
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keyHeld = null; stopSteer(); }
  });

  /* ---------- flow & overlays ---------- */

  function showStart() {
    running = false;
    setPaused(false);
    els.startLevelName.textContent = I18n.levelName(MEADOW_LEVELS[levelIndex].name);
    els.startOverlay.hidden = false;
  }

  /* ---------- pause ---------- */

  function setPaused(v) {
    paused = v;
    document.body.classList.toggle('mpaused', paused);
    updatePauseBtn();
  }

  function togglePause() {
    if (!state || state.status !== 'playing' || (!running && !paused)) return;
    if (paused) { setPaused(false); running = true; }
    else { running = false; setPaused(true); }
  }

  function updatePauseBtn() {
    var b = $('btnPause');
    b.textContent = (paused ? '▶ ' : '⏸ ') + I18n.t(paused ? 'md_resume' : 'md_pause');
    b.disabled = !state || state.status !== 'playing' || els.startOverlay && !els.startOverlay.hidden;
  }

  function resetLevel() {
    stopSteer();
    hideModals();
    els.overlay.hidden = true;
    build();
    showStart();
  }

  function showOutcome() {
    updatePauseBtn();
    var won = state.status === 'won';
    if (won) Sound.play('win'); else Sound.play('lose');
    var isNewBest = won && recordBest(MEADOW_LEVELS[levelIndex].name, state.t);
    els.overlayKicker.textContent = I18n.t(won ? 'kicker_win' : 'kicker_lose');
    els.overlayKicker.classList.toggle('lost', !won);
    els.overlayTitle.textContent = I18n.t(won ? 'title_win' : 'title_lose');
    els.overlayBody.textContent = won
      ? I18n.t('md_body_win', { t: state.t.toFixed(1) }) + (isNewBest ? I18n.t('new_best') : '')
      : I18n.t('body_lose');
    els.overlayActions.innerHTML = '';
    if (won && levelIndex < MEADOW_LEVELS.length - 1) {
      addAction(I18n.t('btn_next'), 'btn-brass', function () {
        els.overlay.hidden = true;
        levelIndex++;
        build();
        showStart();
      });
    }
    addAction(I18n.t(won ? 'btn_play_again' : 'btn_try_again'), won ? 'btn-ghost' : 'btn-brass', resetLevel);
    addAction(I18n.t('nav_levels'), 'btn-ghost', function () { els.overlay.hidden = true; openLevels(); });
    els.overlay.hidden = false;
  }

  function addAction(label, cls, fn) {
    var b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = label;
    b.addEventListener('click', fn);
    els.overlayActions.appendChild(b);
  }

  function hideModals() {
    els.levelsModal.hidden = true;
    els.helpModal.hidden = true;
  }

  function openLevels() {
    els.meadowList.innerHTML = '';
    MEADOW_LEVELS.forEach(function (lv, i) {
      var row = document.createElement('div');
      row.className = 'level-row';
      var wolves = lv.chars.filter(function (c) { return c.type === 'wolf'; }).length;
      var sheep = lv.chars.length - wolves;
      var best = bestTime(lv.name);
      row.innerHTML = '<div class="lv-name">' + I18n.levelName(lv.name) +
        '<span class="lv-meta">' + I18n.t('meta_wolves', { n: wolves }) +
        (sheep ? ' · ' + I18n.t('meta_sheep', { n: sheep }) : '') +
        (best ? ' · ' + I18n.t('meta_best', { n: best.toFixed(1) + 's' }) : '') + '</span></div>';
      var actions = document.createElement('div');
      actions.className = 'lv-actions';
      var b = document.createElement('button');
      b.className = 'icon-btn';
      b.textContent = '▶';
      b.title = I18n.t('tip_play');
      b.addEventListener('click', function () {
        hideModals();
        els.overlay.hidden = true;
        levelIndex = i;
        build();
        showStart();
      });
      actions.appendChild(b);
      row.appendChild(actions);
      els.meadowList.appendChild(row);
    });
    els.levelsModal.hidden = false;
  }

  /* ---------- chrome ---------- */

  $('btnStart').addEventListener('click', function () {
    els.startOverlay.hidden = true;
    running = true;
    updatePauseBtn();
  });
  $('btnPause').addEventListener('click', togglePause);
  $('btnReset').addEventListener('click', resetLevel);

  var speedSelect = $('speedSelect');
  speedSelect.value = String(speedScale);
  if (speedSelect.value === '') { speedSelect.value = '1'; speedScale = 1; }
  speedSelect.addEventListener('change', function () {
    speedScale = parseFloat(speedSelect.value) || 1;
    localStorage.setItem(SPEED_KEY, String(speedScale));
  });
  $('btnLevels').addEventListener('click', openLevels);
  $('btnHelp').addEventListener('click', function () { els.helpModal.hidden = false; });
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', hideModals); });
  [els.levelsModal, els.helpModal].forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) hideModals(); });
  });

  var btnMute = $('btnMute');
  function renderMute() {
    btnMute.textContent = Sound.isMuted() ? '🔇' : '🔊';
    btnMute.classList.toggle('muted', Sound.isMuted());
  }
  btnMute.addEventListener('click', function () { Sound.toggleMute(); renderMute(); });
  renderMute();

  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button:not(.turnbtn)')) Sound.play('click');
  }, true);

  var langSelect = $('langSelect');
  langSelect.value = I18n.getLang();
  langSelect.addEventListener('change', function () {
    I18n.setLang(langSelect.value);
    updateHud(true);
    updatePauseBtn();
    updateSpeedTitle();
    if (!els.startOverlay.hidden) showStart();
  });

  function updateSpeedTitle() {
    speedSelect.title = I18n.t('md_speed');
    var labels = [I18n.t('speed_slow'), I18n.t('speed_normal'), I18n.t('speed_fast')];
    [].forEach.call(speedSelect.options, function (o, i) {
      o.textContent = ['🐢 ', '🚶 ', '🐇 '][i] + labels[i];
    });
  }

  window.addEventListener('resize', fit);

  /* test/debug handle (no gameplay use) */
  window.MeadowDebug = {
    getState: function () { return state; },
    isRunning: function () { return running; },
    sync: syncDom
  };

  /* ---------- boot ---------- */
  window.scrollTo(0, 0);
  I18n.apply();
  updateSpeedTitle();
  build();
  showStart();
})();
