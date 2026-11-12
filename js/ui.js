/* ============================================================
   咒语旅团 THE SPELL BRIGADE — UI 控制层
   Owner: screen-smith. 只读 window.SB_DATA / window.SBAudio，
   通过 §7.3 契约与 window.SpellBrigadeGame 通信。
   传统脚本、file:// 兼容、无网络依赖。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- error capture (also feeds ?audit=1) ---------- */
  window.__uiErrors = window.__uiErrors || [];
  window.addEventListener('error', function (e) {
    try { window.__uiErrors.push(String((e && e.message) || 'error')); } catch (_) {}
  });
  window.addEventListener('unhandledrejection', function (e) {
    try { window.__uiErrors.push('promise:' + String(e && e.reason)); } catch (_) {}
  });

  /* ---------- tiny helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var CIRC = 2 * Math.PI * 45;
  var ELEMENT_GLYPH = { fire: '火', ice: '月', lightning: '雷', acid: '毒' };
  var ELEMENT_FALLBACK = {
    fire: { name: '烈焰', en: 'EMBER', color: '#ff6b3d' },
    ice: { name: '霜月', en: 'FROST', color: '#74e4ff' },
    lightning: { name: '惊雷', en: 'THUNDER', color: '#ffe14d' },
    acid: { name: '腐雾', en: 'ACID', color: '#abff5c' }
  };
  var RARITY = {
    common: { label: '普通', color: '#c9c2d9' },
    rare: { label: '稀有', color: '#74e4ff' },
    epic: { label: '史诗', color: '#b49bff' },
    legendary: { label: '传说', color: '#ffd166' }
  };
  var GRADE_FOR = { S: 'PERFECT RITUAL', A: 'GRAND RITUAL', B: 'STEADY RITUAL', C: 'BARELY ALIVE' };
  var REDUCED = (function () {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  })();

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    return pad2(Math.floor(sec / 60)) + ':' + pad2(sec % 60);
  }
  function fmtNum(n) {
    n = Number(n) || 0;
    try { return n.toLocaleString('en-US'); } catch (e) { return String(n); }
  }
  function fmtShortTime(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    if (sec >= 60) return Math.floor(sec / 60) + ':' + pad2(sec % 60);
    return sec + 's';
  }
  function repaint(el, html) { if (el) el.innerHTML = html; }
  function setText(sel, text) { var el = $(sel); if (el && el.textContent !== String(text)) el.textContent = String(text); }

  function storeGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function storeSet(key, val) { try { window.localStorage.setItem(key, val); } catch (e) {} }
  function storeDel(key) { try { window.localStorage.removeItem(key); } catch (e) {} }
  function sessionGet(key) { try { return window.sessionStorage.getItem(key); } catch (e) { return null; } }
  function sessionSet(key, val) { try { window.sessionStorage.setItem(key, val); } catch (e) {} }

  /* ---------- data access (defensive) ---------- */
  function DATA() { return window.SB_DATA || null; }
  function META() { return (DATA() && DATA().meta) || {}; }
  function characters() { var d = DATA(); return (d && d.characters) || []; }
  function elements() { var d = DATA(); return (d && d.elements) || ELEMENT_FALLBACK; }
  function spells() { var d = DATA(); return (d && d.spells) || []; }
  function difficulties() { var d = DATA(); return (d && d.difficulties) || []; }
  function charById(id) {
    var list = characters();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0] || null;
  }
  function elementOf(id) { return elements()[id] || ELEMENT_FALLBACK.fire; }
  function spellById(id) {
    var list = spells();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function difficultyById(id) {
    var list = difficulties();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[1] || list[0] || { id: 'normal', name: '月蚀之夜', en: 'ECLIPSE', desc: '' };
  }
  function metaHome() { return META().home || {}; }
  function metaResult() { return META().result || {}; }
  function metaShare() { return META().share || {}; }

  /* ---------- markup builders ---------- */
  function avatarMarkup(ch, extraClass) {
    ch = ch || {};
    var el = elementOf(ch.element);
    var theme = ch.theme || {};
    var grad = theme.gradient || [el.color, '#2a1a3d'];
    var accent = theme.accent || el.color;
    var initial = (ch.name || '?').charAt(0);
    return '<span class="avatar ' + (extraClass || '') + '" style="--av-accent:' + esc(accent) +
      ';--av-g1:' + esc(grad[0]) + ';--av-g2:' + esc(theme.deep || '#2a1a3d') + '">' +
      '<span class="avatar-fallback">' + esc(initial) + '</span>' +
      '<img src="' + esc(ch.portrait || '') + '" alt="" onload="this.parentNode.classList.add(\'has-art\')" onerror="this.style.display=\'none\'">' +
      '</span>';
  }

  function elIconMarkup(elId, extraClass) {
    var el = elementOf(elId);
    return '<span class="el-ico ' + (extraClass || '') + '" style="--el-color:' + esc(el.color) + '">' +
      '<span class="el-glyph">' + esc(ELEMENT_GLYPH[elId] || '✦') + '</span>' +
      '<img src="' + esc(el.icon || '') + '" alt="" onload="this.parentNode.classList.add(\'is-art\')" onerror="this.style.display=\'none\'">' +
      '</span>';
  }

  function statRowsMarkup(ch) {
    var labels = ch.statLabels || ['火力', '灵巧', '奥术', '生存'];
    var keys = ['power', 'speed', 'arcane', 'vitality'];
    var stats = ch.stats || {};
    return keys.map(function (k, i) {
      var v = clamp(Number(stats[k]) || 0, 0, 5);
      var pips = '';
      for (var p = 0; p < 5; p++) pips += '<i class="' + (p < v ? 'on' : '') + '"></i>';
      return '<div class="wc-stat"><span class="wc-stat-label">' + esc(labels[i] || '') + '</span>' +
        '<span class="wc-pips">' + pips + '</span><span class="wc-stat-value">' + v + '</span></div>';
    }).join('');
  }

  function diamondsMarkup(level) {
    level = clamp(Number(level) || 1, 1, 3);
    var out = '';
    for (var i = 0; i < 3; i++) out += i < level ? '◆' : '◇';
    return out;
  }

  function wizardCardMarkup(ch, i) {
    var el = elementOf(ch.element);
    var theme = ch.theme || {};
    var accent = theme.accent || el.color;
    var grad = theme.gradient || [accent, '#2a1a3d'];
    var style = '--accent:' + esc(accent) + ';--deep:' + esc(theme.deep || '#2a1a3d') +
      ';--glow:' + esc(theme.glow || el.color) + ';--g1:' + esc(grad[0]) + ';--g2:' + esc(grad[1] || '#2a1a3d') + ';';
    return '<article class="wizard-card" data-index="' + i + '" data-id="' + esc(ch.id) + '" style="' + style + '" aria-label="' + esc(ch.name) + '">' +
      '<div class="wc-art">' +
        '<div class="wc-glow"></div>' +
        '<div class="wc-halo"></div>' +
        '<div class="wc-splats"><i></i><i></i><i></i></div>' +
        '<span class="wc-index">' + pad2(i + 1) + '</span>' +
        '<div class="wc-topline">' +
          '<span class="wc-element">' + elIconMarkup(ch.element) +
            '<span class="el-name"><b>' + esc(el.name) + '</b><i>' + esc(el.en) + '</i></span>' +
          '</span>' +
          '<span class="wc-diff"><span>难度</span><b>' + esc(ch.difficulty || '') + '</b><i>' + diamondsMarkup(ch.difficultyLevel) + '</i></span>' +
        '</div>' +
        '<span class="wc-picked"><svg class="ico"><use href="#i-check"/></svg>已选中</span>' +
        '<div class="wc-portrait-fallback"><b>' + esc((ch.name || '?').charAt(0)) + '</b><span>' + esc(ch.en || '') + '</span></div>' +
        '<img class="wc-portrait" src="' + esc(ch.portrait || '') + '" alt="" ' +
          'onload="var f=this.previousElementSibling;if(f)f.style.display=\'none\'" onerror="this.style.display=\'none\'">' +
      '</div>' +
      '<div class="wc-info">' +
        '<div class="wc-name-row"><h3>' + esc(ch.name) + '</h3><span class="wc-alias">' + esc(ch.alias || '') + '</span></div>' +
        '<div class="wc-en">' + esc(ch.en || '') + '<em>' + esc(ch.role || '') + '</em></div>' +
        '<p class="wc-quote">「' + esc(ch.tagline || ch.quote || '') + '」</p>' +
        '<div class="wc-stats">' + statRowsMarkup(ch) + '</div>' +
      '</div>' +
    '</article>';
  }

  function slotMarkup(ch, isPlayer, i) {
    var el = elementOf(ch.element);
    return '<div class="slot' + (isPlayer ? ' is-player' : '') + '" style="--d:' + (0.04 + i * 0.06) + 's">' +
      '<div class="slot-avatar-wrap">' +
        (isPlayer ? '<span class="slot-crown"><svg class="ico"><use href="#i-crown"/></svg></span>' : '') +
        avatarMarkup(ch) +
      '</div>' +
      '<div class="slot-main">' +
        '<div class="slot-name-row"><span class="slot-name">' + esc(ch.name) + '</span>' +
          (isPlayer ? '<span class="slot-you">你</span>' : '<span class="slot-ai">AI</span>') +
        '</div>' +
        '<div class="slot-meta"><i class="meta-dot" style="--cc:' + esc(el.color) + '"></i><span>' +
          esc(el.name) + '</span><span class="dot"></span><span>' + esc(ch.role || '') + '</span></div>' +
      '</div>' +
      '<span class="slot-ready' + (isPlayer ? '' : ' slot-ready--ai') + '">' +
        '<svg class="ico"><use href="#i-check"/></svg>' + (isPlayer ? '已就位' : 'AI 就位') +
      '</span>' +
    '</div>';
  }

  function diffMarkup(d, i) {
    var stars = '';
    for (var s = 0; s < 3; s++) stars += '<span class="' + (s <= i ? 'on' : '') + '">◆</span>';
    return '<button class="diff-card' + (d.id === state.difficulty ? ' is-active' : '') + '" data-diff="' + esc(d.id) + '">' +
      '<b>' + esc(d.name) + '</b><i>' + esc(d.en || '') + '</i>' +
      '<span class="diff-stars">' + stars + '</span>' +
    '</button>';
  }

  function partyMiniMarkup(p) {
    var ch = charById(p.id) || {
      name: p.name, element: p.element, portrait: p.portrait,
      theme: { gradient: [elementOf(p.element).color, '#2a1a3d'], deep: '#2a1a3d' }
    };
    return '<div class="party-mini" data-pid="' + esc(p.id || p.name) + '">' +
      avatarMarkup(ch) +
      '<div class="party-hp"><i></i></div>' +
      '<div class="party-down is-hidden"><svg class="ico"><use href="#i-skull"/></svg><span class="party-timer">8s</span></div>' +
    '</div>';
  }

  function spellChipMarkup(sp, isNew) {
    if (!sp) return '';
    var el = elementOf(sp.element);
    return '<span class="spell-chip' + (isNew ? ' is-new' : '') + '" style="--sp-color:' + esc(el.color) + '" title="' + esc(sp.name) + '">' +
      '<span class="spell-glyph">' + esc(ELEMENT_GLYPH[sp.element] || '✦') + '</span>' +
      '<img src="' + esc(sp.icon || '') + '" alt="" onload="this.parentNode.classList.add(\'has-art\')" onerror="this.style.display=\'none\'">' +
    '</span>';
  }

  /* ---------- state ---------- */
  var state = {
    characterId: 'jester',
    difficulty: 'normal',
    settings: { music: true, sfx: true },
    roomCode: ''
  };
  var currentScreen = 'loading';
  var openModalName = null;
  var SBGame = null;
  var gameToken = 0;
  var lastHud = null;
  var lastParty = null;
  var lastResult = null;
  var spellList = [];
  var currentChoices = null;
  var upgradeLock = false;
  var tutorialTimer = null;
  var engineRetry = 0;
  var audioStarted = false;
  var autoScrollUntil = 0;
  var scrollRaf = null;
  var partySig = '';
  var partyEls = {};
  var downSince = {};
  var resetArmed = false;
  var resetTimer = null;
  var shareMode = 'result';
  var activeAudit = false;

  var DEBUG = {
    screen: null, nofx: false, autostart: false, modal: null,
    result: null, audit: false, lowhp: false, demo: false
  };

  var els = {};

  /* ---------- boot ---------- */
  function init() {
    parseDebug();
    cacheEls();
    loadPersistedState();
    applyDataCopy();
    renderHomeChips();
    renderHelp();
    renderRoster();
    renderDifficulties();
    buildHomeFx();
    buildResultAmbient();
    buildLevelupSparks();
    syncAudioUI();
    syncSoundIcon();
    renderSpellBar();
    bindEvents();

    if (DEBUG.nofx) document.body.classList.add('no-fx');
    $('#btn-veil-back').classList.add('is-hidden');

    if (DEBUG.screen) startDebug();
    else if (DEBUG.autostart || DEBUG.nofx) showScreen('home');
    else runLoading();

    window.addEventListener('resize', onResize);
    window.addEventListener('pagehide', function () { destroyGame(); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && SBGame && currentScreen === 'game' && !openModalName && typeof SBGame.resume === 'function') {
        /* keep whatever the engine decided; HUD catches up on next tick */
      }
    });
    if (DEBUG.audit) { activeAudit = true; setTimeout(runAudit, 1200); }
  }

  function cacheEls() {
    els.layer = $('#modal-layer');
    els.modals = $$('.modal', els.layer);
    els.toast = $('#toast-layer');
    els.track = $('#roster-track');
    els.dots = $('#roster-dots');
    els.poster = $('#share-poster');
    els.hudParty = $('#hud-party');
    els.hudSpells = $('#hud-spells');
    els.dash = $('#btn-dash');
    els.dashRing = $('#dash-ring-fill');
    els.dashText = $('#dash-cooldown');
    els.hpFill = $('#hud-hp-fill');
    els.hpBar = $('.hp-bar--player');
    els.hpText = $('#hud-hp-text');
    els.xpFill = $('#hud-xp-fill');
    els.lowhp = $('#lowhp-vignette');
    els.veil = $('#engine-veil');
    els.tutorial = $('#tutorial-hint');
    els.bossbar = $('#boss-bar');
  }

  function parseDebug() {
    var q = {};
    try {
      var sp = new URLSearchParams(window.location.search || '');
      sp.forEach(function (v, k) { q[k] = v; });
    } catch (e) {}
    DEBUG.screen = q.screen || null;
    DEBUG.nofx = q.nofx === '1' || q.nofx === 'true';
    DEBUG.autostart = q.autostart === '1' || q.autostart === 'true';
    DEBUG.modal = q.modal || q.debugmodal || null;
    DEBUG.result = q.result || null;
    DEBUG.audit = q.audit === '1' || q.audit === 'true';
    DEBUG.lowhp = q.lowhp === '1';
    DEBUG.demo = q.demo === '1';
  }

  function loadPersistedState() {
    var chars = characters();
    var savedChar = storeGet('sb.character');
    var savedDiff = storeGet('sb.difficulty');
    if (savedChar && charById(savedChar)) state.characterId = savedChar;
    else if (chars.length) state.characterId = chars[0].id;

    if (savedDiff) {
      var found = false;
      difficulties().forEach(function (d) { if (d.id === savedDiff) found = true; });
      if (found) state.difficulty = savedDiff;
    }
    if (!state.difficulty) state.difficulty = 'normal';

    /* settings: UI store wins, else SBAudio's own persisted settings */
    var savedSettings = null;
    try { savedSettings = JSON.parse(storeGet('sb.settings') || 'null'); } catch (e) {}
    if (savedSettings && (typeof savedSettings.music === 'boolean' || typeof savedSettings.sfx === 'boolean')) {
      state.settings.music = savedSettings.music !== false;
      state.settings.sfx = savedSettings.sfx !== false;
    } else if (window.SBAudio && typeof SBAudio.getSettings === 'function') {
      var s = SBAudio.getSettings() || {};
      state.settings.music = s.music !== false;
      state.settings.sfx = s.sfx !== false;
    }
    if (window.SBAudio && typeof SBAudio.setSettings === 'function') {
      try { SBAudio.setSettings({ music: state.settings.music, sfx: state.settings.sfx }); } catch (e) {}
    }

    /* room code persists for the session only */
    var prefix = (metaShare().codePrefix || 'SPB').toUpperCase();
    var code = sessionGet('sb.roomCode');
    if (!code || !new RegExp('^' + prefix + '-[A-Z0-9]{4}$').test(code)) {
      code = prefix + '-' + randomCode(4);
      sessionSet('sb.roomCode', code);
    }
    state.roomCode = code;
  }

  function randomCode(n) {
    var alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    var out = '';
    for (var i = 0; i < n; i++) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    return out;
  }

  function applyDataCopy() {
    var meta = META();
    var home = metaHome();
    if (home.titleTop) { var tl = $('.home-tagline span'); if (tl) tl.textContent = home.titleTop; }
    if (home.titleBottom) { var tb = $('.home-tagline b'); if (tb) tb.textContent = home.titleBottom; }
    if (home.desc) { var desc = $('.home-desc'); if (desc) desc.textContent = home.desc; }
    if (home.kicker) {
      var kick = $('.home-kicker');
      if (kick) kick.innerHTML = '<span>✦</span> ' + esc(home.kicker) + ' <span>✦</span>';
    }
    if (home.disclaimer) { var legal = $('.home-legal span:last-child'); if (legal) legal.textContent = home.disclaimer; }
    if (meta.subtitle) { var sub = $('.logo-sub'); if (sub) sub.textContent = meta.subtitle; }
    if (meta.stageName) setText('#hud-stage-name', meta.stageName);
    if (meta.stageEn) setText('#hud-stage-en', meta.stageEn);
    if (meta.objective) {
      var goal = $('.help-goal');
      if (goal) goal.innerHTML = '<svg class="ico"><use href="#i-target"/></svg>' + esc('目标：' + meta.objective + '。120 秒时梦魇领主苏醒。');
    }
    var countEl = $('.roster-count span');
    if (countEl && characters().length) countEl.textContent = '/ ' + pad2(characters().length);
    setText('#room-code', state.roomCode);
    var titleTag = document.querySelector('title');
    if (titleTag && meta.title) titleTag.textContent = meta.title + ' · ' + (meta.en || 'THE SPELL BRIGADE');
  }

  function renderHomeChips() {
    var host = $('#home-chips');
    if (!host) return;
    var chips = metaHome().chips || ['4 人小队', '元素弹幕', '肉鸽升级'];
    var icons = ['users', 'bolt', 'sparkle'];
    host.innerHTML = chips.map(function (label, i) {
      return '<li class="chip"><svg class="ico"><use href="#i-' + (icons[i] || 'sparkle') + '"/></svg>' + esc(label) + '</li>';
    }).join('');
  }

  function renderHelp() {
    var host = $('#help-tips');
    if (!host) return;
    var tips = (META().tips || []).slice(0, 4);
    host.innerHTML = tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
  }

  /* ---------- loading ---------- */
  function runLoading() {
    var fill = $('#loading-fill');
    var pct = $('#loading-pct');
    var line = $('#loading-line');
    var lines = (META() && META().loadingLines) || [];
    if (!lines.length) lines = ['正在点亮旅团篝火…'];
    var idx = 0;
    var lineTimer = setInterval(function () {
      idx = (idx + 1) % lines.length;
      if (line) line.textContent = lines[idx];
    }, 330);
    var duration = REDUCED ? 420 : 1280;
    var start = 0;
    function step(t) {
      if (!start) start = t;
      var f = clamp((t - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - f, 2.4);
      var p = Math.floor(eased * 100);
      if (fill) fill.style.width = p + '%';
      if (pct) pct.textContent = p + '%';
      if (f < 1) requestAnimationFrame(step);
      else {
        clearInterval(lineTimer);
        setTimeout(function () { if (currentScreen === 'loading') showScreen('home'); }, 240);
      }
    }
    requestAnimationFrame(step);
    setTimeout(function () { if (currentScreen === 'loading') showScreen('home'); }, duration + 900);
  }

  /* ---------- router ---------- */
  function showScreen(name) {
    var map = {
      loading: 'screen-loading', home: 'screen-home', roster: 'screen-roster',
      lobby: 'screen-lobby', game: 'screen-game', result: 'screen-result'
    };
    if (!map[name]) name = 'home';
    var prev = currentScreen;
    if (prev !== name) clearToasts();
    if (prev === 'game' && name !== 'game') destroyGame();
    currentScreen = name;
    document.body.dataset.screen = name;
    $$('.screen').forEach(function (s) {
      var active = s.id === map[name];
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    closeModal(true);
    hideTutorial();
    writeHash(name);
    if (name === 'roster') {
      syncRosterSelection();
      requestAnimationFrame(function () { layoutRosterPadding(); centerRoster(currentIndex(), false); });
    } else if (name === 'lobby') {
      renderLobby();
    } else if (name === 'game') {
      onGameEnter();
    } else if (name === 'result') {
      renderResult(lastResult || makeDemoResult('victory'));
    }
    syncMusicFor(name);
    if (prev !== name) {
      els.toast.style.display = '';
    }
  }

  function writeHash(name) {
    try {
      if (window.history && history.replaceState) history.replaceState(null, '', '#' + name);
    } catch (e) {
      try { window.location.hash = name; } catch (e2) {}
    }
  }

  /* ---------- audio ---------- */
  function syncMusicFor(screen) {
    if (!window.SBAudio || typeof SBAudio.music !== 'function') return;
    var track = null;
    if (screen === 'game') track = 'battle';
    else if (screen === 'result') track = 'result';
    else if (screen === 'home' || screen === 'roster' || screen === 'lobby') track = 'home';
    if (track) { try { SBAudio.music(track); } catch (e) {} }
  }

  function initAudio() {
    if (audioStarted) return;
    audioStarted = true;
    if (window.SBAudio && typeof SBAudio.init === 'function') {
      try { SBAudio.init(); } catch (e) {}
      syncMusicFor(currentScreen);
    }
  }

  function bindFirstGesture() {
    var handler = function () {
      initAudio();
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('keydown', handler, true);
      document.removeEventListener('touchstart', handler, true);
    };
    document.addEventListener('pointerdown', handler, true);
    document.addEventListener('keydown', handler, true);
    document.addEventListener('touchstart', handler, true);
  }

  function setSetting(part, value) {
    if (part !== 'music' && part !== 'sfx') return;
    state.settings[part] = !!value;
    storeSet('sb.settings', JSON.stringify(state.settings));
    if (window.SBAudio && typeof SBAudio.set === 'function') {
      try { SBAudio.set(part, !!value); } catch (e) {}
    }
    syncAudioUI();
    syncSoundIcon();
  }

  function anyAudioOn() { return state.settings.music || state.settings.sfx; }

  function quickToggleSound() {
    var target = !anyAudioOn();
    setSetting('music', target);
    setSetting('sfx', target);
    toast(target ? '声音已开启' : '已静音 · 冒险继续', target ? 'ok' : 'info');
  }

  function syncAudioUI() {
    [['#setting-music', 'music'], ['#setting-sfx', 'sfx'], ['#pause-music', 'music'], ['#pause-sfx', 'sfx']].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.setAttribute('aria-checked', state.settings[pair[1]] ? 'true' : 'false');
    });
  }

  function syncSoundIcon() {
    var use = $('#home-sound-ico use');
    if (!use) return;
    use.setAttribute('href', anyAudioOn() ? '#i-sound' : '#i-mute');
  }

  /* ---------- toasts ---------- */
  function clearToasts() {
    if (!els.toast) return;
    while (els.toast.firstChild) els.toast.removeChild(els.toast.firstChild);
  }

  function toast(message, type) {
    var layer = els.toast;
    if (!layer || !message) return;
    var icons = { ok: 'check', err: 'close', gold: 'sparkle', info: 'info' };
    type = type || 'info';
    var node = document.createElement('div');
    node.className = 'toast toast--' + type;
    node.innerHTML = '<svg class="ico"><use href="#i-' + (icons[type] || 'info') + '"/></svg><span>' + esc(message) + '</span>';
    layer.appendChild(node);
    while (layer.children.length > 3) layer.removeChild(layer.firstChild);
    requestAnimationFrame(function () { node.classList.add('is-in'); });
    setTimeout(function () {
      node.classList.add('is-out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 340);
    }, 2300);
  }

  /* ---------- modals ---------- */
  function openModal(name) {
    var target = $('#modal-' + name);
    if (!target) return;
    openModalName = name;
    els.layer.classList.add('is-open');
    els.modals.forEach(function (m) { m.classList.toggle('is-open', m === target); });
    if (name === 'share') renderSharePoster(shareMode);
    if (name === 'settings') syncAudioUI();
    if (name === 'pause') syncAudioUI();
    if (name === 'levelup') animateSparks();
  }

  function closeModal(force) {
    openModalName = null;
    if (els.layer) {
      els.layer.classList.remove('is-open');
      els.modals.forEach(function (m) { m.classList.remove('is-open'); });
    }
  }

  function onBackdropClick() {
    if (!openModalName) return;
    if (openModalName === 'settings' || openModalName === 'share' || openModalName === 'copy') closeModal();
  }

  /* ---------- home fx ---------- */
  function buildHomeFx() {
    var host = $('#home-fx');
    if (!host || DEBUG.nofx) return;
    var html = [];
    for (var i = 0; i < 16; i++) {
      var size = (2.5 + Math.random() * 3.5).toFixed(1);
      html.push('<i class="firefly" style="--x:' + (3 + Math.random() * 94).toFixed(1) + '%;--y:' +
        (30 + Math.random() * 62).toFixed(1) + '%;--s:' + size + 'px;--d:' + (6.5 + Math.random() * 7).toFixed(1) +
        's;--delay:' + (-Math.random() * 12).toFixed(1) + 's;--o:' + (0.4 + Math.random() * 0.55).toFixed(2) +
        ';--dx:' + (Math.random() * 70 - 35).toFixed(0) + 'px"></i>');
    }
    var runes = ['✦', '☾', '✧', '❖', '✶'];
    for (var r = 0; r < 9; r++) {
      html.push('<i class="float-rune" style="--x:' + (5 + Math.random() * 90).toFixed(1) + '%;--y:' +
        (44 + Math.random() * 48).toFixed(1) + '%;--fs:' + (10 + Math.random() * 8).toFixed(0) + 'px;--d:' +
        (11 + Math.random() * 8).toFixed(1) + 's;--delay:' + (-Math.random() * 16).toFixed(1) + 's;--dx:' +
        (Math.random() * 56 - 28).toFixed(0) + 'px">' + runes[r % runes.length] + '</i>');
    }
    host.innerHTML = html.join('');
  }

  function buildResultAmbient() {
    var host = $('#result-embers');
    if (!host) return;
    var html = '';
    var n = DEBUG.nofx ? 16 : 26;
    for (var i = 0; i < n; i++) {
      var size = (2.5 + Math.random() * 3.2).toFixed(1);
      html += '<i style="--x:' + (5 + Math.random() * 90).toFixed(1) + '%;--s:' + size + 'px;--d:' +
        (6 + Math.random() * 8).toFixed(1) + 's;--delay:' + (-Math.random() * 13).toFixed(1) + 's;--dx:' +
        (Math.random() * 44 - 22).toFixed(0) + 'px;--o:' + (0.45 + Math.random() * 0.5).toFixed(2) + '"></i>';
    }
    host.innerHTML = html;
  }

  function buildLevelupSparks() {    var host = $('#levelup-sparks');
    if (!host) return;
    var html = '';
    for (var i = 0; i < 14; i++) {
      html += '<span style="--x:' + (4 + Math.random() * 92).toFixed(1) + '%;--y:' +
        (Math.random() * 100).toFixed(1) + '%;--fs:' + (6 + Math.random() * 7).toFixed(0) +
        'px;--d:' + (2 + Math.random() * 2.8).toFixed(1) + 's;--delay:' + (-Math.random() * 3).toFixed(1) + 's">✦</span>';
    }
    host.innerHTML = html;
  }

  function animateSparks() {
    var host = $('#levelup-sparks');
    if (!host) return;
    $$('span', host).forEach(function (s) {
      s.style.animation = 'none';
      /* force reflow to restart */
      void s.offsetWidth;
      s.style.animation = '';
    });
  }

  /* ---------- roster ---------- */
  function renderRoster() {
    var chars = characters();
    if (!els.track) return;
    if (!chars.length) {
      els.track.innerHTML = '<p style="margin:auto;color:rgba(255,244,216,.7);font-size:12px;text-align:center">角色数据还没到齐…<br>请刷新页面</p>';
      return;
    }
    els.track.innerHTML = chars.map(wizardCardMarkup).join('');
    if (els.dots) {
      els.dots.innerHTML = chars.map(function (c, i) {
        return '<button class="roster-dot' + (i === currentIndex() ? ' is-active' : '') + '" data-dot="' + i +
          '" role="tab" aria-label="' + esc(c.name) + '" aria-selected="' + (i === currentIndex()) + '"></button>';
      }).join('');
    }
    syncRosterSelection();
    requestAnimationFrame(function () {
      layoutRosterPadding();
      centerRoster(currentIndex(), false);
    });
  }

  function currentIndex() {
    var chars = characters();
    for (var i = 0; i < chars.length; i++) if (chars[i].id === state.characterId) return i;
    return 0;
  }

  function syncRosterSelection() {
    var chars = characters();
    var idx = currentIndex();
    var cardEls = $$('.wizard-card', els.track);
    cardEls.forEach(function (card, i) {
      card.classList.toggle('is-active', i === idx);
      card.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
    if (els.dots) {
      $$('.roster-dot', els.dots).forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === idx);
        dot.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
    }
    setText('#roster-index', pad2(idx + 1));
    setText('#confirm-wizard-name', (chars[idx] && chars[idx].name) || '');
  }

  function selectWizard(idx, scroll) {
    var chars = characters();
    if (!chars.length) return;
    idx = clamp(idx, 0, chars.length - 1);
    if (chars[idx].id === state.characterId) {
      if (scroll) centerRoster(idx, true);
      return;
    }
    state.characterId = chars[idx].id;
    storeSet('sb.character', state.characterId);
    syncRosterSelection();
    if (scroll) centerRoster(idx, true);
    if (window.SBAudio) SBAudio.sfx('ui-click');
  }

  function layoutRosterPadding() {
    if (!els.track) return;
    var w = els.track.clientWidth;
    if (!w) return;
    var cardW = Math.round(Math.min(w * 0.84, 344));
    els.track.style.setProperty('--card-w', cardW + 'px');
    var pad = Math.max(8, Math.round((w - cardW) / 2));
    els.track.style.paddingLeft = pad + 'px';
    els.track.style.paddingRight = pad + 'px';
  }

  function centerRoster(idx, smooth) {
    if (!els.track) return;
    var card = els.track.children[idx];
    if (!card) return;
    var left = card.offsetLeft - (els.track.clientWidth - card.offsetWidth) / 2;
    autoScrollUntil = (window.performance ? performance.now() : Date.now()) + 520;
    try {
      els.track.scrollTo({ left: left, behavior: smooth && !REDUCED ? 'smooth' : 'auto' });
    } catch (e) {
      els.track.scrollLeft = left;
    }
    setTimeout(function () {
      if (currentScreen === 'roster') syncRosterSelection();
    }, 540);
  }

  function nearestCardIndex() {
    if (!els.track) return 0;
    var center = els.track.scrollLeft + els.track.clientWidth / 2;
    var best = 0;
    var bestDist = Infinity;
    $$('.wizard-card', els.track).forEach(function (card, i) {
      var c = card.offsetLeft + card.offsetWidth / 2;
      var d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function onTrackScroll() {
    if (!els.track) return;
    if ((window.performance ? performance.now() : Date.now()) < autoScrollUntil) return;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = null;
      if (currentScreen !== 'roster') return;
      var idx = nearestCardIndex();
      var chars = characters();
      if (chars[idx] && chars[idx].id !== state.characterId) {
        state.characterId = chars[idx].id;
        storeSet('sb.character', state.characterId);
        syncRosterSelection();
      }
    });
  }

  function stepWizard(delta) {
    var len = characters().length;
    if (!len) return;
    var next = (currentIndex() + delta + len) % len;
    selectWizard(next, true);
  }

  /* ---------- lobby ---------- */
  function renderLobby() {
    setText('#room-code', state.roomCode);
    var chars = characters();
    var player = charById(state.characterId) || chars[0];
    var host = $('#lobby-slots');
    if (host && chars.length) {
      var allies = chars.filter(function (c) { return c.id !== (player && player.id); });
      var party = [player].concat(allies).slice(0, 4);
      host.innerHTML = party.map(function (c, i) { return slotMarkup(c, i === 0, i); }).join('');
    }
    setText('#lobby-party-count', (chars.length ? Math.min(chars.length, 4) : 0) + ' / 4 · AI 自动补位');
    renderDifficulties();
    var diff = difficultyById(state.difficulty);
    setText('#diff-desc', diff.desc || '');
    setText('#diff-en', diff.en || '');
    var tips = META().tips || [];
    if (tips.length) setText('#lobby-tip', tips[0]);
  }

  function renderDifficulties() {
    var host = $('#diff-grid');
    var list = difficulties();
    if (!host || !list.length) return;
    host.innerHTML = list.map(diffMarkup).join('');
  }

  function selectDifficulty(id) {
    state.difficulty = id;
    storeSet('sb.difficulty', id);
    var diff = difficultyById(id);
    $$('#diff-grid .diff-card').forEach(function (card) {
      card.classList.toggle('is-active', card.getAttribute('data-diff') === id);
    });
    setText('#diff-desc', diff.desc || '');
    setText('#diff-en', diff.en || '');
    if (window.SBAudio) SBAudio.sfx('ui-click');
  }

  /* ---------- room / copy ---------- */
  function buildInviteText(mode) {
    var share = metaShare();
    var code = state.roomCode;
    var diff = difficultyById(state.difficulty);
    if (mode === 'result' && lastResult) {
      var text = share.text || '我在《咒语旅团》组队开团！';
      text = text.replace('{time}', String(Math.round(lastResult.time || 0)))
        .replace('{kills}', String(lastResult.kills || 0));
      return (share.title ? share.title + '\n' : '') + text + '\n房间码：' + code + '\n' + (share.hashtags || '');
    }
    return '篝火已点，四人小队等你入伙！《咒语旅团》今夜难度：' + (diff.name || '月蚀之夜') +
      '。火冰电酸都到齐了，就差你一个。\n房间码：' + code + '\n' + (share.hashtags || '');
  }

  function copyText(text, opts) {
    opts = opts || {};
    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      if (ok) toast(opts.success || '已复制，去骚扰你的朋友吧', 'ok');
      else {
        toast(opts.error || '自动复制失败，请手动复制', 'err');
        if (opts.onFallback) opts.onFallback(text);
        else showManualCopy(text);
      }
    }
    function legacy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        finish(ok);
      } catch (e) { finish(false); }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { finish(true); }, legacy);
      } else legacy();
    } catch (e) { legacy(); }
  }

  function showManualCopy(text) {
    var ta = $('#manual-copy-text');
    if (ta) ta.value = text;
    openModal('copy');
    setTimeout(function () {
      if (!ta) return;
      try { ta.focus(); ta.select(); } catch (e) {}
    }, 400);
  }

  function copyLobbyInvite() {
    var text = buildInviteText('lobby');
    copyText(text, {
      success: '邀请码已复制 · 去骚扰你的朋友吧',
      onFallback: function (t) {
        var shareManual = $('#share-manual');
        if (shareManual) shareManual.classList.add('is-hidden');
        showManualCopy(t);
      }
    });
  }

  /* ---------- share poster ---------- */
  function renderSharePoster(mode) {
    shareMode = mode === 'lobby' ? 'lobby' : 'result';
    var chars = characters();
    if (!chars.length || !els.poster) return;
    var ch = charById((shareMode === 'result' && lastResult && lastResult.characterId) || state.characterId) || chars[0];
    var el = elementOf(ch.element);
    var isResult = shareMode === 'result' && !!lastResult;
    var result = isResult ? lastResult : null;
    var diff = difficultyById(state.difficulty);
    var party;
    if (isResult && lastParty && lastParty.length) party = lastParty.slice(0, 4);
    else {
      var allies = chars.filter(function (c) { return c.id !== ch.id; });
      party = [ch].concat(allies).slice(0, 4);
    }
    var title = result
      ? (result.result === 'defeat' ? '差一点就赢' : '黎明幸存者')
      : '篝火已点 · 等你入伙';
    var quote = ch.quote || ch.tagline || '';
    var cellA = result
      ? [{ v: fmtShortTime(result.time), l: '用时' }, { v: fmtNum(result.kills), l: '击杀' }, { v: fmtNum(result.score), l: '分数' }]
      : [{ v: '4 人', l: '小队' }, { v: diff.name || '标准', l: '难度' }, { v: state.roomCode.split('-')[1] || '----', l: '房间码' }];
    var badge = result ? (result.result === 'defeat' ? 'TRY AGAIN' : 'DAWN SURVIVOR') : 'TEAM INVITE';

    els.poster.style.setProperty('--accent', el.color);
    els.poster.innerHTML =
      '<div class="poster-art">' +
        '<img class="poster-hero" src="assets/hero-scene.svg" alt="" onerror="this.style.display=\'none\'">' +
        '<div class="poster-logo"><b>咒语旅团</b><i>THE SPELL BRIGADE</i></div>' +
        '<div class="poster-portrait-fallback">' + esc((ch.name || '?').charAt(0)) + '</div>' +
        '<img class="poster-portrait" src="' + esc(ch.portrait || '') + '" alt="" ' +
          'onload="var f=this.previousElementSibling;if(f&&f.className===\'poster-portrait-fallback\')f.style.display=\'none\'" onerror="this.style.display=\'none\'">' +
        '<span class="poster-badge">' + esc(badge) + '</span>' +
      '</div>' +
      '<div class="poster-body">' +
        '<div class="poster-name-row"><b>' + esc(ch.name) + '</b><span>' + esc(ch.en || '') + '</span></div>' +
        '<div class="poster-title">' + esc(title) + '</div>' +
        (quote ? '<p class="poster-quote">「' + esc(quote) + '」</p>' : '') +
        '<div class="poster-stats">' + cellA.map(function (c) {
          return '<div class="poster-stat"><b>' + esc(c.v) + '</b><i>' + esc(c.l) + '</i></div>';
        }).join('') + '</div>' +
        '<div class="poster-party-label"><span>同行巫师</span><i></i><em>' + esc(diff.name || '') + '</em></div>' +
        '<div class="poster-party">' + party.map(function (p, i) {
          var pch = charById(p.id) || { name: p.name, element: p.element, portrait: p.portrait, theme: { gradient: [elementOf(p.element).color, '#2a1a3d'] } };
          return '<div class="poster-member">' + avatarMarkup(pch) + '<span>' + (i === 0 && isResult ? '你' : esc(pch.name || '')) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="poster-foot">' +
          '<div class="poster-cta">组队开启弹幕冒险</div>' +
          '<div class="poster-code">房间码 · ' + esc(state.roomCode) + '</div>' +
          '<div class="poster-hash">' + esc(metaShare().hashtags || '') + '</div>' +
        '</div>' +
      '</div>';
    var manual = $('#share-manual');
    if (manual) {
      manual.removeAttribute('hidden');
      manual.classList.add('is-hidden');
    }
    requestAnimationFrame(sizePoster);
  }

  function sizePoster() {
    var wrap = $('.share-poster-wrap');
    if (!wrap || !els.poster) return;
    var cs = window.getComputedStyle(wrap);
    var padT = parseFloat(cs.paddingTop) || 0;
    var padB = parseFloat(cs.paddingBottom) || 0;
    var padL = parseFloat(cs.paddingLeft) || 0;
    var padR = parseFloat(cs.paddingRight) || 0;
    var availW = wrap.clientWidth - padL - padR;
    var availH = wrap.clientHeight - padT - padB;
    if (!availW || !availH) return;
    var ph = Math.min(availH - 2, availW * 16 / 9, 560);
    var pw = ph * 9 / 16;
    els.poster.style.width = Math.round(pw) + 'px';
    els.poster.style.height = Math.round(ph) + 'px';
  }

  function openShare(mode) {
    if (mode === 'result') {
      if (!lastResult) lastResult = makeDemoResult('victory');
    }
    renderSharePoster(mode || 'result');
    openModal('share');
    requestAnimationFrame(sizePoster);
  }

  function copyShareInvite() {
    var text = buildInviteText(shareMode);
    copyText(text, {
      success: '邀请已复制，带房间码和战绩',
      onFallback: function (t) {
        var manual = $('#share-manual');
        var ta = $('#share-manual-text');
        if (manual && ta) {
          ta.value = t;
          manual.classList.remove('is-hidden');
          try { ta.focus(); ta.select(); } catch (e) {}
        }
      }
    });
  }

  /* ---------- game HUD ---------- */
  function onGameEnter() {
    resetGameHud();
    hideEngineVeil();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (currentScreen === 'game') beginBattle();
      });
    });
  }

  function resetGameHud() {
    lastHud = null;
    lastParty = null;
    partySig = '';
    partyEls = {};
    downSince = {};
    spellList = [];
    upgradeLock = false;
    engineRetry = 0;
    showStageFallback();
    var meta = META();
    var chars = characters();
    var player = charById(state.characterId) || chars[0];
    if (player) {
      var startSpell = spellById(player.startSpell);
      if (startSpell) spellList = [startSpell];
      else if (player.startSpell) spellList = [{ id: player.startSpell, name: '起始法术', element: player.element, icon: '' }];
    }
    var party = [];
    if (player) {
      party.push({ id: player.id, name: player.name, element: player.element, portrait: player.portrait, hp: 100, maxHp: 100, alive: true });
      chars.forEach(function (c) {
        if (c.id !== player.id && party.length < 4) party.push({ id: c.id, name: c.name, element: c.element, portrait: c.portrait, hp: 100, maxHp: 100, alive: true });
      });
    }
    buildParty(party);
    partySig = party.map(function (p) { return p.id; }).join('|');
    setText('#hud-stage-name', meta.stageName || '遗忘回廊');
    setText('#hud-clock-label', '黎明倒计时');
    els.hpFill.style.width = '100%';
    els.hpText.textContent = '100 / 100';
    els.hpBar.classList.remove('is-low');
    els.xpFill.style.width = '0%';
    setText('#hud-level', '1');
    setText('#hud-time', fmtClock(meta.timeLimit || 150));
    setText('#hud-kills', '0');
    setText('#hud-wave', (meta.waves && meta.waves[0] && meta.waves[0].name) || '第一夜');
    setText('#hud-wave-num', '1/' + ((meta.waves && meta.waves.length) || 5));
    setText('#boss-name', '梦魇领主');
    els.bossbar.classList.add('is-hidden');
    $('#boss-fill').style.width = '100%';
    els.lowhp.classList.remove('is-on');
    setDash(0, 3);
    renderSpellBar();
    var screen = $('#screen-game');
    if (screen) screen.classList.remove('is-urgent');
  }

  function beginBattle() {
    var Ctor = window.SpellBrigadeGame;
    if (typeof Ctor === 'function') {
      try { startEngine(Ctor); }
      catch (err) {
        try { console.error('[UI] engine start failed', err); } catch (e) {}
        showEngineVeil('魔法出了点岔子', '引擎没能点火成功。刷新页面再试一次，或先返回大厅。');
        revealVeilBack();
      }
    } else if (DEBUG.screen === 'game' || DEBUG.demo) {
      startDemoBattle();
    } else {
      showEngineVeil();
      setTimeout(function () {
        if (SBGame) return;
        updateVeilMessage('魔法引擎还没到场', '旅团引擎尚未加载完成。请刷新页面，或返回大厅稍后再来。');
        revealVeilBack();
      }, 1650);
    }
  }

  function startEngine(Ctor) {
    var stage = $('#battle-stage');
    var canvas = $('#game-canvas');
    if (!stage || !canvas) { showEngineVeil('战场还没准备好', '请刷新页面后重试。'); revealVeilBack(); return; }
    if (!stage.clientWidth || !stage.clientHeight) {
      engineRetry++;
      if (engineRetry < 30) { setTimeout(function () { if (currentScreen === 'game') startEngine(Ctor); }, 100); return; }
      showEngineVeil('战场还没准备好', '画布尺寸异常，刷新页面再试一次吧。');
      revealVeilBack();
      return;
    }
    var player = charById(state.characterId) || characters()[0];
    if (!player) { showEngineVeil('巫师还没到场', '角色数据未加载完成，请刷新页面。'); revealVeilBack(); return; }
    var allies = characters().filter(function (c) { return c.id !== player.id; })
      .slice(0, 3).map(function (c) { return c.id; });

    var token = ++gameToken;
    SBGame = new Ctor({
      canvas: canvas,
      playerId: player.id,
      allyIds: allies,
      difficulty: state.difficulty,
      onHud: function (hud) { if (token !== gameToken) return; updateGameHud(hud); },
      onLevelUp: function (choices) { if (token !== gameToken) return; showUpgrade(choices); },
      onGameOver: function (stats) { if (token !== gameToken) return; endBattle(stats, 'defeat'); },
      onVictory: function (stats) { if (token !== gameToken) return; endBattle(stats, 'victory'); },
      onEvent: function (type, payload) { if (token !== gameToken) return; handleGameEvent(type, payload); }
    });
    /* Contract §7.3: expose the live instance for QA / share / debug tooling. */
    window.SBGame = SBGame;
    if (SBGame && typeof SBGame.start === 'function') SBGame.start();
    /* The painted fallback scene must never sit on top of the live canvas. */
    var started = setTimeout(function () { hideStageFallback(); }, 120);
    if (!SBGame || !SBGame.player) {
      /* engine refused to start: keep the fallback + show a friendly panel */
      clearTimeout(started);
      showEngineVeil('魔法出了点岔子', '引擎没能点火成功。刷新页面再试一次，或先返回大厅。');
      revealVeilBack();
    }
    startTutorial();
  }

  function hideStageFallback() {
    var fb = $('#stage-fallback');
    if (fb) fb.classList.add('is-hidden');
  }

  function showStageFallback() {
    var fb = $('#stage-fallback');
    if (fb) fb.classList.remove('is-hidden');
  }

  function destroyGame() {
    gameToken++;
    if (SBGame) {
      try { SBGame.destroy(); } catch (e) {}
      SBGame = null;
    }
    if (window.SBGame) window.SBGame = null;
    clearTimeout(tutorialTimer);
    tutorialTimer = null;
  }

  function updateGameHud(hud) {
    if (!hud) return;
    lastHud = hud;
    if (hud.party && hud.party.length) lastParty = hud.party;
    var meta = META();
    var hp = Number(hud.hp);
    var maxHp = Number(hud.maxHp) || 100;
    if (!isNaN(hp)) {
      var hpPct = clamp(hp / maxHp, 0, 1);
      els.hpFill.style.width = (hpPct * 100).toFixed(1) + '%';
      els.hpText.textContent = Math.max(0, Math.ceil(hp)) + ' / ' + Math.round(maxHp);
      els.hpBar.classList.toggle('is-low', hpPct < 0.3);
      els.lowhp.classList.toggle('is-on', hpPct < 0.3);
    }
    if (typeof hud.level === 'number') setText('#hud-level', hud.level);
    if (typeof hud.xpNext === 'number' && hud.xpNext > 0) {
      els.xpFill.style.width = clamp((Number(hud.xp) || 0) / hud.xpNext, 0, 1) * 100 + '%';
    }
    var limit = Number(hud.timeLimit) || meta.timeLimit || 150;
    var elapsed = Number(hud.time) || 0;
    var remain = clamp(limit - elapsed, 0, limit);
    setText('#hud-time', fmtClock(remain));
    var gscreen = $('#screen-game');
    if (gscreen) gscreen.classList.toggle('is-urgent', remain <= 30 && remain > 0);
    if (typeof hud.kills === 'number') setText('#hud-kills', fmtNum(hud.kills));
    var waveTotal = (meta.waves && meta.waves.length) || 5;
    var waveNum = clamp(Number(hud.wave) || 1, 1, waveTotal);
    setText('#hud-wave-num', waveNum + '/' + waveTotal);
    var waveName = hud.waveName || (meta.waves && meta.waves[waveNum - 1] && meta.waves[waveNum - 1].name) || '';
    if (waveName) setText('#hud-wave', waveName);
    if (hud.boss) {
      els.bossbar.classList.remove('is-hidden');
      setText('#boss-name', hud.boss.name || '梦魇领主');
      var bMax = Number(hud.boss.maxHp) || 1;
      $('#boss-fill').style.width = clamp((Number(hud.boss.hp) || 0) / bMax, 0, 1) * 100 + '%';
    } else {
      els.bossbar.classList.add('is-hidden');
    }
    setDash(hud.dashCd, hud.dashMax);
    if (hud.party && hud.party.length) updateParty(hud.party, elapsed);
  }

  function setDash(cd, max) {
    cd = Math.max(0, Number(cd) || 0);
    max = Number(max) || 3;
    var pct = max > 0 ? clamp(1 - cd / max, 0, 1) : 1;
    if (els.dashRing) {
      els.dashRing.style.strokeDashoffset = String(CIRC * (1 - pct));
    }
    if (els.dashText) els.dashText.textContent = cd > 0.06 ? (cd >= 1 ? Math.ceil(cd) + 's' : cd.toFixed(1) + 's') : '冲刺';
    if (els.dash) {
      els.dash.classList.toggle('is-cooling', cd > 0.06);
      els.dash.classList.toggle('is-ready', cd <= 0.06);
    }
  }

  function buildParty(party) {
    if (!els.hudParty) return;
    els.hudParty.innerHTML = party.map(partyMiniMarkup).join('');
    partyEls = {};
    $$('.party-mini', els.hudParty).forEach(function (el) {
      partyEls[el.getAttribute('data-pid')] = el;
    });
  }

  function updateParty(party, time) {
    var sig = party.map(function (p) { return p.id; }).join('|');
    if (sig !== partySig) {
      buildParty(party);
      partySig = sig;
    }
    party.forEach(function (p) {
      var el = partyEls[p.id];
      if (!el) return;
      var pMax = Number(p.maxHp) || 1;
      var pct = clamp((Number(p.hp) || 0) / pMax, 0, 1);
      var bar = el.querySelector('.party-hp i');
      if (bar) bar.style.width = (pct * 100).toFixed(1) + '%';
      el.classList.toggle('is-low', p.alive !== false && pct < 0.35);
      var down = el.querySelector('.party-down');
      if (p.alive === false) {
        el.classList.add('is-down');
        if (downSince[p.id] == null) downSince[p.id] = Number(time) || 0;
        var remain = Math.max(0, 8 - ((Number(time) || 0) - downSince[p.id]));
        if (down) {
          down.classList.remove('is-hidden');
          var timer = down.querySelector('.party-timer');
          if (timer) timer.textContent = remain > 0 ? Math.ceil(remain) + 's' : '…';
        }
      } else {
        el.classList.remove('is-down');
        delete downSince[p.id];
        if (down) down.classList.add('is-hidden');
      }
    });
  }

  function renderSpellBar() {
    if (!els.hudSpells) return;
    var list = spellList.filter(Boolean);
    els.hudSpells.innerHTML = list.map(function (sp) { return spellChipMarkup(sp); }).join('');
    els.hudSpells.classList.toggle('is-dense', list.length >= 3);
    var label = list.length === 1 ? ('SPELLS · ' + list[0].name) : (list.length > 1 ? 'SPELLS · ' + list.length : 'SPELLS');
    els.hudSpells.setAttribute('data-label', label);
  }

  function addSpellFromChoice(choice) {
    if (!choice) return;
    var icon = String(choice.icon || '');
    if (!/spell-/.test(icon)) return;
    if (/被动/.test(choice.tag || '')) return;
    if (spellList.length >= 4) return;
    if (spellList.some(function (sp) { return sp && sp.icon === icon; })) return;
    spellList.push({
      id: choice.id, name: choice.name, en: choice.en,
      element: choice.element, icon: icon
    });
    renderSpellBar();
    var chips = $$('.spell-chip', els.hudSpells);
    var last = chips[chips.length - 1];
    if (last) last.classList.add('is-new');
  }

  /* ---------- level up ---------- */
  function showUpgrade(choices) {
    if (!choices || !choices.length) {
      toast('法术共鸣没有回应…', 'err');
      return;
    }
    currentChoices = choices.slice(0, 3);
    upgradeLock = false;
    var grid = $('#upgrade-grid');
    if (!grid) return;
    if (lastHud && lastHud.level) setText('#levelup-level', 'LEVEL ' + lastHud.level);
    grid.innerHTML = currentChoices.map(function (c, i) {
      var el = elementOf(c.element);
      var rarity = RARITY[c.rarity] || RARITY.common;
      var rarityLabel = c.rarityLabel || rarity.label;
      return '<button class="upgrade-card" data-choice="' + i + '" style="--rarity:' + rarity.color + ';--el-color:' + el.color + '">' +
        '<span class="up-key">' + (i + 1) + '</span>' +
        '<span class="up-icon-wrap" style="--el-color:' + el.color + '">' +
          '<span class="up-glyph">' + esc(ELEMENT_GLYPH[c.element] || '✦') + '</span>' +
          '<img src="' + esc(c.icon || '') + '" alt="" onload="this.parentNode.classList.add(\'has-art\')" onerror="this.style.display=\'none\'">' +
          '<span class="up-el">' + elIconMarkup(c.element) + '</span>' +
        '</span>' +
        '<span class="up-rarity">' + esc(rarityLabel) + '</span>' +
        '<h4 class="up-name">' + esc(c.name) + '</h4>' +
        '<span class="up-en">' + esc(c.en || '') + '</span>' +
        '<p class="up-desc">' + esc(c.desc || '') + '</p>' +
        '<span class="up-tag">' + esc(c.tag || '法术') + '</span>' +
        '<span class="up-shine"></span>' +
      '</button>';
    }).join('');
    openModal('levelup');
    if (window.SBAudio) { try { SBAudio.sfx('level-up'); } catch (e) {} }
  }

  function chooseUpgrade(choice) {
    if (!choice || upgradeLock) return;
    upgradeLock = true;
    var cards = $$('#upgrade-grid .upgrade-card');
    var idx = currentChoices.indexOf(choice);
    if (cards[idx]) cards[idx].classList.add('is-chosen');
    if (window.SBAudio) { try { SBAudio.sfx('ui-confirm'); } catch (e) {} }
    setTimeout(function () {
      try {
        if (SBGame && typeof SBGame.applyUpgrade === 'function') SBGame.applyUpgrade(choice.id);
      } catch (e) {}
      addSpellFromChoice(choice);
      closeModal();
      upgradeLock = false;
      currentChoices = null;
    }, 240);
  }

  /* ---------- pause / end ---------- */
  function openPause() {
    if (currentScreen !== 'game') return;
    if (openModalName === 'levelup') return; /* never cover a pending resonance */
    /* open the menu first so a synchronous engine 'pause' event can't recurse */
    syncAudioUI();
    openModal('pause');
    if (SBGame && typeof SBGame.pause === 'function') {
      try { SBGame.pause(); } catch (e) {}
    }
  }

  function resumeBattle() {
    closeModal();
    if (SBGame && typeof SBGame.resume === 'function') {
      try { SBGame.resume(); } catch (e) {}
    }
  }

  function restartBattle() {
    closeModal();
    clearToasts();
    destroyGame();
    hideTutorial();
    onGameEnter();
  }

  function endBattle(stats, type) {
    var result = {};
    if (stats && typeof stats === 'object') {
      for (var k in stats) if (Object.prototype.hasOwnProperty.call(stats, k)) result[k] = stats[k];
    }
    result.result = type || result.result || 'defeat';
    result.characterId = result.characterId || state.characterId;
    if (!result.grade) result.grade = result.result === 'victory' ? 'A' : 'C';
    if (typeof result.time !== 'number') result.time = lastHud ? Number(lastHud.time) || 0 : 0;
    if (typeof result.kills !== 'number') result.kills = lastHud ? Number(lastHud.kills) || 0 : 0;
    if (typeof result.level !== 'number') result.level = lastHud ? Number(lastHud.level) || 1 : 1;
    if (!lastParty || !lastParty.length) {
      var player = charById(result.characterId) || characters()[0];
      if (player) {
        lastParty = [{ id: player.id, name: player.name, element: player.element, portrait: player.portrait }].concat(
          characters().filter(function (c) { return c.id !== player.id; }).slice(0, 3).map(function (c) {
            return { id: c.id, name: c.name, element: c.element, portrait: c.portrait };
          })
        );
      }
    }
    lastResult = result;
    closeModal(true);
    hideTutorial();
    if (window.SBAudio) { try { SBAudio.sfx(result.result === 'victory' ? 'victory' : 'defeat'); } catch (e) {} }
    showScreen('result');
  }

  function handleGameEvent(type, payload) {
    if (type === 'wave') {
      /* The HUD wave label already updates from the onHud payload; a toast
         here would cover the party row. Keep the battlefield readable. */
      return;
    } else if (type === 'boss') {
      /* The engine already paints its own full Boss cinematic + HUD bar. */
      return;
    } else if (type === 'toast') {
      var msg = typeof payload === 'string' ? payload : (payload && payload.message);
      if (msg) toast(msg, 'info');
    } else if (type === 'pause') {
      if (currentScreen === 'game' && !openModalName) openPause();
    }
  }

  function showBossBanner(name) {
    var banner = $('#boss-banner');
    if (!banner) return;
    var b = $('.bb-text b', banner);
    if (b) b.textContent = name ? String(name).split('').join(' ') : '梦 魇 领 主';
    banner.classList.remove('is-show');
    void banner.offsetWidth;
    banner.classList.add('is-show');
    clearTimeout(showBossBanner._t);
    showBossBanner._t = setTimeout(function () { banner.classList.remove('is-show'); }, 2900);
  }

  /* ---------- tutorial / veil ---------- */
  function startTutorial() {
    if (!els.tutorial) return;
    els.tutorial.classList.remove('is-hidden');
    clearTimeout(tutorialTimer);
    if (!DEBUG.nofx) tutorialTimer = setTimeout(hideTutorial, 3400);
  }

  function hideTutorial() {
    clearTimeout(tutorialTimer);
    tutorialTimer = null;
    if (els.tutorial) els.tutorial.classList.add('is-hidden');
  }

  function showEngineVeil(title, text) {
    if (!els.veil) return;
    els.veil.classList.remove('is-hidden');
    updateVeilMessage(title || '正在唤醒魔法…', text || '旅团的法杖正在赶来，请稍等片刻。');
    $('#btn-veil-back').classList.add('is-hidden');
  }

  function updateVeilMessage(title, text) {
    setText('#veil-title', title);
    setText('#veil-text', text);
  }

  function revealVeilBack() {
    $('#btn-veil-back').classList.remove('is-hidden');
  }

  function hideEngineVeil() {
    if (els.veil) els.veil.classList.add('is-hidden');
  }

  /* ---------- result ---------- */
  function renderResult(result) {
    result = result || makeDemoResult('victory');
    lastResult = result;
    var screenEl = $('#screen-result');
    var win = result.result !== 'defeat';
    if (screenEl) screenEl.classList.toggle('is-defeat', !win);
    var mres = metaResult();
    setText('#result-eyebrow', win ? 'DAWN SURVIVED · THE RUN IS OVER' : 'THE FIRE WENT OUT · THE RUN IS OVER');
    setText('#result-title', win ? (mres.victoryTitle || '黎明，来了') : (mres.defeatTitle || '篝火，熄了'));
    setText('#result-sub', win ? (mres.victorySub || '') : (mres.defeatSub || ''));

    var grade = String(result.grade || 'B').toUpperCase();
    if ('SABC'.indexOf(grade) < 0) grade = 'B';
    var seal = $('#grade-seal');
    if (seal) seal.setAttribute('data-grade', grade);
    setText('#result-grade', grade);
    setText('#result-grade-for', GRADE_FOR[grade] || 'RITUAL COMPLETE');
    var diff = difficultyById(state.difficulty);
    setText('#result-difficulty', diff.name || '');
    var qch = charById(result.characterId) || characters()[0] || {};
    var quoteText = qch.quote || qch.tagline || '';
    setText('#result-quote-text', quoteText);
    setText('#result-quote-by', '— ' + (qch.name || '') + (qch.alias ? ' · ' + qch.alias : ''));

    var stats = [
      { icon: 'clock', value: fmtShortTime(result.time), label: '用时' },
      { icon: 'skull', value: fmtNum(result.kills), label: '击杀' },
      { icon: 'star', value: 'Lv.' + (Number(result.level) || 1), label: '等级' },
      { icon: 'sword', value: fmtNum(result.damage), label: '造成伤害' },
      { icon: 'shield', value: fmtNum(result.damageTaken), label: '承受伤害' },
      { icon: 'trophy', value: fmtNum(result.score), label: '总分' }
    ];
    var host = $('#result-stats');
    if (host) {
      host.innerHTML = stats.map(function (s) {
        return '<div class="stat-cell"><svg class="ico"><use href="#i-' + s.icon + '"/></svg>' +
          '<b>' + esc(s.value) + '</b><span>' + s.label + '</span></div>';
      }).join('');
    }

    var party = (lastParty && lastParty.length) ? lastParty.slice(0, 4) : [];
    if (!party.length) {
      var player = charById(result.characterId) || characters()[0];
      if (player) {
        party = [player].concat(characters().filter(function (c) { return c.id !== player.id; })).slice(0, 4);
      }
    }
    var partyHost = $('#result-party');
    if (partyHost) {
      partyHost.innerHTML = party.map(function (p, i) {
        var ch = charById(p.id) || p;
        var el = elementOf(ch.element || p.element);
        return '<div class="result-member" style="--mem-accent:' + esc(el.color) + '">' +
          (i === 0 ? '<span class="result-player-tag">你</span>' : '') +
          avatarMarkup(ch) +
          '<span>' + esc(ch.name || p.name || '') + '</span>' +
          '<em>' + esc(el.en) + '</em>' +
        '</div>';
      }).join('');
    }
  }

  function makeDemoResult(kind) {
    var defeat = kind === 'defeat';
    return {
      result: defeat ? 'defeat' : 'victory',
      characterId: state.characterId,
      time: defeat ? 113 : 150,
      kills: defeat ? 74 : 137,
      level: defeat ? 9 : 14,
      damage: defeat ? 21840 : 48620,
      damageTaken: defeat ? 9860 : 3240,
      score: defeat ? 7260 : 20480,
      grade: defeat ? 'C' : 'S',
      wave: defeat ? 4 : 5
    };
  }

  /* ---------- debug / demo battle ---------- */
  function demoHud() {
    var chars = characters();
    var party = chars.slice(0, 4).map(function (c, i) {
      return {
        id: c.id, name: c.name, element: c.element, portrait: c.portrait,
        hp: i === 3 ? 0 : [86, 74, 92, 0][i] || 80,
        maxHp: 120, alive: i !== 3
      };
    });
    var time = 122;
    return {
      hp: DEBUG.lowhp ? 24 : 82, maxHp: 120, level: 7, xp: 62, xpNext: 100,
      time: time, timeLimit: 150, kills: 96, wave: 5,
      waveName: (META().waves && META().waves[4] && META().waves[4].name) || '最后之夜',
      boss: { name: '梦魇领主', hp: 640, maxHp: 1200 },
      dashCd: 1.4, dashMax: 3, score: 12680, party: party
    };
  }

  var DEMO_CHOICES = [
    { id: 'demo-frost-nova', name: '霜环新星', en: 'FROST NOVA', element: 'ice', rarity: 'epic', rarityLabel: '史诗', icon: 'assets/spell-frost.svg', desc: '以自身为中心炸开霜环，冻结周围全部敌人。', tag: '新法术' },
    { id: 'demo-ember-core', name: '暴烈火种', en: 'EMBER CORE', element: 'fire', rarity: 'rare', rarityLabel: '稀有', icon: 'assets/spell-fireball.svg', desc: '火球伤害 +35%，爆炸范围显著扩大。', tag: '武器强化' },
    { id: 'demo-moon-crit', name: '月之暴击', en: 'LUNAR CRIT', element: 'lightning', rarity: 'legendary', rarityLabel: '传说', icon: 'assets/spell-blade.svg', desc: '暴击率 +18%，暴击时额外降下月雷。', tag: '被动强化' }
  ];

  function startDemoBattle() {
    hideEngineVeil();
    resetGameHud();
    showStageFallback();
    var hud = demoHud();
    updateGameHud(hud);
    startTutorial();
    toast('演示 HUD 模式 · 引擎尚未加载', 'info');
  }

  function startDebug() {
    var s = DEBUG.screen;
    if (s === 'share') {
      lastResult = makeDemoResult(DEBUG.result || 'victory');
      showScreen('result');
      setTimeout(function () { if (currentScreen === 'result') openShare('result'); }, 320);
      return;
    }
    if (s === 'result') {
      lastResult = makeDemoResult(DEBUG.result || 'victory');
      showScreen('result');
      return;
    }
    if (s === 'game') {
      showScreen('game');
      if (DEBUG.modal) {
        setTimeout(openDebugModal, 520);
      }
      return;
    }
    showScreen(s);
  }

  function openDebugModal() {
    var m = DEBUG.modal;
    if (m === 'levelup') {
      var done = false;
      if (SBGame && typeof SBGame.debugLevelUp === 'function') {
        try { done = SBGame.debugLevelUp(); } catch (e) { done = false; }
      }
      if (!done) {
        if (SBGame && typeof SBGame.pause === 'function') { try { SBGame.pause(); } catch (e) {} }
        showUpgrade(DEMO_CHOICES);
      }
    } else if (m === 'pause') {
      openPause();
    } else if (m === 'result') {
      if (SBGame && typeof SBGame.debugWin === 'function') { try { SBGame.debugWin(); } catch (e) {} }
      else { lastResult = makeDemoResult('victory'); showScreen('result'); }
    } else if (m === 'defeat') {
      if (SBGame && typeof SBGame.debugLose === 'function') { try { SBGame.debugLose(); } catch (e) {} }
      else { lastResult = makeDemoResult('defeat'); showScreen('result'); }
    } else if (m === 'boss') {
      if (SBGame && typeof SBGame.debugSpawnBoss === 'function') { try { SBGame.debugSpawnBoss(); } catch (e) {} }
    } else if (m === 'settings') {
      syncAudioUI();
      openModal('settings');
    } else if (m === 'share') {
      if (!lastResult) lastResult = makeDemoResult('victory');
      openShare('result');
    } else if (m === 'copy') {
      showManualCopy(buildInviteText('lobby'));
    }
  }

  /* ---------- events ---------- */
  function bindEvents() {
    bindFirstGesture();

    /* global button sounds */
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!btn || btn.disabled) return;
      if (btn.id === 'btn-dash') return;
      if (window.SBAudio) {
        try { SBAudio.sfx(btn.getAttribute('data-sound') || 'ui-click'); } catch (err) {}
      }
    });

    /* backdrop + modal close */
    $('#modal-backdrop').addEventListener('click', onBackdropClick);
    $$('[data-close-modal]').forEach(function (b) { b.addEventListener('click', function () { closeModal(); }); });
    $('#btn-settings-x').addEventListener('click', function () { closeModal(); });
    $('#btn-settings-close').addEventListener('click', function () { closeModal(); });
    $('#btn-share-close').addEventListener('click', function () { closeModal(); });
    $('#btn-copy-done').addEventListener('click', function () { closeModal(); });

    /* navigation */
    $$('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-nav');
        if (window.SBAudio) { try { SBAudio.sfx('ui-back'); } catch (e) {} }
        showScreen(target);
      });
    });

    /* home */
    $('#btn-start').addEventListener('click', function () { showScreen('roster'); });
    $('#btn-party').addEventListener('click', function () { showScreen('lobby'); });
    $('#btn-home-sound').addEventListener('click', quickToggleSound);
    $('#btn-home-settings').addEventListener('click', function () {
      syncAudioUI();
      openModal('settings');
    });

    /* roster */
    els.track.addEventListener('scroll', onTrackScroll, { passive: true });
    els.track.addEventListener('click', function (e) {
      var card = e.target.closest('.wizard-card');
      if (!card) return;
      selectWizard(Number(card.getAttribute('data-index')), true);
    });
    if (els.dots) {
      els.dots.addEventListener('click', function (e) {
        var dot = e.target.closest('.roster-dot');
        if (!dot) return;
        selectWizard(Number(dot.getAttribute('data-dot')), true);
      });
    }
    $('#roster-prev').addEventListener('click', function () { stepWizard(-1); });
    $('#roster-next').addEventListener('click', function () { stepWizard(1); });
    $('#btn-confirm-wizard').addEventListener('click', function () {
      storeSet('sb.character', state.characterId);
      showScreen('lobby');
    });

    /* lobby */
    $('#btn-copy-invite').addEventListener('click', copyLobbyInvite);
    $('#btn-open-share').addEventListener('click', function () { openShare(lastResult ? 'result' : 'lobby'); });
    $('#diff-grid').addEventListener('click', function (e) {
      var card = e.target.closest('.diff-card');
      if (card) selectDifficulty(card.getAttribute('data-diff'));
    });
    $('#btn-enter').addEventListener('click', function () { showScreen('game'); });

    /* game */
    $('#btn-pause').addEventListener('click', openPause);
    $('#btn-pause-resume').addEventListener('click', resumeBattle);
    $('#btn-pause-restart').addEventListener('click', restartBattle);
    $('#btn-pause-lobby').addEventListener('click', function () { closeModal(); showScreen('lobby'); });
    $('#pause-music').addEventListener('click', function () { setSetting('music', !state.settings.music); });
    $('#pause-sfx').addEventListener('click', function () { setSetting('sfx', !state.settings.sfx); });
    $('#tut-close').addEventListener('click', hideTutorial);
    els.tutorial.addEventListener('click', function (e) {
      if (e.target.closest('.tut-close')) return;
      hideTutorial();
    });
    $('#btn-veil-back').addEventListener('click', function () {
      hideEngineVeil();
      showScreen('lobby');
    });

    /* level up cards */
    $('#upgrade-grid').addEventListener('click', function (e) {
      var card = e.target.closest('.upgrade-card');
      if (!card) return;
      var idx = Number(card.getAttribute('data-choice'));
      if (currentChoices && currentChoices[idx]) chooseUpgrade(currentChoices[idx]);
    });

    /* result */
    $('#btn-again').addEventListener('click', function () { showScreen('game'); });
    $('#btn-result-lobby').addEventListener('click', function () { showScreen('lobby'); });
    $('#btn-result-share').addEventListener('click', function () { openShare('result'); });

    /* share */
    $('#btn-share-copy').addEventListener('click', copyShareInvite);

    /* settings */
    $('#setting-music').addEventListener('click', function () { setSetting('music', !state.settings.music); });
    $('#setting-sfx').addEventListener('click', function () { setSetting('sfx', !state.settings.sfx); });
    $('#btn-reset').addEventListener('click', resetProgress);

    /* keyboard */
    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (openModalName === 'pause') { e.preventDefault(); resumeBattle(); }
      else if (openModalName === 'settings' || openModalName === 'share' || openModalName === 'copy') { e.preventDefault(); closeModal(); }
      return;
    }
    if (openModalName === 'levelup') {
      var n = Number(e.key);
      if (n >= 1 && n <= 3 && currentChoices && currentChoices[n - 1]) {
        e.preventDefault();
        chooseUpgrade(currentChoices[n - 1]);
      }
      return;
    }
    if (currentScreen === 'roster') {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepWizard(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepWizard(1); }
      else if (e.key === 'Enter') { e.preventDefault(); showScreen('lobby'); }
    }
  }

  function resetProgress() {
    var btn = $('#btn-reset');
    var label = $('#reset-label');
    if (!resetArmed) {
      resetArmed = true;
      if (label) label.textContent = '再点一次确认';
      if (btn) btn.classList.add('is-armed');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        resetArmed = false;
        if (label) label.textContent = '重置进度';
        if (btn) btn.classList.remove('is-armed');
      }, 3200);
      return;
    }
    resetArmed = false;
    clearTimeout(resetTimer);
    if (label) label.textContent = '重置进度';
    if (btn) btn.classList.remove('is-armed');
    storeDel('sb.character');
    storeDel('sb.difficulty');
    storeDel('sb.settings');
    try { sessionStorage.removeItem('sb.roomCode'); } catch (e) {}
    state.characterId = (characters()[0] && characters()[0].id) || 'jester';
    state.difficulty = 'normal';
    state.settings = { music: true, sfx: true };
    state.roomCode = (metaShare().codePrefix || 'SPB').toUpperCase() + '-' + randomCode(4);
    sessionSet('sb.roomCode', state.roomCode);
    if (window.SBAudio && typeof SBAudio.setSettings === 'function') {
      try { SBAudio.setSettings({ music: true, sfx: true }); } catch (e) {}
    }
    syncRosterSelection();
    syncAudioUI();
    syncSoundIcon();
    if (currentScreen === 'lobby') renderLobby();
    toast('进度已重置 · 重新挑一位疯子吧', 'ok');
  }

  /* ---------- resize ---------- */
  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      layoutRosterPadding();
      if (currentScreen === 'roster') centerRoster(currentIndex(), false);
      if (openModalName === 'share') sizePoster();
      if (SBGame && currentScreen === 'game' && typeof SBGame.resize === 'function') {
        try { SBGame.resize(); } catch (e) {}
      }
    }, 160);
  }

  /* ---------- audit (dev only) ---------- */
  function runAudit() {
    var required = [
      'game-canvas', 'battle-stage', 'joystick-zone', 'joystick-knob', 'btn-dash', 'dash-cooldown',
      'screen-loading', 'screen-home', 'screen-roster', 'screen-lobby', 'screen-game', 'screen-result',
      'modal-levelup', 'modal-pause', 'modal-share', 'modal-settings',
      'hud-time', 'hud-wave', 'hud-kills', 'hud-hp-fill', 'hud-level', 'hud-xp-fill', 'hud-party', 'hud-spells', 'boss-bar'
    ];
    var missing = required.filter(function (id) { return !document.getElementById(id); });
    var active = $('.screen.is-active');
    var overflowX = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    var gameScroll = false;
    var gameEl = $('#screen-game');
    if (gameEl && gameEl.classList.contains('is-active')) {
      gameScroll = gameEl.scrollHeight > gameEl.clientHeight + 1;
    }
    var broken = [];
    $$('img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && img.style.display !== 'none') broken.push(img.getAttribute('src'));
    });
    var overlaps = [];
    if (currentScreen === 'game') {
      var sels = ['.hud-top', '.hud-vitals', '.hud-party', '#joystick-zone', '#btn-dash', '.spell-bar', '#tutorial-hint'];
      var nodes = sels.map(function (s) { return $(s); }).filter(function (n) {
        return n && n.offsetParent !== null && !n.classList.contains('is-hidden');
      });
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i].getBoundingClientRect();
          var b = nodes[j].getBoundingClientRect();
          var ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          var oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (ox > 2 && oy > 2) {
            overlaps.push((nodes[i].id || nodes[i].className.split(' ')[0]) + '×' + (nodes[j].id || nodes[j].className.split(' ')[0]));
          }
        }
      }
    }
    var audit = {
      screen: currentScreen,
      activeScreen: active ? active.id : null,
      missing: missing,
      overflowX: overflowX,
      gameScroll: gameScroll,
      brokenCount: broken.length,
      broken: broken.slice(0, 6),
      overlaps: overlaps,
      errors: (window.__uiErrors || []).slice(0, 5),
      size: [window.innerWidth, window.innerHeight]
    };
    document.title = 'SB_AUDIT ' + JSON.stringify(audit);
    try { console.log('SB_AUDIT', audit); } catch (e) {}
  }

  /* ---------- go ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
