/* Game controller: wires engine, renderer, editor, storage and UI chrome. */
(function () {
  'use strict';

  var state = null;
  var currentLevel = null;
  var builtinIndex = 0;             /* -1 when playing a custom/draft level */
  var animating = false;

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    scene: $('scene'), tilt: $('tilt'), board: $('board'),
    tiles: $('tiles'), pieces: $('pieces'), table: $('table'),
    hudLevel: $('hudLevel'), hudMoves: $('hudMoves'), hudBest: $('hudBest'),
    overlay: $('overlay'), overlayKicker: $('overlayKicker'),
    overlayTitle: $('overlayTitle'), overlayBody: $('overlayBody'),
    overlayActions: $('overlayActions'),
    levelsModal: $('levelsModal'), builtinList: $('builtinList'),
    customList: $('customList'), customEmpty: $('customEmpty'),
    helpModal: $('helpModal'),
    btnTurnLeft: $('btnTurnLeft'), btnTurnRight: $('btnTurnRight')
  };

  Render.init(els);

  /* ---------- play flow ---------- */

  function loadLevel(level, index) {
    currentLevel = level;
    builtinIndex = typeof index === 'number' ? index : -1;
    state = Engine.createState(level);
    Render.build(state);
    els.hudLevel.textContent = I18n.levelName(level.name);
    updateHud();
    setTurnButtons(true);
  }

  function updateHud() {
    els.hudMoves.textContent = state.moves;
    var best = currentLevel.name ? Store.bestMoves(currentLevel.name) : null;
    els.hudBest.textContent = best ? ' ' + I18n.t('best_hud', { n: best }) : '';
  }

  function setTurnButtons(enabled) {
    els.btnTurnLeft.disabled = !enabled;
    els.btnTurnRight.disabled = !enabled;
  }

  function doTurn(turn) {
    if (animating || !state || state.status !== 'playing' || Editor.isActive()) return;
    animating = true;
    setTurnButtons(false);
    var log = Engine.stepGame(state, turn);
    Render.animateTurn(log).then(function () {
      animating = false;
      updateHud();
      if (state.status === 'won') {
        var isNewBest = currentLevel.name && Store.recordBest(currentLevel.name, state.moves);
        updateHud();
        Sound.play('win');
        showOutcome(true, isNewBest);
      } else if (state.status === 'lost') {
        Sound.play('lose');
        showOutcome(false, false);
      } else {
        setTurnButtons(true);
      }
    });
  }

  function resetLevel() {
    if (animating || !currentLevel) return;
    hideOverlays();
    loadLevel(currentLevel, builtinIndex);
  }

  /* ---------- outcome overlay ---------- */

  function showOutcome(won, isNewBest) {
    els.overlayKicker.textContent = I18n.t(won ? 'kicker_win' : 'kicker_lose');
    els.overlayKicker.classList.toggle('lost', !won);
    els.overlayTitle.textContent = I18n.t(won ? 'title_win' : 'title_lose');
    els.overlayBody.textContent = won
      ? I18n.t(state.moves === 1 ? 'body_win_one' : 'body_win', { n: state.moves }) +
        (isNewBest ? I18n.t('new_best') : '')
      : I18n.t('body_lose');

    els.overlayActions.innerHTML = '';
    if (won && builtinIndex >= 0 && builtinIndex < BUILTIN_LEVELS.length - 1) {
      addAction(I18n.t('btn_next'), 'btn-brass', function () {
        hideOverlays();
        loadLevel(BUILTIN_LEVELS[builtinIndex + 1], builtinIndex + 1);
      });
    }
    addAction(I18n.t(won ? 'btn_play_again' : 'btn_try_again'), won ? 'btn-ghost' : 'btn-brass', resetLevel);
    addAction(I18n.t('btn_cabinet'), 'btn-ghost', function () { hideOverlays(); openLevels(); });
    els.overlay.hidden = false;
  }

  function addAction(label, cls, fn) {
    var b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = label;
    b.addEventListener('click', fn);
    els.overlayActions.appendChild(b);
  }

  function hideOverlays() {
    els.overlay.hidden = true;
    els.levelsModal.hidden = true;
    els.helpModal.hidden = true;
  }

  /* ---------- level cabinet ---------- */

  function levelRow(level, opts) {
    var row = document.createElement('div');
    row.className = 'level-row';
    row.appendChild(Render.miniBoard(level));

    var name = document.createElement('div');
    name.className = 'lv-name';
    var wolves = level.chars.filter(function (c) { return c.type === 'wolf'; }).length;
    var sheep = level.chars.length - wolves;
    var best = Store.bestMoves(level.name);
    var displayName = opts.custom ? level.name : I18n.levelName(level.name);
    name.innerHTML = displayName +
      '<span class="lv-meta">' + level.w + '×' + level.h + ' · ' + I18n.t('meta_wolves', { n: wolves }) +
      (sheep ? ' · ' + I18n.t('meta_sheep', { n: sheep }) : '') +
      (best ? ' · ' + I18n.t('meta_best', { n: best }) : '') + '</span>';
    row.appendChild(name);

    var actions = document.createElement('div');
    actions.className = 'lv-actions';
    function iconBtn(txt, title, fn) {
      var b = document.createElement('button');
      b.className = 'icon-btn';
      b.textContent = txt;
      b.title = title;
      b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
      actions.appendChild(b);
    }
    iconBtn('▶', I18n.t('tip_play'), function () {
      hideOverlays();
      if (Editor.isActive()) Editor.leave();
      loadLevel(level, opts.index);
    });
    if (opts.custom) {
      iconBtn('✎', I18n.t('tip_edit'), function () {
        hideOverlays();
        enterEditor(level);
      });
      iconBtn('⤓', I18n.t('tip_export'), function () { Store.exportLevel(level); });
      iconBtn('✕', I18n.t('tip_delete'), function () {
        Store.deleteLevel(level.name);
        refreshLevelLists();
      });
    }
    row.appendChild(actions);
    return row;
  }

  function refreshLevelLists() {
    els.builtinList.innerHTML = '';
    BUILTIN_LEVELS.forEach(function (lv, i) {
      els.builtinList.appendChild(levelRow(lv, { index: i }));
    });
    var customs = Store.loadCustom();
    els.customList.innerHTML = '';
    customs.forEach(function (lv) {
      els.customList.appendChild(levelRow(lv, { custom: true }));
    });
    els.customEmpty.style.display = customs.length ? 'none' : '';
  }

  function openLevels() {
    refreshLevelLists();
    els.levelsModal.hidden = false;
  }

  /* ---------- editor wiring ---------- */

  Editor.init({
    palette: $('palette'),
    wMinus: $('wMinus'), wPlus: $('wPlus'), wVal: $('wVal'),
    hMinus: $('hMinus'), hPlus: $('hPlus'), hVal: $('hVal'),
    name: $('levelName'), problems: $('editorProblems')
  }, function (draft) {
    /* rebuild the board to mirror the draft */
    state = Engine.createState(draft);
    Render.build(state);
    els.hudLevel.textContent = draft.name || I18n.t('untitled');
  });

  function enterEditor(level) {
    hideOverlays();
    Editor.enter(level || null);
    setTimeout(function () { Render.fit(state); }, 480);
  }

  function leaveEditor() {
    Editor.leave();
    var draft = Editor.getDraft();
    if (draft && Engine.validateLevel(draft).length === 0) {
      loadLevel(draft, -1);
    } else {
      loadLevel(BUILTIN_LEVELS[0], 0);
    }
    setTimeout(function () { Render.fit(state); }, 480);
  }

  $('btnEditor').addEventListener('click', function () {
    if (Editor.isActive()) leaveEditor();
    else enterEditor(null);
  });
  $('btnExitEditor').addEventListener('click', leaveEditor);
  $('btnSaveLevel').addEventListener('click', function () { Editor.save(); });
  $('btnClearBoard').addEventListener('click', function () { Editor.clear(); });
  $('btnTestLevel').addEventListener('click', function () {
    var draft = Editor.getDraft();
    if (!draft || Engine.validateLevel(draft).length) return;
    Editor.leave();
    loadLevel(draft, -1);
    setTimeout(function () { Render.fit(state); }, 480);
  });

  /* ---------- chrome wiring ---------- */

  els.btnTurnLeft.addEventListener('click', function () { doTurn('L'); });
  els.btnTurnRight.addEventListener('click', function () { doTurn('R'); });
  $('btnReset').addEventListener('click', resetLevel);
  $('btnLevels').addEventListener('click', openLevels);
  $('btnHelp').addEventListener('click', function () { els.helpModal.hidden = false; });

  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', hideOverlays);
  });
  [els.levelsModal, els.helpModal].forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) hideOverlays(); });
  });

  var btnMute = $('btnMute');
  function renderMute() {
    btnMute.textContent = Sound.isMuted() ? '🔇' : '🔊';
    btnMute.classList.toggle('muted', Sound.isMuted());
  }
  btnMute.addEventListener('click', function () { Sound.toggleMute(); renderMute(); Sound.play('click'); });
  renderMute();

  /* soft tick on every button press */
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) Sound.play('click');
  }, true);

  $('btnImport').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files);
    var totals = { added: 0, skipped: 0 };
    var pending = files.length;
    files.forEach(function (f) {
      var reader = new FileReader();
      reader.onload = function () {
        var res = Store.importJSON(reader.result);
        totals.added += res.added; totals.skipped += res.skipped;
        if (--pending === 0) {
          refreshLevelLists();
          els.customEmpty.style.display = '';
          els.customEmpty.textContent = I18n.t('imported', { n: totals.added }) +
            (totals.skipped ? I18n.t('skipped', { n: totals.skipped }) : '') + '.';
        }
      };
      reader.readAsText(f);
    });
    e.target.value = '';
  });
  $('btnExportAll').addEventListener('click', function () {
    if (!Store.exportAll()) {
      els.customEmpty.style.display = '';
      els.customEmpty.textContent = I18n.t('nothing_export');
    }
  });

  /* ---------- language ---------- */

  var langSelect = $('langSelect');
  langSelect.value = I18n.getLang();
  langSelect.addEventListener('change', function () {
    I18n.setLang(langSelect.value);
    if (currentLevel) {
      els.hudLevel.textContent = Editor.isActive()
        ? (Editor.getDraft().name || I18n.t('untitled'))
        : I18n.levelName(currentLevel.name);
      updateHud();
    }
    refreshLevelLists();
    if (Editor.isActive()) Editor.retranslate();
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); doTurn('L'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); doTurn('R'); }
    else if (e.key === 'r' || e.key === 'R') resetLevel();
    else if (e.key === 'Escape') hideOverlays();
  });

  window.addEventListener('resize', function () { if (state) Render.fit(state); });

  /* ---------- boot ---------- */
  I18n.apply();
  loadLevel(BUILTIN_LEVELS[0], 0);
})();
