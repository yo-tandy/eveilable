/* Meadow mode — continuous world simulation.
   Pure logic, no DOM. Runs in the browser (window.MeadowSim) and in Node
   (module.exports) so tools/playtest-meadow.js can verify levels are winnable.

   Rules (continuous versions of the board game):
   - Everyone walks forward at the same speed, all the time.
   - Steering turns every animal together, in 10° nudges (hold = an arc).
   - The fence and rocks bounce: heading reflects off the surface.
   - Puddles are slippery: faster, and steering barely bites.
   - Wolf meets wolf → both gone. Wolf reaches sheep → the day is lost.
   - Sheep meeting sheep shy apart, unharmed. Win when no wolves remain. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MeadowSim = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CHAR_R = 24;            /* body radius (px, world units) */
  var BASE_SPEED = 82;        /* px per second */
  var PUDDLE_SPEED = 1.9;     /* speed multiplier inside a puddle */
  var PUDDLE_TURN = 0.35;     /* steering multiplier inside a puddle */
  var TURN_STEP = 10;         /* degrees per steering nudge */
  var HIT_DIST = CHAR_R * 2 * 0.88;

  function rad(d) { return d * Math.PI / 180; }

  /* fence boundary: a blob defined in polar form around (cx, cy) */
  function fenceRadius(fence, theta) {
    var r = fence.R0;
    for (var i = 0; i < fence.harmonics.length; i++) {
      var h = fence.harmonics[i];
      r += fence.R0 * h.a * Math.sin(h.k * theta + h.phi);
    }
    return r;
  }

  /* >0 means the point pokes outside the fence (with margin) */
  function fenceExcess(fence, x, y, margin) {
    var dx = x - fence.cx, dy = y - fence.cy;
    var theta = Math.atan2(dy, dx);
    return Math.hypot(dx, dy) - (fenceRadius(fence, theta) - margin);
  }

  function createState(level) {
    return {
      fence: level.fence,
      rocks: level.rocks.map(function (r) { return { x: r.x, y: r.y, r: r.r }; }),
      puddles: level.puddles.map(function (p) { return { x: p.x, y: p.y, r: p.r }; }),
      chars: level.chars.map(function (ch, i) {
        return { id: i, type: ch.type, x: ch.x, y: ch.y, heading: ch.heading, alive: true, inPuddle: false };
      }),
      t: 0,
      status: 'playing'
    };
  }

  function isInPuddle(state, ch) {
    for (var i = 0; i < state.puddles.length; i++) {
      var p = state.puddles[i];
      if (Math.hypot(ch.x - p.x, ch.y - p.y) < p.r) return true;
    }
    return false;
  }

  /* steer every living animal together; puddles dampen the bite */
  function turnAll(state, deg) {
    state.chars.forEach(function (ch) {
      if (!ch.alive) return;
      ch.heading += deg * (ch.inPuddle ? PUDDLE_TURN : 1);
    });
  }

  /* heading convention: 0 = up (-y), 90 = right (+x) */
  function headingVec(ch) {
    var hv = rad(ch.heading);
    return { x: Math.sin(hv), y: -Math.cos(hv) };
  }

  function reflectHeading(ch, nx, ny) {
    var v = headingVec(ch);
    var dot = v.x * nx + v.y * ny;
    if (dot >= 0) return;                       /* already leaving the surface */
    var vx = v.x - 2 * dot * nx, vy = v.y - 2 * dot * ny;
    ch.heading = Math.atan2(vx, -vy) * 180 / Math.PI;
  }

  /* advance the world by dt seconds; returns events for sound/fx */
  function step(state, dt) {
    if (state.status !== 'playing') return [];
    var events = [];
    state.t += dt;

    state.chars.forEach(function (ch) {
      if (!ch.alive) return;
      ch.inPuddle = isInPuddle(state, ch);
      var sp = BASE_SPEED * (ch.inPuddle ? PUDDLE_SPEED : 1);
      var v = headingVec(ch);
      ch.x += v.x * sp * dt;
      ch.y += v.y * sp * dt;

      /* fence bounce */
      if (fenceExcess(state.fence, ch.x, ch.y, CHAR_R) > 0) {
        var e = 0.9;
        var gx = fenceExcess(state.fence, ch.x + e, ch.y, CHAR_R) - fenceExcess(state.fence, ch.x - e, ch.y, CHAR_R);
        var gy = fenceExcess(state.fence, ch.x, ch.y + e, CHAR_R) - fenceExcess(state.fence, ch.x, ch.y - e, CHAR_R);
        var len = Math.hypot(gx, gy) || 1;
        var nx = gx / len, ny = gy / len;       /* outward normal */
        reflectHeading(ch, -nx, -ny);           /* reflect off inward-facing surface */
        var guard = 0;
        while (fenceExcess(state.fence, ch.x, ch.y, CHAR_R) > 0 && guard++ < 60) {
          ch.x -= nx * 2; ch.y -= ny * 2;
        }
        events.push({ kind: 'bump', id: ch.id, x: ch.x, y: ch.y });
      }

      /* rock bounce */
      for (var i = 0; i < state.rocks.length; i++) {
        var rk = state.rocks[i];
        var dx = ch.x - rk.x, dy = ch.y - rk.y;
        var d = Math.hypot(dx, dy);
        var min = rk.r + CHAR_R;
        if (d < min && d > 0.001) {
          var nx2 = dx / d, ny2 = dy / d;
          reflectHeading(ch, nx2, ny2);
          ch.x = rk.x + nx2 * (min + 0.5);
          ch.y = rk.y + ny2 * (min + 0.5);
          events.push({ kind: 'bump', id: ch.id, x: ch.x, y: ch.y });
        }
      }
    });

    /* animal-animal contact */
    var alive = state.chars.filter(function (c) { return c.alive; });
    for (var a = 0; a < alive.length; a++) {
      for (var b = a + 1; b < alive.length; b++) {
        var A = alive[a], B = alive[b];
        if (!A.alive || !B.alive) continue;
        var ddx = B.x - A.x, ddy = B.y - A.y;
        var dd = Math.hypot(ddx, ddy);
        if (dd >= HIT_DIST || dd < 0.001) continue;
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        if (A.type === 'wolf' && B.type === 'wolf') {
          A.alive = false; B.alive = false;
          events.push({ kind: 'poof', x: mx, y: my, ids: [A.id, B.id] });
        } else if (A.type === 'sheep' && B.type === 'sheep') {
          /* shy apart: face away from each other, unharmed */
          var nx3 = ddx / dd, ny3 = ddy / dd;
          A.heading = Math.atan2(-nx3, ny3) * 180 / Math.PI;
          B.heading = Math.atan2(nx3, -ny3) * 180 / Math.PI;
          var push = (HIT_DIST - dd) / 2 + 1;
          A.x -= nx3 * push; A.y -= ny3 * push;
          B.x += nx3 * push; B.y += ny3 * push;
          events.push({ kind: 'shy', x: mx, y: my, ids: [A.id, B.id] });
        } else {
          A.alive = false; B.alive = false;
          events.push({ kind: 'caught', x: mx, y: my, ids: [A.id, B.id] });
        }
      }
    }

    var sheepDown = false, wolvesLeft = 0;
    state.chars.forEach(function (ch) {
      if (!ch.alive && ch.type === 'sheep') sheepDown = true;
      if (ch.alive && ch.type === 'wolf') wolvesLeft++;
    });
    if (sheepDown) state.status = 'lost';
    else if (wolvesLeft === 0) state.status = 'won';

    return events;
  }

  return {
    CHAR_R: CHAR_R,
    TURN_STEP: TURN_STEP,
    BASE_SPEED: BASE_SPEED,
    createState: createState,
    step: step,
    turnAll: turnAll,
    fenceRadius: fenceRadius,
    fenceExcess: fenceExcess
  };
});
