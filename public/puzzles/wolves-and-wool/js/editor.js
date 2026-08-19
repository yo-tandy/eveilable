/* Level editor ("the workshop"). */
(function () {
  'use strict';

  var CYCLE = { in: 'right', right: 'out', out: 'left', left: 'in' };

  var draft = null;                 /* level being edited */
  var tool = 'wolf';
  var active = false;
  var els = {};
  var onChange = null;              /* main.js hook: rebuild board */

  function blankLevel(w, h) {
    var cells = [];
    for (var i = 0; i < w * h; i++) cells.push({ type: 'empty' });
    return { name: '', w: w, h: h, cells: cells, chars: [] };
  }

  function cloneLevel(level) {
    return {
      name: level.name,
      w: level.w, h: level.h,
      cells: level.cells.map(function (cl) { return { type: cl.type, dir: cl.dir || null }; }),
      chars: level.chars.map(function (ch) { return { type: ch.type, r: ch.r, c: ch.c, dir: ch.dir }; })
    };
  }

  function charAt(r, c) {
    return draft.chars.find(function (ch) { return ch.r === r && ch.c === c; });
  }

  function cellAt(r, c) { return draft.cells[r * draft.w + c]; }

  function removeCharAt(r, c) {
    draft.chars = draft.chars.filter(function (ch) { return !(ch.r === r && ch.c === c); });
  }

  function applyTool(r, c) {
    var cl = cellAt(r, c);
    var ch = charAt(r, c);
    switch (tool) {
      case 'empty':
        removeCharAt(r, c);
        cl.type = 'empty'; cl.dir = null;
        break;
      case 'box':
        if (cl.type === 'box') { cl.type = 'empty'; }
        else { removeCharAt(r, c); cl.type = 'box'; cl.dir = null; }
        break;
      case 'slider':
        if (cl.type === 'slider') { cl.type = 'empty'; }
        else { removeCharAt(r, c); cl.type = 'slider'; }
        cl.dir = null;
        break;
      case 'wolf':
      case 'sheep':
        if (ch && ch.type === tool) { ch.dir = CYCLE[ch.dir]; }
        else {
          removeCharAt(r, c);
          cl.type = 'empty'; cl.dir = null;
          draft.chars.push({ type: tool, r: r, c: c, dir: 'out' });
        }
        break;
    }
    refresh();
  }

  function resize(dw, dh) {
    var w = Math.min(8, Math.max(3, draft.w + dw));
    var h = Math.min(8, Math.max(3, draft.h + dh));
    if (w === draft.w && h === draft.h) return;
    var next = blankLevel(w, h);
    next.name = draft.name;
    for (var r = 0; r < Math.min(h, draft.h); r++) {
      for (var c = 0; c < Math.min(w, draft.w); c++) {
        next.cells[r * w + c] = draft.cells[r * draft.w + c];
      }
    }
    next.chars = draft.chars.filter(function (ch) { return ch.r < h && ch.c < w; });
    draft = next;
    refresh();
  }

  /* localized problem list (mirrors Engine.validateLevel) */
  function problems() {
    var list = [];
    var wolves = draft.chars.filter(function (c) { return c.type === 'wolf'; }).length;
    if (wolves === 0) list.push(I18n.t('ed_need_two'));
    else if (wolves % 2 !== 0) list.push(I18n.t('ed_even', { n: wolves }));
    return list;
  }

  function refresh() {
    els.wVal.textContent = draft.w;
    els.hVal.textContent = draft.h;
    var probs = problems();
    els.problems.classList.toggle('ok', probs.length === 0);
    els.problems.textContent = probs.length ? probs.join(' ')
      : draft.chars.length ? I18n.t('ed_ok') : I18n.t('ed_awaits');
    if (onChange) onChange(draft);
  }

  function enter(level) {
    active = true;
    if (level) draft = cloneLevel(level);
    else if (!draft) draft = blankLevel(5, 5);
    els.name.value = draft.name || '';
    document.body.classList.add('editing');
    Render.setTileClickHandler(applyTool);
    refresh();
  }

  function leave() {
    active = false;
    document.body.classList.remove('editing');
    Render.setTileClickHandler(null);
  }

  function save() {
    draft.name = els.name.value.trim();
    if (!draft.name) {
      els.problems.classList.remove('ok');
      els.problems.textContent = I18n.t('ed_name');
      return null;
    }
    var probs = problems();
    if (probs.length) {
      els.problems.classList.remove('ok');
      els.problems.textContent = probs.join(' ');
      return null;
    }
    var level = cloneLevel(draft);
    Store.saveLevel(level);
    els.problems.classList.add('ok');
    els.problems.textContent = I18n.t('ed_saved', { name: level.name });
    return level;
  }

  window.Editor = {
    init: function (elements, changeHook) {
      els = elements;
      onChange = changeHook;
      elements.palette.addEventListener('click', function (e) {
        var btn = e.target.closest('.pal');
        if (!btn) return;
        tool = btn.dataset.tool;
        elements.palette.querySelectorAll('.pal').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
      });
      elements.palette.querySelector('[data-tool="wolf"]').classList.add('active');
      elements.wMinus.addEventListener('click', function () { resize(-1, 0); });
      elements.wPlus.addEventListener('click', function () { resize(1, 0); });
      elements.hMinus.addEventListener('click', function () { resize(0, -1); });
      elements.hPlus.addEventListener('click', function () { resize(0, 1); });
      elements.name.addEventListener('input', function () { draft.name = elements.name.value; });
    },
    enter: enter,
    leave: leave,
    save: save,
    clear: function () { draft = blankLevel(draft ? draft.w : 5, draft ? draft.h : 5); els.name.value = ''; refresh(); },
    getDraft: function () { return draft ? cloneLevel(draft) : null; },
    isActive: function () { return active; },
    retranslate: function () { if (active) refresh(); }
  };
})();
