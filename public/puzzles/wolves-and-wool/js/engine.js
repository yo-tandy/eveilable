/* Friends & Foes — game engine.
   Pure logic, no DOM. Runs in the browser (window.Engine) and in Node (module.exports)
   so levels can be verified by tools/solve.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIRS = {
    in:    { dr: -1, dc: 0 },
    out:   { dr: 1,  dc: 0 },
    left:  { dr: 0,  dc: -1 },
    right: { dr: 0,  dc: 1 }
  };
  var ROT_L = { in: 'left', left: 'out', out: 'right', right: 'in' };
  var ROT_R = { in: 'right', right: 'out', out: 'left', left: 'in' };
  var OPP = { in: 'out', out: 'in', left: 'right', right: 'left' };
  var DIR_ANGLE = { in: 0, right: 90, out: 180, left: 270 };

  function cellAt(state, r, c) {
    return state.cells[r * state.w + c];
  }

  function inBounds(state, r, c) {
    return r >= 0 && r < state.h && c >= 0 && c < state.w;
  }

  /* Build a fresh runtime state from a level definition. */
  function createState(level) {
    return {
      w: level.w,
      h: level.h,
      cells: level.cells.map(function (cl) { return { type: cl.type, dir: cl.dir || null }; }),
      chars: level.chars.map(function (ch, i) {
        return { id: i, type: ch.type, r: ch.r, c: ch.c, dir: ch.dir, alive: true };
      }),
      moves: 0,
      status: 'playing'
    };
  }

  /* One simultaneous movement phase. dirOf(ch) returns a DIRS entry or null (char sits still).
     flipOnBlock: a blocked character bounces and turns 180° (step phase only).
     Sheep-sheep collisions never eliminate: the sheep shy away — movers return to their
     squares and everyone involved turns around. Any collision with a wolf stays lethal.
     Returns { moves, eliminated, bounces, collisionFlips, anyMoved }. Mutates state. */
  function phaseMove(state, dirOf, flipOnBlock) {
    var alive = state.chars.filter(function (ch) { return ch.alive; });
    var intents = {};
    var flippedThisPhase = {};        /* at most one 180° per character per phase */
    alive.forEach(function (ch) {
      var d = dirOf(ch);
      var it = { from: { r: ch.r, c: ch.c }, to: { r: ch.r, c: ch.c }, moving: false, blocked: false };
      if (d) {
        var nr = ch.r + d.dr, nc = ch.c + d.dc;
        if (!inBounds(state, nr, nc) || cellAt(state, nr, nc).type === 'box') {
          it.blocked = true;
          it.bumpDir = d;
          var mayFlip = typeof flipOnBlock === 'function' ? flipOnBlock(ch) : flipOnBlock;
          if (mayFlip) {
            ch.dir = OPP[ch.dir];
            it.flipped = true;
            flippedThisPhase[ch.id] = true;
          }
        } else {
          it.moving = true;
          it.to = { r: nr, c: nc };
        }
      }
      intents[ch.id] = it;
    });

    var eliminated = [];
    var bounces = [];                 /* {id, toward, backTo} — for the renderer */
    var collisionFlips = [];          /* ids that turned around in a sheep collision */

    function flipOnce(ch) {
      if (!flippedThisPhase[ch.id]) {
        ch.dir = OPP[ch.dir];
        flippedThisPhase[ch.id] = true;
        collisionFlips.push(ch.id);
      }
    }

    /* Swaps: two characters exchanging squares meet in the middle.
       Two sheep shy away back to their own squares; anyone else perishes. */
    for (var i = 0; i < alive.length; i++) {
      for (var j = i + 1; j < alive.length; j++) {
        var a = alive[i], b = alive[j];
        if (!a.alive || !b.alive) continue;
        var ia = intents[a.id], ib = intents[b.id];
        if (ia.moving && ib.moving &&
            ia.to.r === b.r && ia.to.c === b.c &&
            ib.to.r === a.r && ib.to.c === a.c) {
          if (a.type === 'sheep' && b.type === 'sheep') {
            ia.moving = false; ib.moving = false;
            bounces.push({ id: a.id, toward: { r: (ia.from.r + ia.to.r) / 2, c: (ia.from.c + ia.to.c) / 2 }, backTo: ia.from });
            bounces.push({ id: b.id, toward: { r: (ib.from.r + ib.to.r) / 2, c: (ib.from.c + ib.to.c) / 2 }, backTo: ib.from });
            flipOnce(a); flipOnce(b);
          } else {
            a.alive = false; b.alive = false;
            eliminated.push({ id: a.id, type: a.type, kind: 'swap', at: ia.to, mid: true });
            eliminated.push({ id: b.id, type: b.type, kind: 'swap', at: ib.to, mid: true });
          }
        }
      }
    }

    /* Apply moves for survivors of the swap check. */
    var anyMoved = false;
    var movedNow = {};
    alive.forEach(function (ch) {
      if (!ch.alive) return;
      var it = intents[ch.id];
      if (it.moving) {
        ch.r = it.to.r; ch.c = it.to.c;
        movedNow[ch.id] = true;
        anyMoved = true;
      }
    });

    /* Same-square conflicts. All-sheep pile-ups bounce apart; a wolf in the square
       spells elimination. A bounced sheep can land back in a square somebody else
       just entered, so resolve iteratively (each pass strictly shrinks movement). */
    var guard = 0;
    while (guard++ < 8) {
      var byCell = {};
      alive.forEach(function (ch) {
        if (!ch.alive) return;
        var key = ch.r + ',' + ch.c;
        (byCell[key] || (byCell[key] = [])).push(ch);
      });
      var conflict = false;
      Object.keys(byCell).forEach(function (key) {
        var group = byCell[key];
        if (group.length < 2) return;
        conflict = true;
        var allSheep = group.every(function (ch) { return ch.type === 'sheep'; });
        if (allSheep) {
          group.forEach(function (ch) {
            if (movedNow[ch.id]) {
              var it = intents[ch.id];
              bounces.push({ id: ch.id, toward: { r: ch.r, c: ch.c }, backTo: it.from });
              ch.r = it.from.r; ch.c = it.from.c;
              movedNow[ch.id] = false;
            }
            flipOnce(ch);
          });
        } else {
          group.forEach(function (ch) {
            ch.alive = false;
            eliminated.push({ id: ch.id, type: ch.type, kind: 'crash', at: { r: ch.r, c: ch.c } });
          });
        }
      });
      if (!conflict) break;
    }

    return { intents: intents, moves: alive.map(function (ch) {
      var it = intents[ch.id];
      return { id: ch.id, from: it.from, to: it.to, moving: it.moving, blocked: it.blocked, flipped: !!it.flipped, bumpDir: it.bumpDir || null };
    }), eliminated: eliminated, bounces: bounces, collisionFlips: collisionFlips, anyMoved: anyMoved };
  }

  /* Execute one full turn: rotate everyone, step forward, then resolve slider chains.
     Returns a replayable event log for the renderer. Mutates state. */
  function stepGame(state, turn) {
    if (state.status !== 'playing') return null;
    var rot = turn === 'L' ? ROT_L : ROT_R;
    state.chars.forEach(function (ch) {
      if (ch.alive) ch.dir = rot[ch.dir];
    });

    var phases = [];
    phases.push({ kind: 'step', result: phaseMove(state, function (ch) { return DIRS[ch.dir]; }, true) });

    var guard = 0;
    var slideFlipped = {};   /* a skidder bounces off a wall at most once per turn */
    while (guard++ < 24) {
      var someoneOnSlider = state.chars.some(function (ch) {
        return ch.alive && cellAt(state, ch.r, ch.c).type === 'slider';
      });
      if (!someoneOnSlider) break;
      /* greased plates: skid one more square the way you're already headed;
         a skid into a crate or the fence bounces (180°) and the skid continues */
      var res = phaseMove(state, function (ch) {
        var cl = cellAt(state, ch.r, ch.c);
        return cl.type === 'slider' ? DIRS[ch.dir] : null;
      }, function (ch) {
        if (slideFlipped[ch.id]) return false;
        slideFlipped[ch.id] = true;
        return true;
      });
      var flippedAny = res.moves.some(function (m) { return m.flipped; });
      if (!res.anyMoved && !res.eliminated.length && !res.bounces.length && !flippedAny) break;
      phases.push({ kind: 'slide', result: res });
      if (!res.anyMoved && !flippedAny) break;
    }

    state.moves++;

    var sheepDown = false, wolvesLeft = 0;
    state.chars.forEach(function (ch) {
      if (!ch.alive && ch.type === 'sheep') sheepDown = true;
      if (ch.alive && ch.type === 'wolf') wolvesLeft++;
    });
    if (sheepDown) state.status = 'lost';
    else if (wolvesLeft === 0) state.status = 'won';

    return { turn: turn, phases: phases, status: state.status };
  }

  /* Compact state key for search / repeat detection. */
  function stateKey(state) {
    return state.chars.map(function (ch) {
      return ch.alive ? ch.r + '.' + ch.c + '.' + ch.dir : 'x';
    }).join('|');
  }

  function cloneState(state) {
    return {
      w: state.w, h: state.h, cells: state.cells,
      chars: state.chars.map(function (ch) {
        return { id: ch.id, type: ch.type, r: ch.r, c: ch.c, dir: ch.dir, alive: ch.alive };
      }),
      moves: state.moves, status: state.status
    };
  }

  /* Parse the compact author notation: rows of space-separated 2-char tokens.
     '..' empty · '##' box · 'ss' slider · 'w>' wolf · 'e<' sheep (ewe) */
  var DIR_OF_CHAR = { '^': 'in', 'v': 'out', '<': 'left', '>': 'right' };
  function parseLevel(name, rows) {
    var grid = rows.map(function (row) { return row.trim().split(/\s+/); });
    var h = grid.length, w = grid[0].length;
    var cells = [], chars = [];
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        var tok = grid[r][c];
        var kind = tok[0], dir = DIR_OF_CHAR[tok[1]] || null;
        if (kind === '#') cells.push({ type: 'box' });
        else if (kind === 's') cells.push({ type: 'slider' });
        else {
          cells.push({ type: 'empty' });
          if (kind === 'w') chars.push({ type: 'wolf', r: r, c: c, dir: dir });
          else if (kind === 'e') chars.push({ type: 'sheep', r: r, c: c, dir: dir });
        }
      }
    }
    return { name: name, w: w, h: h, cells: cells, chars: chars };
  }

  /* Validate a level definition; returns list of problems (empty = ok). */
  function validateLevel(level) {
    var problems = [];
    var wolves = level.chars.filter(function (c) { return c.type === 'wolf'; }).length;
    if (wolves === 0) problems.push('The level needs at least two wolves.');
    else if (wolves % 2 !== 0) problems.push('Wolves must come in even numbers (' + wolves + ' placed).');
    var seen = {};
    level.chars.forEach(function (ch) {
      var key = ch.r + ',' + ch.c;
      if (seen[key]) problems.push('Two characters share the same square.');
      seen[key] = true;
    });
    return problems;
  }

  return {
    DIRS: DIRS, ROT_L: ROT_L, ROT_R: ROT_R, OPP: OPP, DIR_ANGLE: DIR_ANGLE,
    createState: createState, stepGame: stepGame, stateKey: stateKey,
    cloneState: cloneState, cellAt: cellAt, parseLevel: parseLevel,
    validateLevel: validateLevel
  };
});
