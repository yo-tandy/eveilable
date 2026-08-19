/* Local persistence + import/export of levels. */
(function () {
  'use strict';
  var KEY = 'wolveswool.levels.v1';
  var BEST_KEY = 'wolveswool.best.v1';

  function loadCustom() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function persist(levels) {
    localStorage.setItem(KEY, JSON.stringify(levels));
  }

  function saveLevel(level) {
    var levels = loadCustom();
    var idx = levels.findIndex(function (l) { return l.name === level.name; });
    if (idx >= 0) levels[idx] = level; else levels.push(level);
    persist(levels);
  }

  function deleteLevel(name) {
    persist(loadCustom().filter(function (l) { return l.name !== name; }));
  }

  /* schema check for imported data */
  function sanitizeLevel(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var w = obj.w | 0, h = obj.h | 0;
    if (w < 3 || w > 10 || h < 3 || h > 10) return null;
    if (!Array.isArray(obj.cells) || obj.cells.length !== w * h) return null;
    if (!Array.isArray(obj.chars)) return null;
    var dirs = { in: 1, out: 1, left: 1, right: 1 };
    var cells = obj.cells.map(function (cl) {
      if (cl && cl.type === 'box') return { type: 'box' };
      if (cl && cl.type === 'slider') return { type: 'slider' };
      return { type: 'empty' };
    });
    var chars = [];
    for (var i = 0; i < obj.chars.length; i++) {
      var ch = obj.chars[i];
      if (!ch || (ch.type !== 'wolf' && ch.type !== 'sheep')) return null;
      if (!dirs[ch.dir]) return null;
      var r = ch.r | 0, c = ch.c | 0;
      if (r < 0 || r >= h || c < 0 || c >= w) return null;
      if (cells[r * w + c].type !== 'empty') return null;
      chars.push({ type: ch.type, r: r, c: c, dir: ch.dir });
    }
    var name = String(obj.name || 'Imported level').slice(0, 40);
    return { name: name, w: w, h: h, cells: cells, chars: chars };
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'level';
  }

  function exportLevel(level) {
    download('wolveswool-' + slug(level.name) + '.json', JSON.stringify(level, null, 2));
  }

  function exportAll() {
    var levels = loadCustom();
    if (levels.length) download('wolveswool-levels.json', JSON.stringify(levels, null, 2));
    return levels.length;
  }

  /* Accepts a single level object or an array of them. Returns {added, skipped}. */
  function importJSON(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return { added: 0, skipped: 0, error: 'Not valid JSON.' }; }
    var list = Array.isArray(data) ? data : [data];
    var added = 0, skipped = 0;
    list.forEach(function (obj) {
      var level = sanitizeLevel(obj);
      if (level && Engine.validateLevel(level).length === 0) {
        var existing = loadCustom();
        var base = level.name, n = 2;
        while (existing.some(function (l) { return l.name === level.name; })) {
          level.name = base + ' (' + (n++) + ')';
        }
        saveLevel(level);
        added++;
      } else skipped++;
    });
    return { added: added, skipped: skipped };
  }

  function bestMoves(levelName) {
    try {
      var map = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      return map[levelName] || null;
    } catch (e) { return null; }
  }

  function recordBest(levelName, moves) {
    try {
      var map = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      if (!map[levelName] || moves < map[levelName]) {
        map[levelName] = moves;
        localStorage.setItem(BEST_KEY, JSON.stringify(map));
        return true;
      }
    } catch (e) {}
    return false;
  }

  window.Store = {
    loadCustom: loadCustom, saveLevel: saveLevel, deleteLevel: deleteLevel,
    exportLevel: exportLevel, exportAll: exportAll, importJSON: importJSON,
    bestMoves: bestMoves, recordBest: recordBest
  };
})();
