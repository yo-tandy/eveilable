/* Board & piece rendering + turn animation replay. */
(function () {
  'use strict';

  var TS = 104;                     /* keep in sync with --ts */
  var STEP_MS = 520, SLIDE_MS = 400, ROT_MS = 500, POOF_MS = 560, RETURN_MS = 400;

  var els = {};
  var angles = {};                  /* char id -> cumulative arrow angle (deg) */
  var viewDirs = {};                /* char id -> current facing, for standee classes */
  var tileClickHandler = null;

  /* ---------- standee artwork ---------- */

  function wolfSVG() {
    var body = '#6b7684', deep = '#39414c', hi = '#98a4b3', belly = '#aab4c0';
    return '<svg viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="stand-tilt">' +
        /* bushy tail */
        '<path d="M74 92 C90 88 95 74 88 62 C86 74 80 80 70 82 Z" fill="' + deep + '"/>' +
        /* body */
        '<ellipse cx="50" cy="88" rx="25" ry="23" fill="' + body + '" stroke="' + deep + '" stroke-width="2"/>' +
        '<ellipse cx="50" cy="92" rx="13" ry="15" fill="' + belly + '" opacity=".85"/>' +
        /* fur tufts on shoulders */
        '<path d="M28 78 L24 70 L32 73 Z" fill="' + deep + '"/>' +
        '<path d="M72 78 L76 70 L68 73 Z" fill="' + deep + '"/>' +
        /* ears — tall and pointed */
        '<path d="M33 29 L26 3 L47 14 Z" fill="' + body + '" stroke="' + deep + '" stroke-width="2"/>' +
        '<path d="M67 29 L74 3 L53 14 Z" fill="' + body + '" stroke="' + deep + '" stroke-width="2"/>' +
        '<path d="M35 25 L31 10 L43 16 Z" fill="' + deep + '"/>' +
        '<path d="M65 25 L69 10 L57 16 Z" fill="' + deep + '"/>' +
        /* head */
        '<circle cx="50" cy="40" r="23" fill="' + body + '" stroke="' + deep + '" stroke-width="2"/>' +
        '<path d="M29 34 C33 24 42 18 50 18 C43 22 37 28 34 38 Z" fill="' + hi + '" opacity=".5"/>' +
        '<g class="face-front">' +
          /* muzzle */
          '<path d="M38 45 Q50 64 62 45 Q56 40 50 41 Q44 40 38 45 Z" fill="' + belly + '"/>' +
          '<circle cx="50" cy="55" r="3.6" fill="#23282f"/>' +
          '<path d="M50 58 L50 61" stroke="#23282f" stroke-width="1.8" stroke-linecap="round"/>' +
          /* amber eyes with hunter\'s brow */
          '<ellipse cx="41" cy="37" rx="4.4" ry="3.6" fill="#e2a63d"/>' +
          '<ellipse cx="59" cy="37" rx="4.4" ry="3.6" fill="#e2a63d"/>' +
          '<g class="pupils">' +
            '<circle cx="41.5" cy="37" r="1.7" fill="#1c1410"/>' +
            '<circle cx="59.5" cy="37" r="1.7" fill="#1c1410"/>' +
          '</g>' +
          '<path d="M35 31 L46 34" stroke="' + deep + '" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M65 31 L54 34" stroke="' + deep + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="face-back">' +
          '<circle cx="50" cy="40" r="23" fill="rgba(22,17,12,.34)"/>' +
          '<ellipse cx="50" cy="88" rx="25" ry="23" fill="rgba(22,17,12,.34)"/>' +
          '<path d="M50 20 L50 60" stroke="rgba(22,17,12,.45)" stroke-width="3" stroke-linecap="round"/>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function sheepSVG() {
    var wool = '#ece4d2', deep = '#b3a68b', face = '#55463c', faceHi = '#6d5c4f';
    /* wool cloud built from lumpy circles */
    function puffs(cx, cy, rx, ry, n, r) {
      var out = '';
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        out += '<circle cx="' + (cx + Math.cos(a) * rx).toFixed(1) +
               '" cy="' + (cy + Math.sin(a) * ry).toFixed(1) + '" r="' + r + '" fill="' + wool + '"/>';
      }
      return out;
    }
    return '<svg viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="stand-tilt">' +
        /* body cloud */
        '<g stroke="' + deep + '" stroke-width="1.6">' + puffs(50, 88, 22, 18, 9, 9) + '</g>' +
        '<ellipse cx="50" cy="88" rx="25" ry="20" fill="' + wool + '"/>' +
        /* ears */
        '<ellipse cx="30" cy="38" rx="9" ry="4.6" fill="' + face + '" transform="rotate(-14 30 38)"/>' +
        '<ellipse cx="70" cy="38" rx="9" ry="4.6" fill="' + face + '" transform="rotate(14 70 38)"/>' +
        '<ellipse cx="29" cy="38.6" rx="5" ry="2.4" fill="#d9a08e" transform="rotate(-14 29 38.6)"/>' +
        '<ellipse cx="71" cy="38.6" rx="5" ry="2.4" fill="#d9a08e" transform="rotate(14 71 38.6)"/>' +
        /* face */
        '<ellipse cx="50" cy="42" rx="15" ry="17" fill="' + face + '"/>' +
        '<path d="M38 36 C40 28 46 25 50 25 C47 29 44 33 43 40 Z" fill="' + faceHi + '"/>' +
        /* wool cap */
        '<g stroke="' + deep + '" stroke-width="1.4">' +
          '<circle cx="38" cy="24" r="8" fill="' + wool + '"/>' +
          '<circle cx="50" cy="20" r="9" fill="' + wool + '"/>' +
          '<circle cx="62" cy="24" r="8" fill="' + wool + '"/>' +
        '</g>' +
        '<g class="face-front">' +
          '<circle cx="43" cy="41" r="4" fill="#fff"/>' +
          '<circle cx="57" cy="41" r="4" fill="#fff"/>' +
          '<g class="pupils">' +
            '<circle cx="43.5" cy="41.5" r="1.9" fill="#241a10"/>' +
            '<circle cx="57.5" cy="41.5" r="1.9" fill="#241a10"/>' +
          '</g>' +
          '<path d="M47 51 Q50 54 53 51" fill="none" stroke="#241a10" stroke-width="1.8" stroke-linecap="round"/>' +
          '<path d="M50 47 L50 51" stroke="#241a10" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="face-back">' +
          '<ellipse cx="50" cy="42" rx="15" ry="17" fill="' + wool + '" stroke="' + deep + '" stroke-width="1.4"/>' +
          '<circle cx="50" cy="34" r="9" fill="' + wool + '" stroke="' + deep + '" stroke-width="1.2"/>' +
          '<ellipse cx="50" cy="90" rx="6" ry="8" fill="' + deep + '" opacity=".5"/>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function arrowSVG() {
    /* brass inlay arrow spanning the disc so the head peeks out past the standee */
    return '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M20 1.5 L32 15 L24.5 15 L24.5 38 L15.5 38 L15.5 15 L8 15 Z"' +
      ' fill="#c9a84e" stroke="#43300f" stroke-width="1.6" stroke-linejoin="round" opacity=".92"/></svg>';
  }

  function skidStarSVG() {
    /* non-directional polished burst — sliding works whichever way you're headed */
    return '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M20 4 L23 17 L36 20 L23 23 L20 36 L17 23 L4 20 L17 17 Z" fill="#5c430e"/>' +
      '<circle cx="20" cy="20" r="3.4" fill="#5c430e" opacity=".55"/></svg>';
  }

  /* ---------- build ---------- */

  function px(n) { return n + 'px'; }

  function build(state) {
    els.board.style.width = px(state.w * TS);
    els.board.style.height = px(state.h * TS);
    document.documentElement.style.setProperty('--bw', px(state.w * TS));
    document.documentElement.style.setProperty('--bh', px(state.h * TS));

    els.tiles.innerHTML = '';
    els.pieces.innerHTML = '';
    angles = {}; viewDirs = {};

    for (var r = 0; r < state.h; r++) {
      for (var c = 0; c < state.w; c++) {
        var cl = Engine.cellAt(state, r, c);
        var tile = document.createElement('div');
        tile.className = 'tile' + ((r + c) % 2 ? ' dark' : '');
        tile.style.transform = 'translate3d(' + px(c * TS) + ',' + px(r * TS) + ',0)';
        tile.dataset.r = r; tile.dataset.c = c;
        if (cl.type === 'slider') {
          tile.classList.add('slider-tile');
          var inlay = document.createElement('div');
          inlay.className = 'slider-inlay';
          inlay.innerHTML = skidStarSVG();
          tile.appendChild(inlay);
        }
        tile.addEventListener('click', onTileClick);
        els.tiles.appendChild(tile);
        if (cl.type === 'box') els.pieces.appendChild(makeCrate(r, c));
      }
    }

    state.chars.forEach(function (ch) {
      if (ch.alive) els.pieces.appendChild(makeChar(ch));
    });

    fit(state);
  }

  function onTileClick(e) {
    if (tileClickHandler) {
      var t = e.currentTarget;
      tileClickHandler(+t.dataset.r, +t.dataset.c);
    }
  }

  function makeCrate(r, c) {
    var el = document.createElement('div');
    el.className = 'crate';
    el.style.transform = 'translate3d(' + px(c * TS) + ',' + px(r * TS) + ',0)';
    el.innerHTML =
      '<div class="drop"></div>' +
      '<div class="face side-n"></div><div class="face side-s"></div>' +
      '<div class="face side-w"></div><div class="face side-e"></div>' +
      '<div class="face top"></div>';
    return el;
  }

  function makeChar(ch) {
    var el = document.createElement('div');
    el.className = 'char ' + ch.type + ' d-' + ch.dir;
    el.dataset.id = ch.id;
    el.style.transform = charTranslate(ch.r, ch.c);
    angles[ch.id] = Engine.DIR_ANGLE[ch.dir];
    viewDirs[ch.id] = ch.dir;
    el.innerHTML =
      '<div class="bumper">' +
        '<div class="shadow"></div>' +
        '<div class="base">' + arrowSVG() + '</div>' +
        '<div class="stand">' + (ch.type === 'wolf' ? wolfSVG() : sheepSVG()) + '</div>' +
      '</div>';
    el.querySelector('.base').style.transform = 'rotateZ(' + angles[ch.id] + 'deg)';
    return el;
  }

  function charTranslate(r, c) {
    return 'translate3d(' + px(c * TS) + ',' + px(r * TS) + ',0)';
  }

  function charEl(id) {
    return els.pieces.querySelector('.char[data-id="' + id + '"]');
  }

  /* ---------- viewport fit ---------- */

  function fit(state) {
    var sceneW = els.scene.clientWidth, sceneH = els.scene.clientHeight;
    var bw = state.w * TS + 140, bh = state.h * TS * 0.72 + 260;
    var scale = Math.min(1.12, (sceneW - 40) / bw, (sceneH - 10) / bh);
    els.tilt.style.setProperty('--scale', scale.toFixed(3));
  }

  /* ---------- turn animation ---------- */

  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  function setFacing(id, dir) {
    var el = charEl(id);
    if (!el) return;
    el.classList.remove('d-in', 'd-out', 'd-left', 'd-right');
    el.classList.add('d-' + dir);
  }

  function poofAt(r, c, isSheep) {
    var el = document.createElement('div');
    el.className = 'poof' + (isSheep ? ' sheep-poof' : '');
    el.style.transform = charTranslate(r, c);
    for (var i = 0; i < 11; i++) {
      var p = document.createElement('span');
      p.className = 'p';
      var a = (i / 11) * Math.PI * 2 + Math.random() * 0.5;
      var d = 26 + Math.random() * 30;
      p.style.setProperty('--px', (Math.cos(a) * d).toFixed(1) + 'px');
      p.style.setProperty('--py', (Math.sin(a) * d).toFixed(1) + 'px');
      p.style.animationDelay = (Math.random() * 90) + 'ms';
      el.appendChild(p);
    }
    els.pieces.appendChild(el);
    setTimeout(function () { el.remove(); }, POOF_MS + 300);
  }

  function sfx(name) {
    if (window.Sound) Sound.play(name);
  }

  function animateTurn(log) {
    var rotDelta = log.turn === 'L' ? -90 : 90;
    var rot = log.turn === 'L' ? Engine.ROT_L : Engine.ROT_R;

    sfx('rotate');

    /* 1 — everyone pivots in place */
    Object.keys(viewDirs).forEach(function (id) {
      var el = charEl(id);
      if (!el || el.classList.contains('dead')) return;
      angles[id] += rotDelta;
      viewDirs[id] = rot[viewDirs[id]];
      el.querySelector('.base').style.transform = 'rotateZ(' + angles[id] + 'deg)';
      setFacing(id, viewDirs[id]);
    });

    var chain = wait(ROT_MS + 60);

    /* 2 — replay each movement phase */
    log.phases.forEach(function (phase) {
      var dur = phase.kind === 'step' ? STEP_MS : SLIDE_MS;
      chain = chain.then(function () {
        var elimIds = {};
        phase.result.eliminated.forEach(function (e) { elimIds[e.id] = e; });

        var anyStep = phase.result.moves.some(function (m) { return m.moving; });
        var anyBump = phase.result.moves.some(function (m) { return m.blocked && (phase.kind === 'step' || m.flipped); });
        if (anyStep) sfx(phase.kind === 'step' ? 'step' : 'slide');
        if (anyBump) sfx('bump');

        phase.result.moves.forEach(function (mv) {
          var el = charEl(mv.id);
          if (!el || el.classList.contains('dead')) return;
          var e = elimIds[mv.id];
          if (e && e.kind === 'swap') {
            /* meet in the middle */
            el.style.transform = 'translate3d(' +
              px((mv.from.c + mv.to.c) / 2 * TS) + ',' +
              px((mv.from.r + mv.to.r) / 2 * TS) + ',0)';
          } else if (mv.moving) {
            el.style.transform = charTranslate(mv.to.r, mv.to.c);
          } else if (mv.blocked && (phase.kind === 'step' || mv.flipped)) {
            var b = el.querySelector('.bumper');
            b.style.setProperty('--bx', mv.bumpDir.dc);
            b.style.setProperty('--by', mv.bumpDir.dr);
            b.classList.remove('bump');
            void b.offsetWidth;
            b.classList.add('bump');
            if (mv.flipped) {
              /* bounce off — turn about-face */
              angles[mv.id] += 180;
              viewDirs[mv.id] = Engine.OPP[viewDirs[mv.id]];
              el.querySelector('.base').style.transform = 'rotateZ(' + angles[mv.id] + 'deg)';
              setFacing(mv.id, viewDirs[mv.id]);
            }
          }
        });

        /* sheep that shied away head toward the collision point first */
        var bounces = phase.result.bounces || [];
        bounces.forEach(function (b) {
          var el = charEl(b.id);
          if (el && !el.classList.contains('dead')) {
            el.style.transform = charTranslate(b.toward.r, b.toward.c);
          }
        });

        var hasElim = phase.result.eliminated.length > 0;
        var flips = phase.result.collisionFlips || [];
        return wait(dur).then(function () {
          /* …then retreat to their own squares and turn around */
          if (!bounces.length && !flips.length) return;
          if (bounces.length) sfx('baa');
          bounces.forEach(function (b) {
            var el = charEl(b.id);
            if (el && !el.classList.contains('dead')) {
              el.style.transform = charTranslate(b.backTo.r, b.backTo.c);
            }
          });
          flips.forEach(function (id) {
            var el = charEl(id);
            if (!el || el.classList.contains('dead')) return;
            angles[id] += 180;
            viewDirs[id] = Engine.OPP[viewDirs[id]];
            el.querySelector('.base').style.transform = 'rotateZ(' + angles[id] + 'deg)';
            setFacing(id, viewDirs[id]);
          });
          return wait(RETURN_MS);
        }).then(function () {
          if (!hasElim) return;
          sfx('poof');
          if (phase.result.eliminated.some(function (e) { return e.type === 'sheep'; })) sfx('baa');
          var seen = {};
          phase.result.eliminated.forEach(function (e) {
            var el = charEl(e.id);
            if (el) el.classList.add('dead');
            var mv = phase.result.moves.find(function (m) { return m.id === e.id; });
            var pr = e.at.r, pc = e.at.c;
            if (e.kind === 'swap' && mv) { pr = (mv.from.r + mv.to.r) / 2; pc = (mv.from.c + mv.to.c) / 2; }
            var key = pr + ',' + pc + ',' + (e.type === 'sheep');
            if (!seen[key]) { poofAt(pr, pc, e.type === 'sheep'); seen[key] = 1; }
          });
          return wait(POOF_MS);
        });
      });
    });

    return chain;
  }

  /* ---------- mini previews ---------- */

  function miniBoard(level) {
    var el = document.createElement('div');
    el.className = 'mini-board';
    el.style.gridTemplateColumns = 'repeat(' + level.w + ', 7px)';
    var charAt = {};
    level.chars.forEach(function (ch) { charAt[ch.r + ',' + ch.c] = ch.type; });
    for (var r = 0; r < level.h; r++) {
      for (var c = 0; c < level.w; c++) {
        var d = document.createElement('div');
        var cl = level.cells[r * level.w + c];
        var ch = charAt[r + ',' + c];
        d.className = 'mini-cell' +
          (ch ? ' m-' + ch :
            cl.type === 'box' ? ' m-box' :
            cl.type === 'slider' ? ' m-slider' :
            (r + c) % 2 ? ' m-dark' : '');
        el.appendChild(d);
      }
    }
    return el;
  }

  window.Render = {
    TS: TS,
    init: function (elements) { els = elements; },
    build: build,
    fit: fit,
    animateTurn: animateTurn,
    miniBoard: miniBoard,
    setTileClickHandler: function (fn) { tileClickHandler = fn; }
  };
})();
