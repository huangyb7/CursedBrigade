/* ============================================================
   咒语旅团 THE SPELL BRIGADE — 战斗引擎
   js/game.js · engine-smith
   传统脚本 / 无依赖 / file:// 可运行
   对外：window.SpellBrigadeGame
   ============================================================ */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var INK = '#1b1220';
  var CREAM = '#fff4d8';

  var TIME_LIMIT = 150;
  var BOSS_TIME = 120;
  var BOSS_NAME = '梦魇领主';
  var WORLD = { w: 1560, h: 2460 };

  var MAX_ENEMIES = 140;
  var MAX_PARTICLES = 450;
  var MAX_PROJ = 300;
  var MAX_GEMS = 180;
  var MAX_NUMBERS = 70;
  var MAX_ARCS = 48;
  var MAX_POOLS = 26;

  var ELEM = {
    fire: {
      color: '#ff6b3d', glow: '#ffd166', hot: '#fff0c0', dark: '#5c1f1f',
      name: '烈焰', en: 'EMBER', shoot: 'shoot-fire', icon: 'assets/element-fire.svg'
    },
    ice: {
      color: '#74e4ff', glow: '#d7fbff', hot: '#f2ffff', dark: '#123a55',
      name: '霜月', en: 'FROST', shoot: 'shoot-ice', icon: 'assets/element-ice.svg'
    },
    lightning: {
      color: '#ffe14d', glow: '#fff9c9', hot: '#ffffff', dark: '#5a4410',
      name: '惊雷', en: 'THUNDER', shoot: 'shoot-lightning', icon: 'assets/element-lightning.svg'
    },
    acid: {
      color: '#abff5c', glow: '#ecffd2', hot: '#f6ffe8', dark: '#294d18',
      name: '腐雾', en: 'ACID', shoot: 'shoot-acid', icon: 'assets/element-acid.svg'
    }
  };
  var ELEMENT_KEYS = ['fire', 'ice', 'lightning', 'acid'];

  var RARITY_LABEL = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  var RARITY_WEIGHT = { common: 1.15, rare: 0.85, epic: 0.5, legendary: 0.22 };
  var RARITY_COLOR = { common: '#cfd8e3', rare: '#74e4ff', epic: '#c9a0ff', legendary: '#ffd166' };

  /* ---------- weapons ---------- */
  var WEAPON_INFO = {
    orb: { name: '奥术阔剑', en: 'ARCANE BLADES', element: 'lightning', icon: 'assets/spell-blade.svg' },
    necro: { name: '死灵旋风', en: 'NECRO WHIRL', element: 'acid', icon: 'assets/spell-necro.svg' },
    chain: { name: '连锁雷击', en: 'CHAIN BARRAGE', element: 'lightning', icon: 'assets/spell-lightning.svg' },
    nova: { name: '霜月新星', en: 'FROST NOVA', element: 'ice', icon: 'assets/spell-frost.svg' },
    acid: { name: '腐沼领域', en: 'ACID FIELD', element: 'acid', icon: 'assets/spell-acid.svg' },
    star: { name: '陨星坠落', en: 'STARFALL', element: 'fire', icon: 'assets/spell-fireball.svg' }
  };

  /* ---------- upgrade pool (>=14 meaningful upgrades) ---------- */
  var UPGRADES = [
    {
      id: 'orb-blade', category: 'weapon', weapon: 'orb', rarity: 'epic',
      name: '奥术阔剑', en: 'ARCANE BLADES', element: 'lightning',
      icon: 'assets/spell-blade.svg', minLevel: 2, maxLevel: 4, weight: 1.25,
      descFn: function (lv) {
        if (!lv) return '召唤 2 把环绕身侧的奥术阔剑，触碰敌人造成 12 点伤害。';
        return '阔剑数量 +1，接触伤害 ' + (12 + 6 * lv) + ' → ' + (12 + 6 * (lv + 1)) + '。';
      }
    },
    {
      id: 'necro-whirl', category: 'weapon', weapon: 'necro', rarity: 'rare',
      name: '死灵旋风', en: 'NECRO WHIRL', element: 'acid',
      icon: 'assets/spell-necro.svg', minLevel: 2, maxLevel: 4, weight: 1.1,
      descFn: function (lv) {
        if (!lv) return '幽绿魂环持续席卷四周，每 0.45 秒腐蚀 78 范围内的敌人。';
        return '魂环范围与腐蚀伤害提升至 ' + (8 + 3 * (lv + 1)) + ' 点/跳。';
      }
    },
    {
      id: 'chain-barrage', category: 'weapon', weapon: 'chain', rarity: 'rare',
      name: '连锁雷击', en: 'CHAIN BARRAGE', element: 'lightning',
      icon: 'assets/spell-lightning.svg', minLevel: 3, maxLevel: 4, weight: 1.1,
      descFn: function (lv) {
        if (!lv) return '每隔 1.7 秒降下连锁闪电，在 3 名敌人之间弹射。';
        return '连锁目标 +1，每跳伤害提升至 ' + (20 + 8 * (lv + 1)) + ' 点。';
      }
    },
    {
      id: 'frost-nova', category: 'weapon', weapon: 'nova', rarity: 'rare',
      name: '霜月新星', en: 'FROST NOVA', element: 'ice',
      icon: 'assets/spell-frost.svg', minLevel: 3, maxLevel: 4, weight: 1.05,
      descFn: function (lv) {
        if (!lv) return '周期性绽开霜环，伤害并减速 110 范围内的全部敌人。';
        return '霜环半径 +16，伤害提升至 ' + (22 + 10 * (lv + 1)) + ' 点。';
      }
    },
    {
      id: 'acid-field', category: 'weapon', weapon: 'acid', rarity: 'rare',
      name: '腐沼领域', en: 'ACID FIELD', element: 'acid',
      icon: 'assets/spell-acid.svg', minLevel: 3, maxLevel: 4, weight: 1.05,
      descFn: function (lv) {
        if (!lv) return '在敌群脚下催生腐蚀沼池，持续 4 秒灼蚀其中的敌人。';
        return '沼池范围扩大，腐蚀伤害提升至 ' + (7 + 3 * (lv + 1)) + ' 点/跳。';
      }
    },
    {
      id: 'starfall', category: 'weapon', weapon: 'star', rarity: 'legendary',
      name: '陨星坠落', en: 'STARFALL', element: 'fire',
      icon: 'assets/spell-fireball.svg', minLevel: 8, maxLevel: 3, weight: 0.9,
      descFn: function (lv) {
        if (!lv) return '召唤坠落的火星陨石，在敌群中炸开金色火环。';
        return '陨星伤害提升至 ' + (60 + 30 * (lv + 1)) + ' 点，爆炸范围扩大。';
      }
    },
    {
      id: 'multi-shot', category: 'mod', rarity: 'rare',
      name: '分裂咏唱', en: 'SPLIT CAST', element: 'fire',
      icon: 'assets/element-fire.svg', minLevel: 2, maxLevel: 3, weight: 1,
      descFn: function (lv) { return '主法杖每次施法额外射出一枚弹丸（+' + (lv + 1) + '）。'; }
    },
    {
      id: 'pierce', category: 'mod', rarity: 'common',
      name: '穿透符文', en: 'PIERCE RUNE', element: 'ice',
      icon: 'assets/element-ice.svg', minLevel: 1, maxLevel: 3, weight: 1,
      descFn: function (lv) { return '法术弹丸可以额外穿透 ' + (lv + 1) + ' 个敌人。'; }
    },
    {
      id: 'rapid-cast', category: 'mod', rarity: 'common',
      name: '急速咏唱', en: 'RAPID CAST', element: 'lightning',
      icon: 'assets/element-lightning.svg', minLevel: 1, maxLevel: 4, weight: 1.05,
      descFn: function (lv) { return '所有法术冷却缩短 12%（当前共 -' + Math.round((1 - Math.pow(0.88, lv + 1)) * 100) + '%）。'; }
    },
    {
      id: 'wide-area', category: 'mod', rarity: 'common',
      name: '扩张法阵', en: 'WIDE SIGIL', element: 'acid',
      icon: 'assets/element-acid.svg', minLevel: 2, maxLevel: 3, weight: 0.95,
      descFn: function (lv) { return '法术范围与弹丸体积 +18%（共 +' + ((lv + 1) * 18) + '%）。'; }
    },
    {
      id: 'power-surge', category: 'mod', rarity: 'rare',
      name: '狂怒咏唱', en: 'POWER SURGE', element: 'fire',
      icon: 'assets/element-fire.svg', minLevel: 1, maxLevel: 5, weight: 1.1,
      descFn: function (lv) { return '全部伤害 +15%（当前共 +' + ((lv + 1) * 15) + '%）。'; }
    },
    {
      id: 'overcharge', category: 'mod', rarity: 'epic',
      name: '元素过载', en: 'OVERCHARGE', element: 'lightning',
      icon: 'assets/element-lightning.svg', minLevel: 5, maxLevel: 2, weight: 0.8,
      descFn: function (lv) { return '元素效果强度 +25%、伤害 +8%。灼烧、冻结与连锁更加凶猛。'; }
    },
    {
      id: 'vitality', category: 'passive', rarity: 'common',
      name: '生命符文', en: 'VITAL RUNE', element: 'acid',
      icon: 'assets/element-acid.svg', minLevel: 1, maxLevel: 5, weight: 1.05,
      descFn: function (lv) { return '最大生命 +28，并立刻回复 28 点生命。'; }
    },
    {
      id: 'swift-boots', category: 'passive', rarity: 'common',
      name: '疾行靴', en: 'SWIFT BOOTS', element: 'ice',
      icon: 'assets/element-ice.svg', minLevel: 1, maxLevel: 4, weight: 1,
      descFn: function (lv) { return '移动速度 +8%（当前共 +' + ((lv + 1) * 8) + '%）。'; }
    },
    {
      id: 'magnet', category: 'passive', rarity: 'common',
      name: '拾取魔法', en: 'LOOT MAGNET', element: 'lightning',
      icon: 'assets/element-lightning.svg', minLevel: 1, maxLevel: 3, weight: 0.95,
      descFn: function (lv) { return '魔法水晶吸附范围 +30%（当前共 +' + ((lv + 1) * 30) + '%）。'; }
    },
    {
      id: 'moon-shield', category: 'passive', rarity: 'rare',
      name: '月光护盾', en: 'MOON WARD', element: 'ice',
      icon: 'assets/element-ice.svg', minLevel: 3, maxLevel: 3, weight: 0.9,
      descFn: function (lv) { return '获得 1 层月光护盾，可抵挡一次伤害（每 18 秒恢复 1 层）。'; }
    },
    {
      id: 'crit-eye', category: 'passive', rarity: 'rare',
      name: '幸运之眼', en: 'LUCKY EYE', element: 'fire',
      icon: 'assets/element-fire.svg', minLevel: 2, maxLevel: 3, weight: 0.9,
      descFn: function (lv) { return '暴击率 +7%，暴击伤害为 180%。'; }
    },
    {
      id: 'bonfire', category: 'passive', rarity: 'rare',
      name: '篝火余烬', en: 'BONFIRE EMBER', element: 'fire',
      icon: 'assets/element-fire.svg', minLevel: 2, maxLevel: 4, weight: 0.9,
      descFn: function (lv) { return '立刻回复 45% 生命，并每秒回复 0.8 点生命。'; }
    },
    {
      id: 'stone-skin', category: 'passive', rarity: 'rare',
      name: '石肤护符', en: 'STONE SKIN', element: 'acid',
      icon: 'assets/element-acid.svg', minLevel: 3, maxLevel: 3, weight: 0.85,
      descFn: function (lv) { return '受到的伤害 -9%（当前共 -' + ((lv + 1) * 9) + '%）。'; }
    },
    {
      id: 'dash-master', category: 'passive', rarity: 'rare',
      name: '星步精通', en: 'STAR STEP', element: 'lightning',
      icon: 'assets/element-lightning.svg', minLevel: 2, maxLevel: 2, weight: 0.85,
      descFn: function (lv) { return '冲刺冷却 -0.7 秒，冲刺距离更远。'; }
    },
    {
      id: 'spirit-call', category: 'passive', rarity: 'epic',
      name: '灵伴共鸣', en: 'SPIRIT CALL', element: 'acid',
      icon: 'assets/element-acid.svg', minLevel: 5, maxLevel: 2, weight: 0.75,
      descFn: function (lv) { return '3 名 AI 队友伤害 +30%，施法频率 +15%。'; }
    },
    {
      id: 'wisdom', category: 'passive', rarity: 'common',
      name: '智慧星尘', en: 'WISDOM DUST', element: 'ice',
      icon: 'assets/element-ice.svg', minLevel: 1, maxLevel: 3, weight: 0.9,
      descFn: function (lv) { return '获得经验 +18%（当前共 +' + ((lv + 1) * 18) + '%）。'; }
    },
    {
      id: 'team-resolve', category: 'passive', rarity: 'epic',
      name: '旅团韧性', en: 'BRIGADE RESOLVE', element: 'lightning',
      icon: 'assets/element-lightning.svg', minLevel: 6, maxLevel: 2, weight: 0.7,
      descFn: function (lv) { return '队友最大生命 +30、复活时间 -1.5 秒，全队更抗打。'; }
    }
  ];

  /* ---------- tiny utils ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function dist(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); }
  function dist2(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }
  function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
  function damp(cur, target, rate, dt) { return cur + (target - cur) * (1 - Math.exp(-rate * dt)); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
  function easeOutQuad(t) { return 1 - (1 - clamp(t, 0, 1)) * (1 - clamp(t, 0, 1)); }
  function angleDiff(a, b) { var d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    if (!hex || hex.charAt(0) !== '#') return [255, 255, 255];
    var h = hex.length === 4
      ? '#' + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) + hex.charAt(3) + hex.charAt(3)
      : hex;
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  var _rgbaCache = {};
  function rgba(hex, a) {
    var key = hex + '|' + a;
    var v = _rgbaCache[key];
    if (v) return v;
    var c = hexToRgb(hex);
    v = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    _rgbaCache[key] = v;
    return v;
  }

  /* ---------- fallback data (only if js/data.js missing) ---------- */
  var FALLBACK_THEMES = {
    fire: { accent: '#ff7a45', deep: '#35142c', glow: '#ffd166', gradient: ['#ff8a4c', '#ff4d8f'] },
    ice: { accent: '#74e4ff', deep: '#111d44', glow: '#c9f8ff', gradient: ['#4b8dff', '#b49bff'] },
    lightning: { accent: '#ffe14d', deep: '#412612', glow: '#fff6c2', gradient: ['#ffbe2e', '#ff6b3d'] },
    acid: { accent: '#abff5c', deep: '#1d3223', glow: '#e2ffad', gradient: ['#8ee03c', '#8b5cf6'] }
  };
  function makeFallbackData() {
    var names = [
      ['jester', '笑面小丑', 'fire', 'ember-bolt'],
      ['moon', '月蚀祭司', 'ice', 'frost-shard'],
      ['sun', '日冕哨兵', 'lightning', 'storm-barrage'],
      ['witch', '沼泽女巫', 'acid', 'acid-splash']
    ];
    var chars = [];
    for (var i = 0; i < names.length; i++) {
      var el = names[i][2];
      chars.push({
        id: names[i][0], name: names[i][1], alias: '', en: names[i][0].toUpperCase(), element: el,
        role: '', tagline: '', blurb: '', quote: '',
        portrait: 'assets/wizard-' + names[i][0] + '.svg', startSpell: names[i][3],
        theme: FALLBACK_THEMES[el],
        stats: { power: 3, speed: 3, arcane: 3, vitality: 3 }
      });
    }
    return {
      meta: {
        title: '咒语旅团', en: 'THE SPELL BRIGADE', stageName: '遗忘回廊', timeLimit: TIME_LIMIT,
        waves: [
          { at: 0, name: '第一夜', sub: '雾里有东西在动。' },
          { at: 30, name: '第二夜', sub: '它们开始学会绕后了。' },
          { at: 60, name: '第三夜', sub: '月亮被谁咬掉了一口。' },
          { at: 90, name: '第四夜', sub: '地面在呼吸。' },
          { at: 120, name: '最后之夜', sub: '梦魇领主醒了。' }
        ]
      },
      characters: chars,
      elements: {},
      spells: [],
      difficulties: [
        { id: 'easy', name: '学徒之夜', enemyScale: 0.82, enemyDamage: 0.75, spawnScale: 0.85 },
        { id: 'normal', name: '月蚀之夜', enemyScale: 1, enemyDamage: 1, spawnScale: 1 },
        { id: 'nightmare', name: '梦魇之潮', enemyScale: 1.32, enemyDamage: 1.25, spawnScale: 1.18 }
      ],
      getCharacter: function (id) { for (var j = 0; j < chars.length; j++) if (chars[j].id === id) return chars[j]; return chars[0]; },
      getElement: function (id) { return FALLBACK_THEMES[id] ? { color: FALLBACK_THEMES[id].accent } : {}; },
      getSpell: function () { return {}; }
    };
  }

  /* ============================================================
     constructor
     ============================================================ */
  function SpellBrigadeGame(opts) {
    opts = opts || {};
    this.opts = opts;
    this.canvas = opts.canvas || (typeof document !== 'undefined' ? document.getElementById('game-canvas') : null);
    this.ctx = this.canvas && this.canvas.getContext ? this.canvas.getContext('2d') : null;

    this.data = (typeof window !== 'undefined' && window.SB_DATA) ? window.SB_DATA : makeFallbackData();

    this.cb = {
      onHud: typeof opts.onHud === 'function' ? opts.onHud : null,
      onLevelUp: typeof opts.onLevelUp === 'function' ? opts.onLevelUp : null,
      onGameOver: typeof opts.onGameOver === 'function' ? opts.onGameOver : null,
      onVictory: typeof opts.onVictory === 'function' ? opts.onVictory : null,
      onEvent: typeof opts.onEvent === 'function' ? opts.onEvent : null
    };

    this.state = 'idle'; // idle | running | paused | levelup | ended | destroyed
    this.playerId = opts.playerId || 'jester';
    var allyIdsOpt = Array.isArray(opts.allyIds) ? opts.allyIds.slice(0, 3) : [];
    this.allyIds = allyIdsOpt;
    this.difficultyId = opts.difficulty || 'normal';
    this.diff = this._findDifficulty(this.difficultyId);

    this.player = null;
    this.allies = [];
    this.boss = null;
    this.bossSpawned = false;
    this.bossKilled = false;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.gems = [];
    this.numbers = [];
    this.arcs = [];
    this.pools = [];
    this.meteors = [];

    this.time = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.waveIndex = 0;
    this.wave = 1;
    this.waveName = '';
    this.levelBonus = 0;
    this.bossBonus = 0;
    this.shieldRecharge = 0;
    this.gemCount = 0;
    this.uiTime = 0;

    this.cam = { x: WORLD.w / 2, y: WORLD.h / 2 };
    this.camZoom = 1;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    this.dashCd = 0;
    this.dashMax = 3;
    this.dashQueued = false;
    this.dashT = 0;
    this.dashDirX = 0;
    this.dashDirY = 1;

    this.spawnTimer = 1.2;
    this.levelUpsQueued = 0;
    this.pendingChoices = null;
    this.upgradeLevels = {};
    this.screenFlash = 0;

    this.vw = 0;
    this.vh = 0;
    this.dpr = 1;
    this.scale = 1;
    this._lastTs = 0;
    this._hudLast = 0;
    this._hudDirty = true;
    this._raf = null;
    this._bound = [];
    this._resizeObs = null;
    this._destroyed = false;
    this._startedAt = 0;

    this.keys = { up: false, down: false, left: false, right: false };
    this.joy = { active: false, x: 0, y: 0, id: null };
    this.moveX = 0;
    this.moveY = 0;

    this.dom = { joinZone: null, knob: null, dashBtn: null };

    this.sprites = this._buildSprites();
    this.ground = this._buildGround();

    this._hudAcc = 0;
  }

  SpellBrigadeGame.prototype._findDifficulty = function (id) {
    var list = (this.data && this.data.difficulties) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return { id: 'normal', name: '月蚀之夜', enemyScale: 1, enemyDamage: 1, spawnScale: 1 };
  };

  SpellBrigadeGame.prototype._character = function (id) {
    var list = (this.data && this.data.characters) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0] || null;
  };

  SpellBrigadeGame.prototype._theme = function (ch) {
    if (ch && ch.theme && ch.theme.gradient && ch.theme.gradient.length > 1) return ch.theme;
    return FALLBACK_THEMES[(ch && ch.element) || 'fire'] || FALLBACK_THEMES.fire;
  };
  /* ============================================================
     pre-rendered sprites & painted ground
     ============================================================ */
  function makeRadialSprite(size, stops) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (var i = 0; i < stops.length; i++) grd.addColorStop(stops[i][0], stops[i][1]);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    return c;
  }

  SpellBrigadeGame.prototype._buildSprites = function () {
    var sprites = { glow: {}, shadow: null, mist: null, white: null, star: null, soft: null };
    var self = this;
    ELEMENT_KEYS.forEach(function (el) {
      var e = ELEM[el];
      sprites.glow[el] = makeRadialSprite(128, [
        [0, rgba(e.hot, 0.95)],
        [0.22, rgba(e.glow, 0.62)],
        [0.5, rgba(e.color, 0.26)],
        [1, rgba(e.color, 0)]
      ]);
    });
    sprites.white = makeRadialSprite(128, [
      [0, 'rgba(255,255,255,0.95)'],
      [0.3, 'rgba(255,255,255,0.45)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    sprites.star = makeRadialSprite(64, [
      [0, 'rgba(255,246,200,0.95)'],
      [0.35, 'rgba(255,209,102,0.4)'],
      [1, 'rgba(255,209,102,0)']
    ]);
    sprites.soft = makeRadialSprite(256, [
      [0, 'rgba(220,235,220,0.30)'],
      [0.45, 'rgba(190,215,200,0.12)'],
      [1, 'rgba(170,200,190,0)']
    ]);
    sprites.mist = makeRadialSprite(256, [
      [0, 'rgba(196,214,214,0.22)'],
      [0.5, 'rgba(170,196,200,0.10)'],
      [1, 'rgba(150,180,190,0)']
    ]);
    // soft elliptical shadow
    var sh = document.createElement('canvas');
    sh.width = 128; sh.height = 64;
    var sg = sh.getContext('2d');
    sg.save();
    sg.translate(64, 32);
    sg.scale(1, 0.5);
    var sgr = sg.createRadialGradient(0, 0, 0, 0, 0, 64);
    sgr.addColorStop(0, 'rgba(8,10,8,0.46)');
    sgr.addColorStop(0.55, 'rgba(8,10,8,0.26)');
    sgr.addColorStop(1, 'rgba(8,10,8,0)');
    sg.fillStyle = sgr;
    sg.beginPath(); sg.arc(0, 0, 64, 0, TAU); sg.fill();
    sg.restore();
    sprites.shadow = sh;
    return sprites;
  };

  function polylineDist(px, py, pts) {
    var best = 1e9;
    for (var i = 0; i < pts.length - 1; i++) {
      var ax = pts[i].x, ay = pts[i].y, bx = pts[i + 1].x, by = pts[i + 1].y;
      var dx = bx - ax, dy = by - ay;
      var len2 = dx * dx + dy * dy || 1;
      var t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
      var qx = ax + dx * t, qy = ay + dy * t;
      var d = (px - qx) * (px - qx) + (py - qy) * (py - qy);
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  /* ============================================================
     pre-rendered painted ground
     ============================================================ */
  SpellBrigadeGame.prototype._buildGround = function () {
    var W = WORLD.w, H = WORLD.h;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    var rnd = mulberry32(20261112);
    var cx = W / 2, cy = H / 2;
    var PLAZA = 172;

    // 1. base earth
    var bg = g.createLinearGradient(0, H * 0.1, W * 0.35, H);
    bg.addColorStop(0, '#22382a');
    bg.addColorStop(0.3, '#2b4a34');
    bg.addColorStop(0.62, '#264230');
    bg.addColorStop(1, '#172a22');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // 2. big painterly colour patches
    var patchColors = ['#35583c', '#1f3a2b', '#3f6444', '#2b4a35', '#1b3026', '#446b48', '#4c5c33', '#315a49'];
    for (var i = 0; i < 170; i++) {
      var px = rnd() * W, py = rnd() * H;
      var pr = 50 + rnd() * 330;
      g.globalAlpha = 0.035 + rnd() * 0.08;
      g.fillStyle = patchColors[Math.floor(rnd() * patchColors.length)];
      g.beginPath();
      g.ellipse(px, py, pr, pr * (0.4 + rnd() * 0.65), rnd() * TAU, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;

    // 3. moon & lantern light
    var warm = g.createRadialGradient(cx, cy, 30, cx, cy, 640);
    warm.addColorStop(0, 'rgba(255,214,140,0.22)');
    warm.addColorStop(0.42, 'rgba(210,205,140,0.09)');
    warm.addColorStop(1, 'rgba(160,190,140,0)');
    g.fillStyle = warm;
    g.fillRect(0, 0, W, H);
    var moon = g.createRadialGradient(W * 0.18, H * 0.12, 40, W * 0.18, H * 0.12, 820);
    moon.addColorStop(0, 'rgba(150,205,255,0.14)');
    moon.addColorStop(1, 'rgba(110,160,230,0)');
    g.fillStyle = moon;
    g.fillRect(0, 0, W, H);

    // plum shadow pools & warm lantern light
    for (var pl = 0; pl < 24; pl++) {
      var plx = rnd() * W, ply = rnd() * H;
      g.globalAlpha = 0.045 + rnd() * 0.06;
      g.fillStyle = rnd() < 0.5 ? '#3a1f4f' : '#1d3a4f';
      g.beginPath();
      g.ellipse(plx, ply, 90 + rnd() * 260, 50 + rnd() * 170, rnd() * TAU, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
    var torchSpots = [[cx - 300, cy - 160], [cx + 320, cy - 120], [cx - 190, cy + 300], [cx + 260, cy + 280], [cx, cy - 350], [cx - 360, cy + 60], [cx + 360, cy + 60]];
    for (var ts = 0; ts < torchSpots.length; ts++) {
      var tgr = g.createRadialGradient(torchSpots[ts][0], torchSpots[ts][1], 6, torchSpots[ts][0], torchSpots[ts][1], 150);
      tgr.addColorStop(0, 'rgba(255,190,110,0.18)');
      tgr.addColorStop(0.5, 'rgba(255,160,80,0.07)');
      tgr.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = tgr;
      g.beginPath();
      g.arc(torchSpots[ts][0], torchSpots[ts][1], 150, 0, TAU);
      g.fill();
    }

    // 4. winding stone walks
    var paths = [
      [{ x: 780, y: -50 }, { x: 756, y: 190 }, { x: 694, y: 420 }, { x: 660, y: 640 }, { x: 762, y: 890 }, { x: 780, y: 1052 }],
      [{ x: 780, y: 1408 }, { x: 850, y: 1620 }, { x: 930, y: 1860 }, { x: 900, y: 2080 }, { x: 966, y: 2310 }, { x: 940, y: 2520 }],
      [{ x: 608, y: 1230 }, { x: 480, y: 1280 }, { x: 350, y: 1370 }, { x: 230, y: 1440 }, { x: 60, y: 1470 }]
    ];
    function strokePath(g2, pts, width, color) {
      g2.beginPath();
      g2.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) g2.lineTo(pts[k].x, pts[k].y);
      g2.lineCap = 'round';
      g2.lineJoin = 'round';
      g2.strokeStyle = color;
      g2.lineWidth = width;
      g2.stroke();
    }
    function drawFlagstones(pts, width, rnd2) {
      for (var s = 0; s < pts.length - 1; s++) {
        var a = pts[s], b = pts[s + 1];
        var dx = b.x - a.x, dy = b.y - a.y;
        var segLen = Math.sqrt(dx * dx + dy * dy) || 1;
        var ang = Math.atan2(dy, dx);
        for (var t = 20; t < segLen; t += 42) {
          var fx = a.x + (dx / segLen) * t + (rnd2() - 0.5) * 12;
          var fy = a.y + (dy / segLen) * t + (rnd2() - 0.5) * 12;
          if (dist(fx, fy, cx, cy) < PLAZA + 22) continue;
          g.save();
          g.translate(fx, fy);
          g.rotate(ang + (rnd2() - 0.5) * 0.35);
          var w = 32 + rnd2() * 20, h = 22 + rnd2() * 12;
          var shade = Math.floor(58 + rnd2() * 24);
          g.fillStyle = 'rgb(' + (shade - 6) + ',' + shade + ',' + (shade - 10) + ')';
          g.strokeStyle = 'rgba(14,18,14,0.55)';
          g.lineWidth = 2;
          g.beginPath();
          g.rect(-w / 2, -h / 2, w, h);
          g.fill(); g.stroke();
          g.fillStyle = 'rgba(200,205,170,0.10)';
          g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 3.5);
          g.fillStyle = 'rgba(40,70,45,0.16)';
          if (rnd2() < 0.5) g.fillRect(-w * 0.2, -h * 0.35, w * 0.3, h * 0.25);
          g.restore();
        }
      }
    }
    for (var ps = 0; ps < paths.length; ps++) {
      strokePath(g, paths[ps], 96, 'rgba(16,22,17,0.55)');
      strokePath(g, paths[ps], 82, '#3b4238');
      strokePath(g, paths[ps], 56, 'rgba(130,138,112,0.10)');
      drawFlagstones(paths[ps], 82, rnd);
    }

    // 5. cloister plaza
    g.beginPath(); g.arc(cx, cy, PLAZA + 18, 0, TAU);
    g.fillStyle = 'rgba(10,16,12,0.5)';
    g.fill();
    // flagstone rim
    var ringN = 26;
    for (var rb = 0; rb < ringN; rb++) {
      var a0 = (rb / ringN) * TAU + 0.012;
      var a1 = ((rb + 1) / ringN) * TAU - 0.012;
      var rr0 = PLAZA - 24, rr1 = PLAZA;
      g.beginPath();
      g.arc(cx, cy, rr1, a0, a1);
      g.arc(cx, cy, rr0, a1, a0, true);
      g.closePath();
      var gv = Math.floor(66 + rnd() * 26);
      g.fillStyle = 'rgb(' + (gv - 4) + ',' + gv + ',' + (gv - 10) + ')';
      g.strokeStyle = 'rgba(16,20,16,0.7)';
      g.lineWidth = 2.4;
      g.fill(); g.stroke();
    }
    // paving
    g.beginPath(); g.arc(cx, cy, PLAZA - 24, 0, TAU);
    g.fillStyle = '#454b3f';
    g.fill();
    g.save();
    g.beginPath(); g.arc(cx, cy, PLAZA - 24, 0, TAU); g.clip();
    for (var ring = 0; ring < 3; ring++) {
      var rad = PLAZA - 52 - ring * 40;
      g.beginPath(); g.arc(cx, cy, rad, 0, TAU);
      g.strokeStyle = 'rgba(22,26,20,0.5)';
      g.lineWidth = 3;
      g.stroke();
      var joints = 20 - ring * 4;
      for (var j = 0; j < joints; j++) {
        var ja = (j / joints) * TAU + ring * 0.26;
        g.beginPath();
        g.moveTo(cx + Math.cos(ja) * (rad - 38), cy + Math.sin(ja) * (rad - 38));
        g.lineTo(cx + Math.cos(ja) * rad, cy + Math.sin(ja) * rad);
        g.strokeStyle = 'rgba(20,24,19,0.42)';
        g.lineWidth = 2.6;
        g.stroke();
      }
    }
    // stone mottling
    for (var mot = 0; mot < 90; mot++) {
      var ma = rnd() * TAU, mr = rnd() * (PLAZA - 30);
      var mx0 = cx + Math.cos(ma) * mr, my0 = cy + Math.sin(ma) * mr;
      g.globalAlpha = 0.05 + rnd() * 0.08;
      g.fillStyle = rnd() < 0.5 ? '#8b927c' : '#1e2820';
      g.beginPath();
      g.ellipse(mx0, my0, 8 + rnd() * 26, 5 + rnd() * 14, rnd() * TAU, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
    // moss creeping over stones
    for (var mo = 0; mo < 40; mo++) {
      var moa = rnd() * TAU;
      var mor = PLAZA - 18 - rnd() * 60;
      g.globalAlpha = 0.09 + rnd() * 0.12;
      g.fillStyle = rnd() < 0.6 ? '#4d7a4a' : '#2f5a3d';
      g.beginPath();
      g.ellipse(cx + Math.cos(moa) * mor, cy + Math.sin(moa) * mor, 8 + rnd() * 22, 4 + rnd() * 9, moa, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
    // center medallion
    g.beginPath(); g.arc(cx, cy, 52, 0, TAU);
    g.fillStyle = '#565c4b';
    g.fill();
    g.strokeStyle = 'rgba(28,32,24,0.8)';
    g.lineWidth = 3;
    g.stroke();
    g.beginPath(); g.arc(cx, cy, 40, 0, TAU);
    g.strokeStyle = 'rgba(255,209,102,0.22)';
    g.lineWidth = 2;
    g.stroke();

    // sigil
    g.strokeStyle = 'rgba(255,209,102,0.30)';
    g.lineWidth = 2;
    g.setLineDash([9, 12]);
    g.beginPath(); g.arc(cx, cy, 146, 0, TAU); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = 'rgba(116,228,255,0.22)';
    g.beginPath(); g.arc(cx, cy, 120, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,209,102,0.26)';
    g.lineWidth = 2.2;
    for (var st = 0; st < 2; st++) {
      g.save();
      g.translate(cx, cy);
      g.rotate(st * Math.PI / 4);
      g.beginPath();
      for (var sp = 0; sp < 8; sp++) {
        var sr = sp % 2 === 0 ? 100 : 50;
        var sa = (sp / 8) * TAU;
        if (sp === 0) g.moveTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
        else g.lineTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
      }
      g.closePath();
      g.stroke();
      g.restore();
    }
    // runes around sigil
    for (var ru = 0; ru < 16; ru++) {
      var ra = (ru / 16) * TAU + 0.1;
      var rx = cx + Math.cos(ra) * 158, ry = cy + Math.sin(ra) * 158;
      g.save();
      g.translate(rx, ry);
      g.rotate(ra + Math.PI / 2);
      g.strokeStyle = 'rgba(255,209,102,' + (0.22 + rnd() * 0.2) + ')';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-4, -6); g.lineTo(3, -2); g.lineTo(-2, 3); g.lineTo(4, 7);
      if (rnd() < 0.5) { g.moveTo(-5, 3); g.lineTo(5, -5); }
      g.stroke();
      g.restore();
    }
    // faint crescent in the middle
    g.strokeStyle = 'rgba(255,209,102,0.26)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, cy, 34, 0.55, TAU - 0.55);
    g.stroke();
    g.fillStyle = 'rgba(255,209,102,0.08)';
    g.beginPath(); g.arc(cx - 6, cy - 2, 22, 0, TAU); g.fill();
    // glowing cracks
    for (var cr = 0; cr < 12; cr++) {
      var ca = rnd() * TAU;
      var cl = 20 + rnd() * 70;
      g.strokeStyle = 'rgba(255,209,102,' + (0.06 + rnd() * 0.08) + ')';
      g.lineWidth = 1.4 + rnd() * 1.4;
      g.beginPath();
      g.moveTo(cx + Math.cos(ca) * 54, cy + Math.sin(ca) * 54);
      g.lineTo(cx + Math.cos(ca + 0.08) * (54 + cl * 0.6), cy + Math.sin(ca + 0.08) * (54 + cl * 0.6));
      g.lineTo(cx + Math.cos(ca - 0.04) * (54 + cl), cy + Math.sin(ca - 0.04) * (54 + cl));
      g.stroke();
    }

    // 6. grass (skip stone)
    var grassColors = ['#3a6b48', '#2d5a3c', '#4a7d50', '#5c8a55', '#244a33', '#467346', '#6b8f4e'];
    function nearPath(x, y) {
      var best = 1e9;
      for (var pn = 0; pn < paths.length; pn++) {
        var pd = polylineDist(x, y, paths[pn]);
        if (pd < best) best = pd;
      }
      return best;
    }
    for (var gt = 0; gt < 4800; gt++) {
      var gx = rnd() * W, gy = rnd() * H;
      if (dist(gx, gy, cx, cy) < PLAZA + 26) continue;
      if (nearPath(gx, gy) < 52) continue;
      g.strokeStyle = grassColors[Math.floor(rnd() * grassColors.length)];
      g.lineWidth = 1.3 + rnd() * 1.6;
      g.beginPath();
      var blades = 2 + Math.floor(rnd() * 3);
      for (var bl = 0; bl < blades; bl++) {
        var ba = (rnd() - 0.5) * 1.6;
        var bh = 4 + rnd() * 10;
        g.moveTo(gx + (rnd() - 0.5) * 6, gy);
        g.quadraticCurveTo(gx + ba * 4, gy - bh * 0.6, gx + ba * 8, gy - bh);
      }
      g.stroke();
    }
    // clover & flower specks
    for (var fl = 0; fl < 150; fl++) {
      var fx2 = rnd() * W, fy2 = rnd() * H;
      if (dist(fx2, fy2, cx, cy) < PLAZA + 20) continue;
      var fcol = rnd() < 0.4 ? 'rgba(255,209,102,0.85)' : rnd() < 0.55 ? 'rgba(116,228,255,0.8)' : 'rgba(255,155,190,0.6)';
      g.fillStyle = fcol;
      g.beginPath(); g.arc(fx2, fy2, 1.3 + rnd() * 1.6, 0, TAU); g.fill();
    }
    // mossy scratch patches in grass
    for (var mp = 0; mp < 90; mp++) {
      var mpx = rnd() * W, mpy = rnd() * H;
      if (dist(mpx, mpy, cx, cy) < PLAZA + 30) continue;
      g.globalAlpha = 0.04 + rnd() * 0.07;
      g.strokeStyle = rnd() < 0.5 ? '#86a35f' : '#1c3327';
      g.lineWidth = 1 + rnd() * 3;
      g.beginPath();
      g.moveTo(mpx, mpy);
      g.quadraticCurveTo(mpx + (rnd() - 0.5) * 40, mpy + (rnd() - 0.5) * 30, mpx + (rnd() - 0.5) * 70, mpy + (rnd() - 0.5) * 50);
      g.stroke();
    }
    g.globalAlpha = 1;
    // small pebbles
    for (var pb = 0; pb < 90; pb++) {
      var pbx = rnd() * W, pby = rnd() * H;
      if (dist(pbx, pby, cx, cy) < PLAZA + 10) continue;
      g.globalAlpha = 0.5 + rnd() * 0.3;
      g.fillStyle = rnd() < 0.5 ? '#5c6152' : '#42483c';
      g.beginPath();
      g.ellipse(pbx, pby, 2 + rnd() * 5, 1.5 + rnd() * 3.5, rnd() * TAU, 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;

    // helper: stone block
    function stoneBlock(x, y, w, h, rot, base, rnd2) {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.fillStyle = 'rgb(' + (base - 8) + ',' + base + ',' + (base - 14) + ')';
      g.strokeStyle = 'rgba(14,18,14,0.8)';
      g.lineWidth = 2.6;
      g.beginPath();
      g.rect(-w / 2, -h / 2, w, h);
      g.fill(); g.stroke();
      g.fillStyle = 'rgba(200,205,170,0.12)';
      g.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, Math.max(2, h * 0.16));
      g.fillStyle = 'rgba(18,28,20,0.16)';
      g.fillRect(-w / 2 + 2, h / 2 - h * 0.22, w - 4, h * 0.18);
      if (rnd2() < 0.45) {
        g.fillStyle = 'rgba(70,124,78,0.4)';
        g.beginPath();
        g.arc(-w * 0.28, -h * 0.24, 2.5 + rnd2() * 3.5, 0, TAU);
        g.fill();
      }
      g.restore();
    }
    // fallen leaf drifts
    for (var lf = 0; lf < 26; lf++) {
      var lfa = rnd() * TAU, lfr = PLAZA + 40 + rnd() * 480;
      var lx = cx + Math.cos(lfa) * lfr, ly = cy + Math.sin(lfa) * lfr;
      g.globalAlpha = 0.5;
      for (var lc = 0; lc < 5; lc++) {
        g.fillStyle = rnd() < 0.5 ? '#8a6a32' : '#6b4a2a';
        g.beginPath();
        g.ellipse(lx + (rnd() - 0.5) * 34, ly + (rnd() - 0.5) * 24, 3 + rnd() * 3, 2 + rnd() * 2, rnd() * TAU, 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;

    // ruined walls near the edges
    var ruins = [
      { x: 180, y: 430, rot: 0.12 }, { x: 1380, y: 560, rot: -0.18 },
      { x: 205, y: 1180, rot: 0.34 }, { x: 1360, y: 1300, rot: -0.12 },
      { x: 300, y: 2020, rot: 0.16 }, { x: 1300, y: 2090, rot: -0.26 },
      { x: 760, y: 140, rot: 0.04 }, { x: 850, y: 2340, rot: -0.06 },
      { x: 1220, y: 240, rot: -0.5 }, { x: 380, y: 2330, rot: 0.5 },
      { x: 340, y: 760, rot: 0.9 }, { x: 1250, y: 1760, rot: -0.9 }
    ];
    for (var ri = 0; ri < ruins.length; ri++) {
      var ru2 = ruins[ri];
      var blocksN = 3 + Math.floor(rnd() * 4);
      for (var bk = 0; bk < blocksN; bk++) {
        if (rnd() < 0.16) continue;
        var bxx = ru2.x + Math.cos(ru2.rot) * (bk * 50) - Math.sin(ru2.rot) * (rnd() - 0.5) * 14;
        var byy = ru2.y + Math.sin(ru2.rot) * (bk * 50) + Math.cos(ru2.rot) * (rnd() - 0.5) * 14;
        stoneBlock(bxx, byy, 42 + rnd() * 16, 34 + rnd() * 14, ru2.rot + (rnd() - 0.5) * 0.14, 78 + rnd() * 28, rnd);
      }
      if (rnd() < 0.75) {
        var colX = ru2.x + Math.cos(ru2.rot + 1.7) * 66;
        var colY = ru2.y + Math.sin(ru2.rot + 1.7) * 66;
        g.save();
        g.translate(colX, colY);
        g.rotate(ru2.rot + (rnd() - 0.5) * 0.5);
        g.fillStyle = '#77796a';
        g.strokeStyle = 'rgba(14,18,14,0.8)';
        g.lineWidth = 2.6;
        g.beginPath();
        g.rect(-13, -44, 26, 88);
        g.fill(); g.stroke();
        g.fillStyle = 'rgba(210,210,175,0.14)';
        g.fillRect(-13, -44, 8, 88);
        g.fillStyle = 'rgba(60,110,68,0.35)';
        g.beginPath(); g.arc(-4, 34, 6, 0, TAU); g.fill();
        g.restore();
      }
    }
    // near-spawn landmark gravestones & columns (visible from the start)
    var nearStones = [
      { x: cx - 288, y: cy - 118, s: 26, r: -0.18 },
      { x: cx + 300, y: cy + 96, s: 23, r: 0.22 },
      { x: cx + 246, y: cy - 216, s: 19, r: -0.4 },
      { x: cx - 236, y: cy + 244, s: 21, r: 0.34 },
      { x: cx + 90, y: cy + 306, s: 17, r: 0.1 },
      { x: cx - 330, y: cy + 138, s: 15, r: -0.28 }
    ];
    function drawGrave(x, y, s, rot, rnd2) {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.fillStyle = 'rgba(8,12,9,0.4)';
      g.beginPath(); g.ellipse(4, s * 0.52, s * 1.2, s * 0.42, 0, 0, TAU); g.fill();
      g.fillStyle = rnd2() < 0.5 ? '#5a5d52' : '#4b4f45';
      g.strokeStyle = 'rgba(12,16,13,0.9)';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-s * 0.58, s * 0.55);
      g.lineTo(-s * 0.58, -s * 0.1);
      g.quadraticCurveTo(-s * 0.58, -s * 0.84, 0, -s * 0.84);
      g.quadraticCurveTo(s * 0.58, -s * 0.84, s * 0.58, -s * 0.1);
      g.lineTo(s * 0.58, s * 0.55);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = 'rgba(210,210,175,0.13)';
      g.fillRect(-s * 0.42, -s * 0.62, s * 0.2, s);
      g.strokeStyle = 'rgba(22,28,22,0.55)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-s * 0.18, -s * 0.38); g.lineTo(s * 0.16, -s * 0.04);
      g.moveTo(s * 0.1, -s * 0.42); g.lineTo(-s * 0.14, 0.1);
      g.stroke();
      g.fillStyle = 'rgba(70,124,78,0.45)';
      g.beginPath(); g.arc(s * 0.32, s * 0.4, 2.5 + rnd2() * 3, 0, TAU); g.fill();
      g.restore();
    }
    for (var ns = 0; ns < nearStones.length; ns++) {
      var stn = nearStones[ns];
      drawGrave(stn.x, stn.y, stn.s, stn.r, rnd);
    }
    // scattered graveyard further out
    for (var gs = 0; gs < 30; gs++) {
      var ga = rnd() * TAU;
      var gr = 400 + rnd() * 520;
      var gx3 = cx + Math.cos(ga) * gr;
      var gy3 = cy + Math.sin(ga) * gr * 0.94;
      if (gx3 < 90 || gx3 > W - 90 || gy3 < 90 || gy3 > H - 90) continue;
      if (nearPath(gx3, gy3) < 64) continue;
      drawGrave(gx3, gy3, 14 + rnd() * 14, (rnd() - 0.5) * 0.6, rnd);
    }

    // dead trees framed around the border
    function deadTree(x, y, s, flip) {
      g.save();
      g.translate(x, y);
      g.scale(flip ? -s : s, s);
      g.strokeStyle = '#0d1712';
      g.lineCap = 'round';
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(-8, -64, 4, -124);
      g.quadraticCurveTo(12, -164, -6, -208);
      g.stroke();
      g.lineWidth = 5;
      var branches = [
        [-2, -84, -50, -124], [2, -100, 48, -144], [4, -136, -44, -190],
        [6, -154, 42, -200], [-4, -182, -28, -232], [0, -194, 30, -242]
      ];
      for (var b = 0; b < branches.length; b++) {
        var br = branches[b];
        g.beginPath();
        g.moveTo(br[0], br[1]);
        g.quadraticCurveTo(br[0] + (br[2] - br[0]) * 0.5, br[1] + (br[3] - br[1]) * 0.4, br[2], br[3]);
        g.stroke();
        g.lineWidth = Math.max(1.4, g.lineWidth * 0.8);
      }
      g.restore();
    }
    var treeSpots = [
      [120, 300, 1.2, false], [1420, 340, 1.05, true], [80, 950, 1.3, false],
      [1470, 1050, 1.15, true], [120, 1750, 1.1, false], [1440, 1850, 1.25, true],
      [250, 2370, 1.3, false], [1250, 2410, 1.15, true], [720, 56, 1.0, false],
      [1080, 120, 0.9, true], [380, 110, 0.85, true], [1330, 2390, 1.0, false]
    ];
    for (var tr = 0; tr < treeSpots.length; tr++) {
      deadTree(treeSpots[tr][0], treeSpots[tr][1], treeSpots[tr][2], treeSpots[tr][3]);
    }

    // thorny bramble border
    g.save();
    g.strokeStyle = '#0a130f';
    g.lineCap = 'round';
    var border = 46;
    for (var side = 0; side < 4; side++) {
      for (var bri = 0; bri < 46; bri++) {
        var t = bri / 46;
        var bx2, by2, nx2;
        if (side === 0) { bx2 = t * W; by2 = border + rnd() * 26; nx2 = 1; }
        else if (side === 1) { bx2 = t * W; by2 = H - border - rnd() * 26; nx2 = 1; }
        else if (side === 2) { bx2 = border + rnd() * 26; by2 = t * H; nx2 = 0; }
        else { bx2 = W - border - rnd() * 26; by2 = t * H; nx2 = 0; }
        g.lineWidth = 2 + rnd() * 3;
        var wob = 16 + rnd() * 30;
        g.beginPath();
        if (nx2) {
          g.moveTo(bx2, by2);
          g.quadraticCurveTo(bx2 + wob * 0.4, by2 - wob, bx2 + wob, by2 + wob * 0.3);
        } else {
          g.moveTo(bx2, by2);
          g.quadraticCurveTo(bx2 - wob, by2 + wob * 0.4, bx2 + wob * 0.3, by2 + wob);
        }
        g.stroke();
      }
    }
    g.restore();

    // glowing mushrooms, rune shards
    for (var mu = 0; mu < 44; mu++) {
      var ma2 = rnd() * TAU, mr2 = PLAZA + 60 + rnd() * 760;
      var mx = cx + Math.cos(ma2) * mr2, my = cy + Math.sin(ma2) * mr2;
      if (mx < 70 || mx > W - 70 || my < 70 || my > H - 70) continue;
      var mcol = rnd() < 0.45 ? '#74e4ff' : rnd() < 0.6 ? '#ffd166' : '#abff5c';
      g.fillStyle = 'rgba(18,26,20,0.5)';
      g.beginPath(); g.ellipse(mx, my + 4, 10, 4, 0, 0, TAU); g.fill();
      g.strokeStyle = '#d8d2b0';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(mx, my + 3); g.lineTo(mx + (rnd() - 0.5) * 3, my - 7); g.stroke();
      g.globalAlpha = 0.9;
      g.fillStyle = mcol;
      g.beginPath(); g.ellipse(mx, my - 9, 5 + rnd() * 3, 3.4, (rnd() - 0.5) * 0.4, 0, TAU); g.fill();
      g.globalAlpha = 0.16;
      g.beginPath(); g.arc(mx, my - 9, 16, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }

    // border atmosphere
    var edgeGrad = g.createLinearGradient(0, 0, 0, H);
    edgeGrad.addColorStop(0, 'rgba(6,10,12,0.94)');
    edgeGrad.addColorStop(0.055, 'rgba(8,13,14,0.34)');
    edgeGrad.addColorStop(0.5, 'rgba(8,13,14,0)');
    edgeGrad.addColorStop(0.945, 'rgba(8,13,14,0.34)');
    edgeGrad.addColorStop(1, 'rgba(6,10,12,0.94)');
    g.fillStyle = edgeGrad;
    g.fillRect(0, 0, W, H);
    var edgeGrad2 = g.createLinearGradient(0, 0, W, 0);
    edgeGrad2.addColorStop(0, 'rgba(6,10,12,0.94)');
    edgeGrad2.addColorStop(0.055, 'rgba(8,13,14,0.4)');
    edgeGrad2.addColorStop(0.5, 'rgba(8,13,14,0)');
    edgeGrad2.addColorStop(0.945, 'rgba(8,13,14,0.4)');
    edgeGrad2.addColorStop(1, 'rgba(6,10,12,0.94)');
    g.fillStyle = edgeGrad2;
    g.fillRect(0, 0, W, H);

    // oil-paint grain
    for (var grain = 0; grain < 5600; grain++) {
      var gxp = rnd() * W, gyp = rnd() * H;
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,244,216,0.022)' : 'rgba(6,10,10,0.05)';
      var gsz = rnd() < 0.85 ? 1 : 2;
      g.fillRect(gxp, gyp, gsz, gsz);
    }

    return c;
  };

  /* ============================================================
     layout / DOM refs
     ============================================================ */
  SpellBrigadeGame.prototype._bindDom = function () {
    if (typeof document === 'undefined') return;
    this.dom.joinZone = document.getElementById('joystick-zone');
    this.dom.knob = document.getElementById('joystick-knob');
    this.dom.dashBtn = document.getElementById('btn-dash');
  };

  SpellBrigadeGame.prototype._buildOverlays = function () {
    var g = this.ctx;
    if (!g) return;
    var w = this.vw, h = this.vh;
    var centerY = h * 0.48;
    var d1 = g.createRadialGradient(w / 2, centerY, Math.min(w, h) * 0.36, w / 2, centerY, Math.max(w, h) * 0.72);
    d1.addColorStop(0, 'rgba(8,6,16,0)');
    d1.addColorStop(0.7, 'rgba(8,6,16,0.10)');
    d1.addColorStop(1, 'rgba(6,4,14,0.48)');
    this._darkVig = d1;
    var d2 = g.createRadialGradient(w / 2, centerY, Math.min(w, h) * 0.22, w / 2, centerY, Math.max(w, h) * 0.66);
    d2.addColorStop(0, 'rgba(120,0,20,0)');
    d2.addColorStop(0.66, 'rgba(150,10,34,0)');
    d2.addColorStop(1, 'rgba(190,16,44,0.55)');
    this._lowVig = d2;
  };

  SpellBrigadeGame.prototype.resize = function () {
    if (this._destroyed) return;
    var canvas = this.canvas;
    if (!canvas) return;
    var parent = canvas.parentElement;
    var w = canvas.clientWidth || (parent ? parent.clientWidth : 0) || (typeof window !== 'undefined' ? window.innerWidth : 390);
    var h = canvas.clientHeight || (parent ? parent.clientHeight : 0) || (typeof window !== 'undefined' ? window.innerHeight : 780);
    if (!(w > 2) || !(h > 2)) {
      w = (typeof window !== 'undefined' && window.innerWidth) || 390;
      h = (typeof window !== 'undefined' && window.innerHeight) || 780;
    }
    this.vw = w;
    this.vh = h;
    this.dpr = clamp((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 1, 2);
    var pw = Math.max(1, Math.round(w * this.dpr));
    var ph = Math.max(1, Math.round(h * this.dpr));
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    this.scale = clamp(w / 400, 0.72, 1.32);
    this._bindDom();
    this._buildOverlays();
    if (this.state !== 'idle' && this.state !== 'destroyed' && this.player) this.render();
  };
  /* ============================================================
     lifecycle
     ============================================================ */
  function nowMs() {
    if (typeof performance !== 'undefined' && performance.now) return performance.now();
    return Date.now ? Date.now() : 0;
  }

  function xpNeeded(level) {
    // Lead tuning: the first ritual should arrive after the player has had a
    // moment to read the controls and feel the arena (previously ~3s).
    if (level === 1) return 38;
    return Math.round(20 + (level - 1) * 8.5 + Math.pow(level - 1, 1.5) * 1.1);
  }

  SpellBrigadeGame.prototype._resetPools = function () {
    var lists = [this.enemies, this.projectiles, this.particles, this.gems, this.numbers, this.arcs, this.pools, this.meteors];
    for (var i = 0; i < lists.length; i++) {
      var arr = lists[i];
      for (var j = 0; j < arr.length; j++) arr[j].active = false;
      arr._rr = 0;
    }
    this.boss = null;
  };

  SpellBrigadeGame.prototype._makePlayer = function () {
    var ch = this._character(this.playerId);
    if (!ch) ch = this.data.characters[0];
    var stats = ch.stats || { power: 3, speed: 3, arcane: 3, vitality: 3 };
    var theme = this._theme(ch);
    var maxHp = Math.round(120 + (stats.vitality || 3) * 18);
    var p = {
      isPlayer: true,
      id: ch.id, character: ch, element: ch.element || 'fire',
      theme: theme,
      x: WORLD.w / 2, y: WORLD.h / 2,
      vx: 0, vy: 0, r: 15,
      maxHp: maxHp, hp: maxHp,
      speed: 168 + (stats.speed || 3) * 9,
      facing: 1, aim: -0.4, bob: 0, moveT: 0, walk: 0,
      hurtT: 0, invuln: 0.9,
      level: 1, xp: 0, xpNext: xpNeeded(1),
      weapons: [{ type: 'base', element: ch.element || 'fire', level: 1, timer: 0.35, tick: 0 }],
      shield: 0, shieldTimer: 0, regenAcc: 0,
      mods: {
        dmg: 1 + (stats.power || 3) * 0.08,
        cd: 1 - (stats.arcane || 3) * 0.02,
        area: 1, shots: 0, pierce: 0,
        speed: 1, pickup: 1,
        crit: 0.035 + (stats.arcane || 3) * 0.012,
        critMult: 1.8,
        armor: 0, regen: 0.25, shieldMax: 0,
        xpGain: 1, effect: 1,
        allyDmg: 1, allyRate: 1,
        reviveTime: 8, dashPower: 1
      }
    };
    return p;
  };

  var DEFAULT_FORMATIONS = [{ x: -58, y: 46 }, { x: 58, y: 46 }, { x: 0, y: 88 }];

  SpellBrigadeGame.prototype._makeAllies = function (px, py) {
    var self = this;
    var chars = (this.data && this.data.characters) || [];
    var used = {};
    used[this.playerId] = true;
    var ids = (this.allyIds || []).slice(0, 3);
    var list = [];
    for (var i = 0; i < ids.length; i++) {
      var c = this._character(ids[i]);
      if (c && !used[c.id]) { used[c.id] = true; list.push(c); }
    }
    for (var j = 0; j < chars.length && list.length < 3; j++) {
      if (!used[chars[j].id]) { used[chars[j].id] = true; list.push(chars[j]); }
    }
    var allies = [];
    for (var k = 0; k < list.length && k < 3; k++) {
      var ch = list[k];
      var stats = ch.stats || { power: 3, speed: 3, arcane: 3, vitality: 3 };
      var f = ch.formation || DEFAULT_FORMATIONS[k];
      var maxHp = Math.round(102 + (stats.vitality || 3) * 12);
      var ally = {
        isAlly: true, slot: k,
        id: ch.id, character: ch, element: ch.element || ELEMENT_KEYS[k % 4],
        theme: this._theme(ch),
        x: px + f.x, y: py + f.y,
        vx: 0, vy: 0, r: 13,
        maxHp: maxHp, hp: maxHp,
        speed: 172 + (stats.speed || 3) * 6,
        formation: { x: f.x, y: f.y },
        facing: 1, aim: -0.4, bob: k * 1.7, walk: 0, moveT: 0,
        hurtT: 0, invuln: 0,
        fireTimer: 0.5 + k * 0.35,
        down: false, reviveT: 0,
        dmgScale: 0.5 + (stats.power || 3) * 0.04
      };
      allies.push(ally);
    }
    return allies;
  };

  SpellBrigadeGame.prototype._initRun = function () {
    this.time = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.waveIndex = 0;
    this.wave = 1;
    this.levelBonus = 0;
    this.bossBonus = 0;
    this.bossSpawned = false;
    this.bossKilled = false;
    this.bossIntro = 0;
    this.bossIntroMax = 0;
    this.shieldRecharge = 0;
    this.spawnTimer = 0.5;
    this.dashCd = 0;
    this.dashT = 0;
    this.dashQueued = false;
    this.levelUpsQueued = 0;
    this.pendingChoices = null;
    this.upgradeLevels = {};
    this.screenFlash = 0;
    this.shake = 0;
    this.camZoom = 1;
    this._resultFired = false;
    this._endResult = null;
    this.joy.active = false;
    this.joy.x = 0;
    this.joy.y = 0;
    this.joy.id = null;
    if (this.dom.knob) this.dom.knob.style.transform = 'translate(0px, 0px)';
    this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;

    var waves = (this.data.meta && this.data.meta.waves) || [];
    this.waveName = waves[0] ? waves[0].name : '第一夜';
    this.waveSub = waves[0] ? waves[0].sub : '';
    this.bossName = (this.data.meta && this.data.meta.bossName) || BOSS_NAME;

    this._resetPools();
    this.player = this._makePlayer();
    this.allies = this._makeAllies(this.player.x, this.player.y);
    this.cam.x = this.player.x;
    this.cam.y = this.player.y;
    this._clampCamera(true);

    var baseDmg = this.player.weapons[0] ? this._baseWeaponInfo(this.player.weapons[0]).dmg : 16;
    var self = this;
    // opening pack — instant feedback, but not on top of the player
    var seeds = [
      { a: -1.15, d: 205, t: 'crawler' },
      { a: 1.25, d: 235, t: 'crawler' },
      { a: -2.5, d: 215, t: 'crawler' },
      { a: 2.55, d: 245, t: 'bat' },
      { a: 0.15, d: 195, t: 'crawler' },
      { a: -0.75, d: 285, t: 'crawler' },
      { a: 1.9, d: 300, t: 'bat' }
    ];
    for (var i = 0; i < seeds.length; i++) {
      var s = seeds[i];
      this._spawnEnemyAt(s.t, this.player.x + Math.cos(s.a) * s.d, this.player.y + Math.sin(s.a) * s.d, false);
    }

    this._hudDirty = true;
    this._hudLast = 0;
  };

  SpellBrigadeGame.prototype.start = function () {
    if (this._destroyed) return false;
    if (!this.canvas || !this.ctx) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[SpellBrigadeGame] missing canvas, start() ignored');
      return false;
    }
    if (this.state === 'running' || this.state === 'levelup') return true;
    this.resize();
    this._initRun();
    this._attachInput();
    this._bindDom();
    this.state = 'running';
    this._lastTs = 0;
    this._startedAt = nowMs();
    this._hudLast = 0;
    this.emitHud(true);
    this._emitEvent('wave', { index: this.wave, name: this.waveName, sub: this.waveSub, time: 0 });
    this._schedule();
    return true;
  };

  SpellBrigadeGame.prototype._schedule = function () {
    if (this._raf || this._destroyed || this.state !== 'running') return;
    var self = this;
    this._raf = requestAnimationFrame(function (ts) { self._tick(ts); });
  };

  SpellBrigadeGame.prototype._tick = function (ts) {
    this._raf = null;
    if (this._destroyed || this.state !== 'running') return;
    if (!this._lastTs) this._lastTs = ts;
    var dt = (ts - this._lastTs) / 1000;
    this._lastTs = ts;
    if (!(dt > 0)) dt = 0.016;
    if (dt > 0.05) dt = 0.05;
    this.update(dt);
    this.render();
    if (this.state === 'running') this._schedule();
  };

  SpellBrigadeGame.prototype.update = function (dt) {
    if (this.state !== 'running' || !this.player) return;
    this.uiTime += dt;
    this.time += dt;

    this._syncTimeline();
    if (this.state !== 'running') return;

    this._updateInputVector();
    this._updatePlayer(dt);
    this._updateWeapons(dt);
    this._updateAllies(dt);
    this._updateSpawner(dt);
    this._updateEnemies(dt);
    this._updateBoss(dt);
    this._updateProjectiles(dt);
    this._updateGems(dt);
    this._updatePools(dt);
    this._updateMeteors(dt);
    this._updateParticles(dt);
    this._updateNumbers(dt);
    this._updateArcs(dt);
    this._updateTimers(dt);
    this._updateCamera(dt);

    if (this.player.hp <= 0 && this.state === 'running') this._endGame('defeat');
    if (this.state === 'running') this.emitHud(false);
  };

  SpellBrigadeGame.prototype.pause = function (reason) {
    if (this.state !== 'running') return false;
    this.state = 'paused';
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._lastTs = 0;
    this.joy.active = false;
    this.joy.x = 0;
    this.joy.y = 0;
    if (this.dom.knob) this.dom.knob.style.transform = 'translate(0px, 0px)';
    this.emitHud(true);
    this.render();
    this._emitEvent('pause', { reason: reason || 'manual' });
    return true;
  };

  SpellBrigadeGame.prototype.resume = function () {
    if (this.state !== 'paused') return false;
    this.state = 'running';
    this._lastTs = 0;
    this.emitHud(true);
    this._schedule();
    return true;
  };

  SpellBrigadeGame.prototype.isPaused = function () {
    return this.state === 'paused' || this.state === 'levelup';
  };

  SpellBrigadeGame.prototype.destroy = function () {
    if (this._destroyed) return;
    this._destroyed = true;
    this.state = 'destroyed';
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._detachInput();
    if (this._resizeObs) {
      try { this._resizeObs.disconnect(); } catch (e) {}
      this._resizeObs = null;
    }
    if (this.ctx && this.canvas) {
      try {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      } catch (e) {}
    }
    this.player = null;
    this.allies = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.gems = [];
    this.numbers = [];
    this.arcs = [];
    this.pools = [];
    this.meteors = [];
    this.boss = null;
    this.pendingChoices = null;
    this.dom = { joinZone: null, knob: null, dashBtn: null };
    this.sprites = null;
    this.ground = null;
    this.ctx = null;
    this.canvas = null;
    this.data = null;
    this._bound = [];
  };

  /* ============================================================
     input
     ============================================================ */
  SpellBrigadeGame.prototype._attachInput = function () {
    this._detachInput();
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    var self = this;
    var bound = this._bound;
    function listen(target, type, fn, opts) {
      if (!target) return;
      try { target.addEventListener(type, fn, opts); } catch (e) {}
      bound.push({ t: target, type: type, fn: fn, opts: opts });
    }

    listen(window, 'keydown', function (e) { self._handleKey(e, true); });
    listen(window, 'keyup', function (e) { self._handleKey(e, false); });
    listen(window, 'resize', function () { self.resize(); });
    listen(window, 'orientationchange', function () { setTimeout(function () { self.resize(); }, 120); });
    listen(document, 'visibilitychange', function () {
      if (document.hidden && self.state === 'running') self.pause('visibility');
    });

    var zone = this.dom.joinZone;
    var knob = this.dom.knob;
    if (zone) {
      if (typeof window.PointerEvent === 'function') {
        listen(zone, 'pointerdown', function (e) { self._joyDown(e); }, { passive: false });
        listen(zone, 'pointermove', function (e) { self._joyMove(e); }, { passive: false });
        listen(zone, 'pointerup', function (e) { self._joyUp(e); }, { passive: false });
        listen(zone, 'pointercancel', function (e) { self._joyUp(e); }, { passive: false });
        listen(zone, 'lostpointercapture', function (e) { self._joyUp(e); });
      } else {
        listen(zone, 'touchstart', function (e) { self._touchJoy(e, 'start'); }, { passive: false });
        listen(zone, 'touchmove', function (e) { self._touchJoy(e, 'move'); }, { passive: false });
        listen(zone, 'touchend', function (e) { self._touchJoy(e, 'end'); }, { passive: false });
        listen(zone, 'touchcancel', function (e) { self._touchJoy(e, 'end'); }, { passive: false });
      }
    }
    var dashBtn = this.dom.dashBtn;
    if (dashBtn) {
      listen(dashBtn, 'pointerdown', function (e) {
        if (self.state === 'running') { self.dashQueued = true; e.preventDefault(); }
      }, { passive: false });
      if (typeof window.PointerEvent !== 'function') {
        listen(dashBtn, 'click', function (e) {
          if (self.state === 'running') { self.dashQueued = true; e.preventDefault(); }
        });
      }
    }

    if (typeof ResizeObserver !== 'undefined' && this.canvas && this.canvas.parentElement) {
      try {
        this._resizeObs = new ResizeObserver(function () { self.resize(); });
        this._resizeObs.observe(this.canvas.parentElement);
      } catch (e) { this._resizeObs = null; }
    }
  };

  SpellBrigadeGame.prototype._detachInput = function () {
    var bound = this._bound || [];
    for (var i = 0; i < bound.length; i++) {
      try { bound[i].t.removeEventListener(bound[i].type, bound[i].fn, bound[i].opts); } catch (e) {}
    }
    this._bound = [];
  };

  SpellBrigadeGame.prototype._handleKey = function (e, down) {
    var k = e.key;
    var map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right'
    };
    if (map[k]) {
      this.keys[map[k]] = down;
      if (this.state === 'running' && e.preventDefault) e.preventDefault();
      return;
    }
    if (k === ' ' || k === 'Spacebar' || k === 'Space') {
      if (down && this.state === 'running') this.dashQueued = true;
      if (this.state === 'running' && e.preventDefault) e.preventDefault();
    }
  };

  SpellBrigadeGame.prototype._joyCenter = null;
  SpellBrigadeGame.prototype._joyRadius = 52;

  SpellBrigadeGame.prototype._joyDown = function (e) {
    if (this.state !== 'running' || !this.dom.joinZone) return;
    var zone = this.dom.joinZone;
    var rect = zone.getBoundingClientRect();
    this._joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this._joyRadius = Math.max(28, Math.min(52, Math.min(rect.width, rect.height) * 0.32));
    this.joy.active = true;
    this.joy.id = e.pointerId;
    try { zone.setPointerCapture(e.pointerId); } catch (err) {}
    this._joyMove(e);
    if (e.preventDefault) e.preventDefault();
  };

  SpellBrigadeGame.prototype._joyMove = function (e) {
    if (!this.joy.active || !this._joyCenter) return;
    if (this.joy.id !== null && e.pointerId !== this.joy.id) return;
    var dx = e.clientX - this._joyCenter.x;
    var dy = e.clientY - this._joyCenter.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    var max = this._joyRadius;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    this.joy.x = dx / max;
    this.joy.y = dy / max;
    if (this.dom.knob) this.dom.knob.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
    if (e.preventDefault) e.preventDefault();
  };

  SpellBrigadeGame.prototype._joyUp = function (e) {
    if (!this.joy.active) return;
    this.joy.active = false;
    this.joy.x = 0;
    this.joy.y = 0;
    this.joy.id = null;
    if (this.dom.knob) this.dom.knob.style.transform = 'translate(0px, 0px)';
    if (e && e.preventDefault) e.preventDefault();
  };

  SpellBrigadeGame.prototype._touchJoy = function (e, phase) {
    var t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    if (phase === 'start') {
      this._joyDown({ clientX: t.clientX, clientY: t.clientY, pointerId: t.identifier, preventDefault: function () { e.preventDefault(); } });
    } else if (phase === 'move') {
      this._joyMove({ clientX: t.clientX, clientY: t.clientY, pointerId: t.identifier, preventDefault: function () { e.preventDefault(); } });
    } else {
      this._joyUp({ preventDefault: function () { e.preventDefault(); } });
    }
    if (e.preventDefault) e.preventDefault();
  };

  SpellBrigadeGame.prototype._updateInputVector = function () {
    var mx = 0, my = 0;
    if (this.joy.active && (this.joy.x || this.joy.y)) {
      mx = this.joy.x;
      my = this.joy.y;
    } else {
      if (this.keys.left) mx -= 1;
      if (this.keys.right) mx += 1;
      if (this.keys.up) my -= 1;
      if (this.keys.down) my += 1;
    }
    var len = Math.sqrt(mx * mx + my * my);
    if (len > 1) { mx /= len; my /= len; }
    this.moveX = mx;
    this.moveY = my;
  };

  /* ============================================================
     HUD / events / audio
     ============================================================ */
  SpellBrigadeGame.prototype._emitEvent = function (type, payload) {
    if (!this.cb.onEvent) return;
    try { this.cb.onEvent(type, payload || {}); } catch (e) {}
  };

  SpellBrigadeGame.prototype._sfx = function (name) {
    if (this._destroyed) return;
    try {
      if (typeof window !== 'undefined' && window.SBAudio && typeof window.SBAudio.sfx === 'function') {
        window.SBAudio.sfx(name);
      }
    } catch (e) {}
  };

  SpellBrigadeGame.prototype._sfxThrottled = function (name, ms) {
    if (!this._sfxLast) this._sfxLast = {};
    var t = nowMs();
    var last = this._sfxLast[name] || 0;
    if (t - last < ms) return;
    this._sfxLast[name] = t;
    this._sfx(name);
  };

  SpellBrigadeGame.prototype._scoreNow = function () {
    var lvl = this.player ? this.player.level : 1;
    return Math.round(this.kills * 12 + this.damageDealt * 0.32 + (lvl - 1) * 45 + this.bossBonus);
  };

  SpellBrigadeGame.prototype._buildParty = function () {
    var list = [];
    var p = this.player;
    if (p) {
      list.push({
        id: p.id, name: p.character.name, element: p.element,
        portrait: p.character.portrait || '', hp: Math.max(0, Math.round(p.hp)),
        maxHp: Math.round(p.maxHp), alive: p.hp > 0
      });
    }
    for (var i = 0; i < this.allies.length; i++) {
      var a = this.allies[i];
      list.push({
        id: a.id, name: a.character.name, element: a.element,
        portrait: a.character.portrait || '', hp: Math.max(0, Math.round(a.hp)),
        maxHp: Math.round(a.maxHp), alive: !a.down
      });
    }
    return list;
  };

  SpellBrigadeGame.prototype.emitHud = function (force) {
    if (this._destroyed || !this.cb.onHud) return;
    var t = nowMs();
    if (!force && t - this._hudLast < 100) return;
    this._hudLast = t;
    var p = this.player;
    if (!p) return;
    var hud = {
      hp: Math.max(0, Math.round(p.hp)),
      maxHp: Math.round(p.maxHp),
      level: p.level,
      xp: Math.round(p.xp),
      xpNext: Math.round(p.xpNext),
      time: Math.floor(this.time),
      timeLimit: TIME_LIMIT,
      kills: this.kills,
      wave: this.wave,
      waveName: this.waveName,
      boss: (this.boss && this.boss.alive) ? {
        name: this.boss.name,
        hp: Math.max(0, Math.round(this.boss.hp)),
        maxHp: Math.round(this.boss.maxHp)
      } : null,
      dashCd: Math.max(0, Math.round(this.dashCd * 10) / 10),
      dashMax: this.dashMax,
      score: this._scoreNow(),
      party: this._buildParty()
    };
    try { this.cb.onHud(hud); } catch (e) {}
  };

  /* ============================================================
     level up / upgrades
     ============================================================ */
  SpellBrigadeGame.prototype._weaponOf = function (type) {
    var p = this.player;
    if (!p) return null;
    for (var i = 0; i < p.weapons.length; i++) if (p.weapons[i].type === type) return p.weapons[i];
    return null;
  };

  SpellBrigadeGame.prototype._choicesAvailable = function () {
    var out = [];
    var p = this.player;
    for (var i = 0; i < UPGRADES.length; i++) {
      var def = UPGRADES[i];
      var lv = this.upgradeLevels[def.id] || 0;
      if (lv >= def.maxLevel) continue;
      if (p.level < def.minLevel) continue;
      out.push(def);
    }
    return out;
  };

  SpellBrigadeGame.prototype._makeCard = function (def) {
    var lv = this.upgradeLevels[def.id] || 0;
    var tag;
    if (def.category === 'weapon') tag = lv ? '强化 Lv.' + (lv + 1) : '新法术';
    else if (def.category === 'mod') tag = '法术强化';
    else tag = '被动 · Lv.' + (lv + 1);
    return {
      id: def.id,
      name: def.name,
      en: def.en,
      element: def.element,
      rarity: def.rarity,
      rarityLabel: RARITY_LABEL[def.rarity] || '普通',
      icon: def.icon,
      desc: def.descFn(lv, this.player),
      tag: tag
    };
  };

  SpellBrigadeGame.prototype._weightOf = function (def) {
    var w = (def.weight || 1) * (RARITY_WEIGHT[def.rarity] || 1);
    if (def.category === 'weapon') {
      var owned = this._weaponOf(def.weapon);
      if (!owned) w *= 2.1;
      else w *= 0.85;
    }
    return Math.max(0.05, w);
  };

  SpellBrigadeGame.prototype._generateChoices = function () {
    var pool = this._choicesAvailable();
    var picked = [];
    var pickedIds = {};
    var tries = 0;
    while (picked.length < 3 && pool.length > 0 && tries < 80) {
      tries++;
      var total = 0;
      var i;
      for (i = 0; i < pool.length; i++) total += this._weightOf(pool[i]);
      var roll = Math.random() * total;
      var idx = 0;
      for (i = 0; i < pool.length; i++) {
        roll -= this._weightOf(pool[i]);
        if (roll <= 0) { idx = i; break; }
      }
      var def = pool[idx];
      pool.splice(idx, 1);
      if (!pickedIds[def.id]) { pickedIds[def.id] = true; picked.push(def); }
    }
    // nudge: early game guarantee a new weapon if the brigade is still small
    var hasWeaponChoice = false;
    var i2;
    for (i2 = 0; i2 < picked.length; i2++) if (picked[i2].category === 'weapon') hasWeaponChoice = true;
    if (!hasWeaponChoice && this.player.level <= 7) {
      var ownedCount = this.player.weapons.length;
      if (ownedCount < 3) {
        var best = null, bestW = -1;
        for (i2 = 0; i2 < pool.length; i2++) {
          if (pool[i2].category !== 'weapon') continue;
          if (this._weaponOf(pool[i2].weapon)) continue;
          if (this.player.level < pool[i2].minLevel) continue;
          var w = this._weightOf(pool[i2]);
          if (w > bestW) { bestW = w; best = pool[i2]; }
        }
        if (best) {
          if (picked.length >= 3) {
            // replace a non-weapon card, prefer common passive
            var repl = picked.length - 1;
            for (i2 = 0; i2 < picked.length; i2++) {
              if (picked[i2].category === 'passive' && picked[i2].rarity === 'common') { repl = i2; break; }
            }
            delete pickedIds[picked[repl].id];
            picked[repl] = best;
            pickedIds[best.id] = true;
          } else {
            picked.push(best);
            pickedIds[best.id] = true;
          }
        }
      }
    }
    var cards = [];
    for (i2 = 0; i2 < picked.length; i2++) cards.push(this._makeCard(picked[i2]));
    return cards;
  };

  SpellBrigadeGame.prototype._gainXp = function (amount) {
    var p = this.player;
    if (!p || this.state === 'ended' || this.state === 'destroyed' || this.state === 'ending') return;
    if (p.level >= 20) { p.xp = p.xpNext; return; }
    var gain = amount * (p.mods.xpGain || 1);
    p.xp += gain;
    while (p.level < 20 && p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = xpNeeded(p.level);
      this.levelUpsQueued++;
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12);
      this._levelUpBurst();
    }
    if (p.level >= 20) p.xp = Math.min(p.xp, p.xpNext);
    if (this.levelUpsQueued > 0) this._openLevelUp();
  };

  SpellBrigadeGame.prototype._levelUpBurst = function () {
    var p = this.player;
    if (!p) return;
    this._sfx('level-up');
    this._burst(p.x + rand(-6, 6), p.y + rand(-6, 6), 26, '#ffd166', { speed: rand(60, 190), life: rand(0.4, 0.9), size: rand(2, 4.5), glow: true });
    this._burst(p.x, p.y, 14, '#fff4d8', { speed: rand(30, 110), life: rand(0.3, 0.7), size: rand(1.5, 3), glow: true });
    this._ringFx(p.x, p.y, '#ffd166', 10, 120, 0.55, 4);
    this._ringFx(p.x, p.y, '#74e4ff', 6, 84, 0.45, 3);
    this.screenFlash = Math.max(this.screenFlash, 0.36);
    this.shake = Math.max(this.shake, 2.2);
  };

  SpellBrigadeGame.prototype._openLevelUp = function () {
    if (this.state === 'ended' || this.state === 'destroyed') return;
    if (this.pendingChoices) return;
    var choices = this._generateChoices();
    this.pendingChoices = choices;
    this.state = 'levelup';
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._lastTs = 0;
    this.joy.active = false;
    this.joy.x = 0;
    this.joy.y = 0;
    if (this.dom.knob) this.dom.knob.style.transform = 'translate(0px, 0px)';
    this.emitHud(true);
    try { if (this.cb.onLevelUp) this.cb.onLevelUp(choices); } catch (e) {}
  };

  SpellBrigadeGame.prototype._applyUpgradeEffect = function (def, newLevel) {
    var p = this.player;
    if (!p) return;
    var mods = p.mods;
    switch (def.id) {
      case 'orb-blade':
        this._grantWeapon('orb');
        break;
      case 'necro-whirl':
        this._grantWeapon('necro');
        break;
      case 'chain-barrage':
        this._grantWeapon('chain');
        break;
      case 'frost-nova':
        this._grantWeapon('nova');
        break;
      case 'acid-field':
        this._grantWeapon('acid');
        break;
      case 'starfall':
        this._grantWeapon('star');
        break;
      case 'multi-shot':
        mods.shots += 1;
        break;
      case 'pierce':
        mods.pierce += 1;
        break;
      case 'rapid-cast':
        mods.cd *= 0.88;
        break;
      case 'wide-area':
        mods.area *= 1.18;
        break;
      case 'power-surge':
        mods.dmg *= 1.15;
        break;
      case 'overcharge':
        mods.effect *= 1.25;
        mods.dmg *= 1.08;
        break;
      case 'vitality':
        p.maxHp += 32;
        p.hp = Math.min(p.maxHp, p.hp + 32);
        break;
      case 'swift-boots':
        mods.speed *= 1.08;
        break;
      case 'magnet':
        mods.pickup *= 1.3;
        break;
      case 'moon-shield':
        mods.shieldMax += 1;
        p.shield = Math.min(mods.shieldMax, p.shield + 1);
        break;
      case 'crit-eye':
        mods.crit += 0.07;
        break;
      case 'bonfire':
        p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.55);
        mods.regen += 1.1;
        break;
      case 'stone-skin':
        mods.armor = Math.min(0.6, mods.armor + 0.09);
        break;
      case 'dash-master':
        this.dashMax = Math.max(1.4, this.dashMax - 0.7);
        mods.dashPower *= 1.2;
        break;
      case 'spirit-call':
        mods.allyDmg *= 1.3;
        mods.allyRate *= 0.85;
        break;
      case 'wisdom':
        mods.xpGain *= 1.18;
        break;
      case 'team-resolve':
        mods.reviveTime = Math.max(4, mods.reviveTime - 1.5);
        for (var i = 0; i < this.allies.length; i++) {
          var a = this.allies[i];
          a.maxHp += 30;
          a.hp = Math.min(a.maxHp, a.hp + 30);
        }
        break;
    }
    if (def.category === 'weapon') {
      var w = this._weaponOf(def.weapon);
      if (w && newLevel > 1) w.level = Math.max(w.level, newLevel);
    }
    // small level-up sparkle on the player
    this._burst(p.x, p.y - 10, 10, '#fff4d8', { speed: rand(30, 90), life: rand(0.25, 0.5), size: rand(1.5, 2.6), glow: true });
  };

  SpellBrigadeGame.prototype._grantWeapon = function (type) {
    var p = this.player;
    var existing = this._weaponOf(type);
    var info = WEAPON_INFO[type];
    if (existing) {
      existing.level++;
      return existing;
    }
    var w = { type: type, element: info.element, level: 1, timer: 0.45, tick: 0.2 };
    p.weapons.push(w);
    this._burst(p.x, p.y - 8, 16, ELEM[info.element].glow, { speed: rand(40, 120), life: rand(0.3, 0.6), size: rand(1.5, 3), glow: true });
    return w;
  };

  SpellBrigadeGame.prototype.applyUpgrade = function (choiceId) {
    if (this.state !== 'levelup' || !this.pendingChoices) return false;
    var def = null;
    for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === choiceId) { def = UPGRADES[i]; break; }
    if (!def) return false;
    var lv = this.upgradeLevels[def.id] || 0;
    if (lv >= def.maxLevel) return false;
    this.upgradeLevels[def.id] = lv + 1;
    this._applyUpgradeEffect(def, lv + 1);
    this.pendingChoices = null;
    this.levelUpsQueued = Math.max(0, this.levelUpsQueued - 1);
    this._hudDirty = true;
    this.emitHud(true);
    if (this.levelUpsQueued > 0) {
      this._openLevelUp();
      this.render();
      return true;
    }
    this.state = 'running';
    this._lastTs = 0;
    this._schedule();
    return true;
  };

  SpellBrigadeGame.prototype._buildStats = function (result) {
    var p = this.player;
    var score = this._scoreNow() + (result === 'victory' ? 2000 : 0);
    var grade;
    if (result === 'victory') {
      if (this.bossKilled && this.damageTaken <= 180 && p && p.level >= 14) grade = 'S';
      else if (this.bossKilled || this.damageTaken <= 340) grade = 'A';
      else grade = 'B';
    } else {
      grade = (this.kills >= 160 && score >= 4200) ? 'B' : 'C';
    }
    return {
      result: result,
      characterId: (p && p.character && p.character.id) || this.playerId,
      time: result === 'victory' ? TIME_LIMIT : Math.min(TIME_LIMIT, Math.round(this.time)),
      kills: this.kills,
      level: p ? p.level : 1,
      damage: Math.round(this.damageDealt),
      damageTaken: Math.round(this.damageTaken),
      score: Math.round(score),
      grade: grade,
      wave: this.wave
    };
  };

  SpellBrigadeGame.prototype._endGame = function (result) {
    if (this.state === 'ended' || this.state === 'destroyed') return;
    if (this._resultFired) return;
    this._resultFired = true;
    this._endResult = result;
    this.bossIntro = 0;
    this.state = 'ended';
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._lastTs = 0;
    this.joy.active = false;
    this.joy.x = 0;
    this.joy.y = 0;
    if (this.dom.knob) this.dom.knob.style.transform = 'translate(0px, 0px)';
    var p = this.player;
    if (p && result === 'defeat') {
      p.hp = 0;
      this._burst(p.x, p.y, 34, '#ff5d8f', { speed: rand(40, 160), life: rand(0.5, 1.1), size: rand(2, 5), glow: true });
      this._burst(p.x, p.y, 20, '#fff4d8', { speed: rand(20, 90), life: rand(0.4, 0.9), size: rand(2, 4), glow: true });
      this.shake = Math.max(this.shake, 8);
    } else if (p) {
      this._burst(p.x, p.y, 30, '#ffd166', { speed: rand(50, 180), life: rand(0.5, 1.2), size: rand(2, 5), glow: true });
      this._burst(p.x, p.y, 16, '#74e4ff', { speed: rand(30, 120), life: rand(0.4, 1), size: rand(2, 4), glow: true });
      this.shake = Math.max(this.shake, 5);
    }
    this._sfx(result === 'victory' ? 'victory' : 'defeat');
    this.emitHud(true);
    try { this.render(); } catch (renderErr) {}
    var stats = this._buildStats(result);
    try {
      if (result === 'victory' && this.cb.onVictory) this.cb.onVictory(stats);
      else if (result === 'defeat' && this.cb.onGameOver) this.cb.onGameOver(stats);
    } catch (e) {}
  };

  /* ============================================================
     debug helpers (harmless; used by _review harness / QA)
     ============================================================ */
  SpellBrigadeGame.prototype.debugSetTime = function (seconds) {
    if (this.state !== 'running' && this.state !== 'paused') return false;
    this.time = clamp(seconds || 0, 0, TIME_LIMIT - 0.01);
    this.spawnTimer = 0.1;
    return true;
  };

  SpellBrigadeGame.prototype.debugAddXp = function (amount) {
    if (this.state !== 'running') return false;
    this._gainXp(amount || 50);
    return true;
  };

  SpellBrigadeGame.prototype.debugLevelUp = function () {
    if (this.state !== 'running' || !this.player) return false;
    if (this.player.level >= 20) return false;
    this.player.xp = this.player.xpNext;
    this._gainXp(0);
    return this.state === 'levelup';
  };

  SpellBrigadeGame.prototype.debugSpawnBoss = function () {
    if (this.state !== 'running' || this.bossSpawned) return false;
    this.spawnBoss();
    return true;
  };

  SpellBrigadeGame.prototype.debugWin = function () {
    if (this.state !== 'running') return false;
    this._endGame('victory');
    return true;
  };

  SpellBrigadeGame.prototype.debugLose = function () {
    if (this.state !== 'running') return false;
    if (this.player) this.player.hp = 0;
    this._endGame('defeat');
    return true;
  };

  SpellBrigadeGame.prototype.getHud = function () {
    var out = null;
    var self = this;
    var saved = this.cb.onHud;
    this.cb.onHud = function (h) { out = h; };
    this.emitHud(true);
    this.cb.onHud = saved;
    return out;
  };
  /* ============================================================
     spawn helpers / pools
     ============================================================ */
  function takeSlot(arr, cap, factory) {
    var n = arr.length;
    if (n < cap) {
      var o = factory();
      o.active = true;
      arr.push(o);
      return o;
    }
    var rr = (arr._rr || 0) % n;
    for (var i = 0; i < n; i++) {
      var idx = (rr + i) % n;
      if (!arr[idx].active) {
        arr._rr = (idx + 1) % n;
        arr[idx].active = true;
        return arr[idx];
      }
    }
    arr._rr = (rr + 1) % n;
    arr[rr].active = true;
    return arr[rr];
  }

  var ENEMY_BASE = {
    crawler: { hp: 26, speed: 66, r: 13, xp: 6, dmg: 6, score: 12 },
    bat: { hp: 18, speed: 112, r: 10, xp: 6, dmg: 6, score: 12 },
    eye: { hp: 34, speed: 54, r: 13, xp: 9, dmg: 6, score: 18 },
    brute: { hp: 98, speed: 45, r: 21, xp: 18, dmg: 11, score: 30 }
  };

  var BASE_WEAPON = {
    fire: { cd: 0.56, dmg: 16, speed: 560 },
    ice: { cd: 0.66, dmg: 14, speed: 530 },
    lightning: { cd: 0.4, dmg: 10, speed: 700 },
    acid: { cd: 0.78, dmg: 14, speed: 430 }
  };

  SpellBrigadeGame.prototype._baseWeaponInfo = function (w) {
    var b = BASE_WEAPON[w.element] || BASE_WEAPON.fire;
    var lv = (this.player && this.player.level) || 1;
    var wl = w.level || 1;
    return {
      cd: b.cd * Math.pow(0.95, wl - 1) * Math.max(0.7, 1 - (lv - 1) * 0.012),
      dmg: b.dmg * (1 + 0.18 * (wl - 1)) * (1 + (lv - 1) * 0.07),
      speed: b.speed
    };
  };

  SpellBrigadeGame.prototype._nearestTeam = function (x, y, aliveOnly) {
    var best = null, bd = Infinity;
    var p = this.player;
    if (p && (!aliveOnly || p.hp > 0)) { best = p; bd = dist2(x, y, p.x, p.y); }
    for (var i = 0; i < this.allies.length; i++) {
      var a = this.allies[i];
      if (aliveOnly && a.down) continue;
      var d = dist2(x, y, a.x, a.y);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  };

  SpellBrigadeGame.prototype._nearestEnemy = function (x, y, range, exclude) {
    var best = null, bd = range * range;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.active) continue;
      if (exclude && e === exclude) continue;
      var d = dist2(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (this.boss && this.boss.alive && this.boss.introT <= 0) {
      var bd2 = dist2(x, y, this.boss.x, this.boss.y);
      if (bd2 < bd) best = this.boss;
    }
    return best;
  };

  SpellBrigadeGame.prototype._enemyCount = function () {
    var n = 0;
    for (var i = 0; i < this.enemies.length; i++) if (this.enemies[i].active) n++;
    return n;
  };

  SpellBrigadeGame.prototype._spawnProj = function (o) {
    var self = this;
    var p = takeSlot(this.projectiles, MAX_PROJ, function () { return {}; });
    p.x = o.x; p.y = o.y;
    p.vx = Math.cos(o.angle) * o.speed;
    p.vy = Math.sin(o.angle) * o.speed;
    p.speed = o.speed;
    p.r = o.r || 5;
    p.dmg = o.dmg || 10;
    p.element = o.element || 'fire';
    p.friendly = !!o.friendly;
    p.kind = o.kind || 'bolt';
    p.life = o.life || 1.8;
    p.pierce = o.pierce || 0;
    p.crit = o.crit !== undefined ? o.crit : 0.05;
    p.critMult = o.critMult || 1.8;
    p.hitUids = p.hitUids || [];
    p.hitUids.length = 0;
    p.trailT = 0;
    p.spin = rand(0, TAU);
    p.glow = o.glow !== false;
    p.big = !!o.big;
    p.color = o.color || null;
    p.targetX = 0; p.targetY = 0;
    return p;
  };

  SpellBrigadeGame.prototype._spawnNumber = function (x, y, amount, color, crit) {
    var n = takeSlot(this.numbers, MAX_NUMBERS, function () { return {}; });
    n.x = x; n.y = y;
    n.text = '' + amount;
    n.color = color || '#fff4d8';
    n.crit = !!crit;
    n.life = n.maxLife = crit ? 0.75 : 0.6;
    n.vy = crit ? -58 : -44;
    n.vx = rand(-14, 14);
    n.scale = crit ? 1.35 : 1;
    return n;
  };

  SpellBrigadeGame.prototype._burst = function (x, y, count, color, opts) {
    opts = opts || {};
    for (var i = 0; i < count; i++) {
      var part = takeSlot(this.particles, MAX_PARTICLES, function () { return {}; });
      var a = opts.angle !== undefined ? opts.angle + rand(-(opts.spread || 0.8), (opts.spread || 0.8)) : rand(0, TAU);
      var sp = (opts.speed || 90) * rand(0.35, 1.15);
      part.type = opts.type || 'dot';
      part.x = x + (opts.jitter ? rand(-opts.jitter, opts.jitter) : 0);
      part.y = y + (opts.jitter ? rand(-opts.jitter, opts.jitter) : 0);
      part.vx = Math.cos(a) * sp;
      part.vy = Math.sin(a) * sp - (opts.lift || 0);
      part.life = part.maxLife = (opts.life || 0.55) * rand(0.65, 1.2);
      part.size = (opts.size || 3) * rand(0.6, 1.3);
      part.color = Array.isArray(color) ? pick(color) : color;
      part.drag = opts.drag !== undefined ? opts.drag : 0.9;
      part.grav = opts.grav !== undefined ? opts.grav : 0;
      part.glow = opts.glow !== false;
      part.r = 0;
      part.grow = opts.grow || 0;
      part.spin = rand(0, TAU);
    }
  };

  SpellBrigadeGame.prototype._ringFx = function (x, y, color, r0, r1, life, width) {
    var part = takeSlot(this.particles, MAX_PARTICLES, function () { return {}; });
    part.type = 'ring';
    part.x = x; part.y = y;
    part.vx = 0; part.vy = 0;
    part.life = part.maxLife = life || 0.4;
    part.size = width || 3;
    part.color = color;
    part.drag = 1;
    part.grav = 0;
    part.glow = true;
    part.r = r0 || 8;
    part.grow = ((r1 || 80) - (r0 || 8)) / (life || 0.4);
    return part;
  };

  SpellBrigadeGame.prototype._spawnArc = function (x1, y1, x2, y2, color, life, width) {
    var a = takeSlot(this.arcs, MAX_ARCS, function () { return {}; });
    a.x1 = x1; a.y1 = y1; a.x2 = x2; a.y2 = y2;
    a.color = color || '#ffe14d';
    a.life = a.maxLife = life || 0.18;
    a.width = width || 2.5;
    a.seed = rand(0, 1000);
    return a;
  };

  SpellBrigadeGame.prototype._spawnGem = function (x, y, value) {
    if (this.gems.length >= MAX_GEMS) {
      // merge into an existing crystal so XP is never lost
      for (var i = 0; i < this.gems.length; i++) {
        if (this.gems[i].active) { this.gems[i].value += value; return; }
      }
    }
    var g = takeSlot(this.gems, MAX_GEMS, function () { return {}; });
    g.x = x; g.y = y;
    g.vx = rand(-46, 46);
    g.vy = rand(-62, -18);
    g.value = value;
    g.phase = rand(0, TAU);
    g.magnet = false;
    g.radius = 5;
    return g;
  };

  SpellBrigadeGame.prototype._spawnPool = function (x, y, radius, dps, life, color) {
    var p = takeSlot(this.pools, MAX_POOLS, function () { return {}; });
    p.x = x; p.y = y;
    p.r = radius || 40;
    p.dps = dps || 6;
    p.life = p.maxLife = life || 4;
    p.tick = 0;
    p.color = color || ELEM.acid.color;
    p.phase = rand(0, TAU);
    p.bubble = 0;
    return p;
  };

  SpellBrigadeGame.prototype._spawnMeteor = function (x, y, dmg, radius) {
    var m = takeSlot(this.meteors, 10, function () { return {}; });
    m.x = x; m.y = y;
    m.t = 0.55;
    m.dmg = dmg;
    m.r = radius || 80;
    m.seed = rand(0, TAU);
    return m;
  };

  SpellBrigadeGame.prototype._hitSpark = function (x, y, element) {
    var el = ELEM[element] || ELEM.fire;
    this._burst(x, y, 4, [el.color, el.glow], { speed: 150, life: 0.24, size: 2.2, glow: true });
  };

  SpellBrigadeGame.prototype._chainLightning = function (source, dmg, hops, excludeUids) {
    var excludes = excludeUids || [];
    excludes.push(source.uid);
    var fromX = source.x, fromY = source.y;
    for (var h = 0; h < hops; h++) {
      var best = null, bd = 210 * 210;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (!e.active) continue;
        if (excludes.indexOf(e.uid) >= 0) continue;
        var d = dist2(fromX, fromY, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) break;
      excludes.push(best.uid);
      this._spawnArc(fromX, fromY, best.x, best.y, ELEM.lightning.glow, 0.18, 2.4);
      this._spawnArc(fromX, fromY, best.x, best.y, ELEM.lightning.color, 0.24, 4);
      this._hitEnemy(best, dmg, 'lightning', { angle: angleTo(fromX, fromY, best.x, best.y), noChain: true });
      this._burst(best.x, best.y, 3, ELEM.lightning.glow, { speed: 120, life: 0.2, size: 2, glow: true });
      fromX = best.x; fromY = best.y;
    }
  };

  /* ============================================================
     timeline / waves / boss
     ============================================================ */
  SpellBrigadeGame.prototype._syncTimeline = function () {
    if (this.state !== 'running') return;
    if (this.time >= TIME_LIMIT) {
      this._endGame('victory');
      return;
    }
    var waves = (this.data.meta && this.data.meta.waves) || [];
    while (this.waveIndex + 1 < waves.length && this.time >= waves[this.waveIndex + 1].at) {
      this.waveIndex++;
      var w = waves[this.waveIndex];
      this.wave = this.waveIndex + 1;
      this.waveName = w.name;
      this.waveSub = w.sub;
      this._sfx('wave');
      this.screenFlash = Math.max(this.screenFlash, 0.14);
      this.shake = Math.max(this.shake, 2.5);
      this._ringFx(this.player.x, this.player.y, '#ffd166', 20, 260, 0.6, 4);
      this._emitEvent('wave', { index: this.wave, name: this.waveName, sub: this.waveSub, time: Math.floor(this.time) });
      this.emitHud(true);
    }
    if (!this.bossSpawned && this.time >= BOSS_TIME) this.spawnBoss();
  };

  SpellBrigadeGame.prototype.spawnBoss = function () {
    if (this.bossSpawned) return;
    var p = this.player;
    if (!p) return;
    this.bossSpawned = true;
    var angle = -Math.PI / 2 + rand(-0.5, 0.5);
    var bx = clamp(p.x + Math.cos(angle) * 320, 160, WORLD.w - 160);
    var by = clamp(p.y + Math.sin(angle) * 320, 160, WORLD.h - 160);
    var hp = Math.round(1900 * (this.diff.enemyScale || 1));
    this.boss = {
      isBoss: true, alive: true, name: this.bossName,
      x: bx, y: by, vx: 0, vy: 0, r: 64,
      hp: hp, maxHp: hp,
      speed: 54, facing: 1,
      anim: 0, hurtT: 0, introT: 3.0, state: 'intro', stateT: 3.0,
      actionIndex: 0, actionCd: 1.4, volleyTimer: 0, volleys: 0,
      chargeX: 0, chargeY: 0, enraged: false, touchCd: 0,
      uid: -1, kx: 0, ky: 0, slowT: 0, freezeT: 0, burnT: 0, burnDps: 0
    };
    this.bossIntro = 3.0;
    this.bossIntroMax = 3.0;
    this.shake = Math.max(this.shake, 15);
    this.camZoom = 1.09;
    this._sfx('boss-roar');
    this._emitEvent('boss', { name: this.boss.name, hp: this.boss.hp, maxHp: this.boss.maxHp });
    this._burst(bx, by, 30, ['#c9a0ff', '#ff5d8f', '#ffd166'], { speed: 200, life: 0.9, size: 4, glow: true, jitter: 20 });
    this._ringFx(bx, by, '#c9a0ff', 14, 190, 0.8, 6);
    this._ringFx(bx, by, '#ff5d8f', 30, 320, 1.0, 7);
    this._ringFx(bx, by, '#ffd166', 60, 420, 1.1, 5);
    this.screenFlash = Math.max(this.screenFlash, 0.2);
    this._burst(bx, by, 24, ['#c9a0ff', '#ff5d8f'], { speed: 320, life: 1.0, size: 4, glow: true, jitter: 30 });
    if (p) {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2);
      p.invuln = Math.max(p.invuln, 1.0);
      this._ringFx(p.x, p.y, '#ffd166', 12, 130, 0.7, 4);
      this._burst(p.x, p.y - 8, 20, ['#ffd166', '#fff4d8'], { speed: 150, life: 0.7, size: 3, glow: true });
    }
    // entrance shockwave: shove the horde back and evaporate enemy fire
    for (var ei = 0; ei < this.enemies.length; ei++) {
      var en = this.enemies[ei];
      if (!en.active) continue;
      var da = angleTo(bx, by, en.x, en.y);
      var dd = dist(bx, by, en.x, en.y) || 1;
      var push = Math.max(0, 170 - dd) * 1.2;
      en.x = clamp(en.x + Math.cos(da) * push, 40, WORLD.w - 40);
      en.y = clamp(en.y + Math.sin(da) * push, 40, WORLD.h - 40);
      en.hurtT = 0.12;
    }
    for (var pj = 0; pj < this.projectiles.length; pj++) {
      var prj = this.projectiles[pj];
      if (!prj.active || prj.friendly) continue;
      prj.active = false;
      this._burst(prj.x, prj.y, 3, ['#c9a0ff', '#fff4d8'], { speed: 90, life: 0.3, size: 2.4, glow: true });
    }
    this.emitHud(true);
  };

  /* ============================================================
     spawner / enemies
     ============================================================ */
  SpellBrigadeGame.prototype._rollSpawn = function () {
    var t = this.time;
    var types = ['crawler'];
    if (t >= 14) types.push('bat');
    if (t >= 42) types.push('brute');
    if (t >= 54) types.push('eye');
    var weights = { crawler: 1, bat: 0.72, brute: 0.3, eye: 0.42 };
    var total = 0, i;
    for (i = 0; i < types.length; i++) total += weights[types[i]];
    var roll = Math.random() * total;
    var type = types[0];
    for (i = 0; i < types.length; i++) {
      roll -= weights[types[i]];
      if (roll <= 0) { type = types[i]; break; }
    }
    var eliteChance = 0;
    if (t >= 75) eliteChance = Math.min(0.14, 0.045 + (t - 75) / 150 * 0.12);
    return { type: type, elite: Math.random() < eliteChance };
  };

  SpellBrigadeGame.prototype._spawnEnemyAt = function (type, x, y, elite) {
    var base = ENEMY_BASE[type] || ENEMY_BASE.crawler;
    var t = this.time;
    var scale = (0.9 + (t / 150) * 1.42) * (this.diff.enemyScale || 1);
    var e = takeSlot(this.enemies, MAX_ENEMIES, function () { return {}; });
    e.uid = this._nextUid = (this._nextUid || 1) + 1;
    e.kind = type;
    e.elite = !!elite;
    e.r = base.r * (elite ? 1.3 : 1);
    e.maxHp = Math.round(base.hp * scale * (elite ? 2.35 : 1));
    e.hp = e.maxHp;
    e.speed = base.speed * (0.9 + (t / 150) * 0.36) * (elite ? 1.05 : 1);
    e.dmg = base.dmg * (0.7 + (t / 150) * 0.42) * (this.diff.enemyDamage || 1) * (elite ? 1.06 : 1);
    e.xp = Math.round(base.xp * (elite ? 3 : 1) * (1 + t / 150 * 0.35));
    e.score = base.score * (elite ? 3 : 1);
    e.x = clamp(x, 50, WORLD.w - 50);
    e.y = clamp(y, 50, WORLD.h - 50);
    e.vx = 0; e.vy = 0; e.kx = 0; e.ky = 0;
    e.slowT = 0; e.freezeT = 0; e.burnT = 0; e.burnDps = 0;
    e.touchCd = 0; e.hurtT = 0; e.anim = rand(0, 10); e.wob = rand(0, TAU);
    e.fireTimer = rand(0.8, 2.2);
    e.state = 'walk'; e.stateT = 0; e.chargeCd = rand(1.4, 3.2);
    e.facing = 1;
    return e;
  };

  SpellBrigadeGame.prototype._spawnSquad = function (n) {
    var p = this.player;
    if (!p) return;
    var cam = this.cam;
    var halfW = this.vw / (2 * this.scale);
    var halfH = this.vh / (2 * this.scale);
    var radius = Math.max(halfW, halfH) + rand(50, 130);
    for (var i = 0; i < n; i++) {
      var ang = rand(0, TAU);
      var r = radius * rand(0.92, 1.15);
      var x = cam.x + Math.cos(ang) * r;
      var y = cam.y + Math.sin(ang) * r;
      x = clamp(x, 60, WORLD.w - 60);
      y = clamp(y, 60, WORLD.h - 60);
      if (dist(x, y, p.x, p.y) < 190) {
        ang += Math.PI;
        x = clamp(cam.x + Math.cos(ang) * r, 60, WORLD.w - 60);
        y = clamp(cam.y + Math.sin(ang) * r, 60, WORLD.h - 60);
      }
      var roll = this._rollSpawn();
      this._spawnEnemyAt(roll.type, x, y, roll.elite);
    }
  };

  SpellBrigadeGame.prototype._spawnPosition = function () {
    var cam = this.cam;
    var zoom = this.camZoom || 1;
    var halfW = this.vw / (2 * this.scale * zoom);
    var halfH = this.vh / (2 * this.scale * zoom);
    var side = Math.floor(Math.random() * 4);
    var pad = rand(16, 70);
    var x, y;
    if (side === 0) { y = cam.y - halfH - pad; x = cam.x + rand(-halfW, halfW); }
    else if (side === 1) { y = cam.y + halfH + pad; x = cam.x + rand(-halfW, halfW); }
    else if (side === 2) { x = cam.x - halfW - pad; y = cam.y + rand(-halfH, halfH); }
    else { x = cam.x + halfW + pad; y = cam.y + rand(-halfH, halfH); }
    // if the world edge clamps us back into the frame, push to the opposite side instead
    var cx = clamp(x, 50, WORLD.w - 50);
    var cy = clamp(y, 50, WORLD.h - 50);
    if (dist2(cx, cy, cam.x, cam.y) < (halfW + halfH) * 0.22) {
      cx = clamp(WORLD.w - cx, 50, WORLD.w - 50);
      cy = clamp(WORLD.h - cy, 50, WORLD.h - 50);
    }
    return { x: cx, y: cy };
  };

  SpellBrigadeGame.prototype._spawnOne = function (forceType, elite) {
    var roll = forceType ? { type: forceType, elite: !!elite } : this._rollSpawn();
    if (elite) roll.elite = true;
    var pos = this._spawnPosition();
    return this._spawnEnemyAt(roll.type, pos.x, pos.y, roll.elite);
  };

  SpellBrigadeGame.prototype._updateSpawner = function (dt) {
    if (this.boss && this.boss.alive && this.boss.introT > 0) return;
    var t = this.time;
    var diffSpawn = this.diff.spawnScale || 1;
    var desired = Math.round((8 + t * 0.56) * (0.86 + diffSpawn * 0.14));
    desired = clamp(desired, 8, 98);
    if (this.boss && this.boss.alive) desired = Math.round(desired * 0.5);
    var alive = this._enemyCount();
    var interval = clamp(0.8 - t * 0.0028, 0.36, 0.8) / diffSpawn;
    if (alive < desired * 0.5) interval *= 0.5;
    else if (alive < desired * 0.82) interval *= 0.72;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = interval * rand(0.7, 1.25);
    var deficit = desired - alive;
    if (deficit <= 0) return;
    var count = clamp(Math.round(deficit / 6) + 1, 1, 6);
    for (var i = 0; i < count; i++) {
      if (this._enemyCount() >= MAX_ENEMIES) break;
      this._spawnOne();
    }
    if (t > 70 && Math.random() < 0.09 && this._enemyCount() < MAX_ENEMIES) {
      this._spawnOne(undefined, true);
    }
  };
  SpellBrigadeGame.prototype._hitEnemy = function (e, dmg, element, opts) {
    if (!e || !e.active) return;
    opts = opts || {};
    var p = this.player;
    var effect = (p && p.mods.effect) || 1;
    e.hp -= dmg;
    e.hurtT = 0.1;
    this.damageDealt += dmg;
    var col = (ELEM[element] || ELEM.fire).glow;
    this._spawnNumber(
      e.x + rand(-12, 12), e.y - e.r - 4,
      Math.round(dmg), opts.crit ? '#ffd166' : col, opts.crit
    );
    if (opts.angle !== undefined && !opts.noKnock) {
      var kb = opts.knock !== undefined ? opts.knock : (e.kind === 'brute' ? 22 : 44);
      e.kx += Math.cos(opts.angle) * kb;
      e.ky += Math.sin(opts.angle) * kb;
    }
    if (element === 'fire' && !opts.noChain) {
      e.burnT = Math.max(e.burnT, 2.2 * effect);
      e.burnDps = Math.max(e.burnDps, dmg * 0.14 * effect);
    } else if (element === 'ice') {
      e.slowT = Math.max(e.slowT, 1.9 * effect);
      if (Math.random() < 0.1 * effect) e.freezeT = Math.max(e.freezeT, 0.75 * effect);
    } else if (element === 'lightning' && !opts.noChain) {
      this._chainLightning(e, dmg * 0.45 * effect, 1, []);
    }
    this._hitSpark(e.x, e.y - e.r * 0.3, element);
    this._sfxThrottled('hit', 70);
    if (e.hp <= 0) this._killEnemy(e);
  };

  SpellBrigadeGame.prototype._areaDamage = function (x, y, radius, dmg, element, opts) {
    opts = opts || {};
    var r2 = radius * radius;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.active) continue;
      if (dist2(x, y, e.x, e.y) < r2 + e.r * e.r) {
        this._hitEnemy(e, dmg, element, {
          angle: opts.noKnock ? undefined : angleTo(x, y, e.x, e.y),
          noChain: opts.noChain !== false,
          noKnock: !!opts.noKnock
        });
      }
    }
    var b = this.boss;
    if (b && b.alive && b.introT <= 0 && dist2(x, y, b.x, b.y) < r2 + b.r * b.r) {
      this._damageBoss(dmg, element, { angle: angleTo(x, y, b.x, b.y) });
    }
  };

  SpellBrigadeGame.prototype._killEnemy = function (e) {
    if (!e.active) return;
    e.active = false;
    this.kills++;
    var el = ELEM.fire;
    var color = e.kind === 'bat' ? '#c9a0ff' : e.kind === 'eye' ? '#74e4ff' : e.kind === 'brute' ? '#ffb02e' : '#abff5c';
    this._burst(e.x, e.y, e.elite ? 18 : 11, [color, '#fff4d8'], { speed: rand(50, 180), life: rand(0.3, 0.7), size: rand(2, 4), glow: true, jitter: e.r * 0.5 });
    this._ringFx(e.x, e.y, color, 4, e.r * 2.6, 0.32, 2.5);
    this._sfxThrottled('enemy-die', 90);
    // loot
    var total = Math.max(1, e.xp);
    var gems = e.elite ? 3 : total > 10 ? 2 : 1;
    var each = Math.max(1, Math.round(total / gems));
    for (var i = 0; i < gems; i++) {
      this._spawnGem(e.x + rand(-10, 10), e.y + rand(-10, 10), i === 0 ? total - each * (gems - 1) : each);
    }
    if (e.elite) {
      this.shake = Math.max(this.shake, 3);
      this._burst(e.x, e.y, 10, '#ffd166', { speed: 120, life: 0.7, size: 3, glow: true });
    }
  };

  SpellBrigadeGame.prototype._damageBoss = function (dmg, element, opts) {
    var b = this.boss;
    if (!b || !b.alive) return;
    opts = opts || {};
    b.hp -= dmg;
    b.hurtT = 0.08;
    this.damageDealt += dmg;
    this._spawnNumber(b.x + rand(-16, 16), b.y - b.r - 8, Math.round(dmg), opts.crit ? '#ffd166' : (ELEM[element] || ELEM.fire).glow, !!opts.crit);
    if (element === 'fire') { b.burnT = Math.max(b.burnT, 2); b.burnDps = Math.max(b.burnDps, dmg * 0.1); }
    if (opts.angle !== undefined) { b.kx += Math.cos(opts.angle) * 8; b.ky += Math.sin(opts.angle) * 8; }
    this._hitSpark(b.x + rand(-20, 20), b.y + rand(-20, 20), element);
    if (!b.enraged && b.hp <= b.maxHp * 0.5) {
      b.enraged = true;
      b.speed += 16;
      this.shake = Math.max(this.shake, 7);
      this._ringFx(b.x, b.y, '#ff5d8f', 14, 220, 0.7, 6);
      this._burst(b.x, b.y, 26, ['#ff5d8f', '#c9a0ff'], { speed: 180, life: 0.8, size: 4, glow: true });
      this._emitEvent('toast', { text: '梦魇领主陷入狂怒！', sub: 'NIGHTMARE ENRAGED', kind: 'danger' });
      this._sfx('boss-roar');
    }
    if (b.hp <= 0) this._killBoss();
  };

  SpellBrigadeGame.prototype._killBoss = function () {
    var b = this.boss;
    if (!b || !b.alive) return;
    b.alive = false;
    b.hp = 0;
    this.bossKilled = true;
    this.bossBonus += 1500;
    this.kills += 1;
    this.shake = Math.max(this.shake, 13);
    this.camZoom = 1.07;
    this._sfx('enemy-die');
    this._burst(b.x, b.y, 46, ['#c9a0ff', '#ff5d8f', '#ffd166', '#74e4ff'], { speed: 260, life: 1.1, size: 5, glow: true, jitter: 24 });
    this._ringFx(b.x, b.y, '#ff5d8f', 20, 300, 0.9, 8);
    this._ringFx(b.x, b.y, '#ffd166', 10, 220, 0.7, 5);
    for (var i = 0; i < 6; i++) this._spawnGem(b.x + rand(-50, 50), b.y + rand(-40, 40), 30);
    this._emitEvent('toast', { text: '梦魇领主 被击退！', sub: 'NIGHTMARE BANISHED · +1500', kind: 'victory' });
    this.emitHud(true);
  };

  /* ============================================================
     player / allies / weapons
     ============================================================ */
  SpellBrigadeGame.prototype._startDash = function () {
    var p = this.player;
    if (!p) return;
    var dx = this.moveX, dy = this.moveY;
    if (!dx && !dy) {
      dx = Math.cos(p.aim);
      dy = Math.sin(p.aim);
      if (!dx && !dy) { dy = 1; dx = 0; }
    }
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;
    this.dashDirX = dx;
    this.dashDirY = dy;
    this.dashT = 0.16;
    this.dashSpeed = 640 * (p.mods.dashPower || 1);
    this.dashCd = this.dashMax;
    p.invuln = Math.max(p.invuln, 0.26);
    this._sfx('dash');
    this.shake = Math.max(this.shake, 2);
    this._burst(p.x, p.y, 10, [ELEM[p.element].color, '#fff4d8'], { speed: 120, life: 0.35, size: 3, glow: true, angle: Math.atan2(-dy, -dx), spread: 0.6 });
  };

  SpellBrigadeGame.prototype._updatePlayer = function (dt) {
    var p = this.player;
    if (!p) return;
    var mods = p.mods;
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);

    if (this.dashQueued) {
      this.dashQueued = false;
      if (this.dashCd <= 0 && p.hp > 0) this._startDash();
    }

    var moving = false;
    if (this.dashT > 0) {
      this.dashT -= dt;
      p.x += this.dashDirX * this.dashSpeed * dt;
      p.y += this.dashDirY * this.dashSpeed * dt;
      moving = true;
      if (Math.random() < 0.7) {
        this._burst(p.x, p.y, 1, [ELEM[p.element].color, ELEM[p.element].glow], {
          speed: 18, life: 0.3, size: 4, glow: true, jitter: 5
        });
      }
    } else {
      var tvx = this.moveX * p.speed * mods.speed;
      var tvy = this.moveY * p.speed * mods.speed;
      p.vx = damp(p.vx, tvx, 15, dt);
      p.vy = damp(p.vy, tvy, 15, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      moving = Math.abs(p.vx) + Math.abs(p.vy) > 22;
    }
    p.x = clamp(p.x, 34, WORLD.w - 34);
    p.y = clamp(p.y, 34, WORLD.h - 34);

    if (moving) {
      p.walk += dt * (this.dashT > 0 ? 24 : 11);
      if (Math.random() < dt * 9) {
        this._burst(p.x + rand(-5, 5), p.y + rand(0, 3), 1, [ELEM[p.element].color, ELEM[p.element].glow], { speed: 10, life: 0.55, size: 2.4, glow: true, lift: 10 });
      }
    }
    if (this.moveX) p.facing = this.moveX > 0 ? 1 : -1;

    var target = this._nearestEnemy(p.x, p.y, 600);
    if (target) {
      p.aim = angleTo(p.x, p.y, target.x, target.y);
      if (!this.moveX && Math.abs(p.vx) < 30) p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
    }

    if (mods.regen > 0 && p.hp < p.maxHp) {
      p.regenAcc += mods.regen * dt;
      if (p.regenAcc >= 1) {
        var heal = Math.floor(p.regenAcc);
        p.regenAcc -= heal;
        p.hp = Math.min(p.maxHp, p.hp + heal);
      }
    }
    if (mods.shieldMax > 0 && p.shield < mods.shieldMax) {
      p.shieldTimer += dt;
      if (p.shieldTimer >= 18) {
        p.shieldTimer = 0;
        p.shield++;
        this._ringFx(p.x, p.y, ELEM.ice.glow, 10, 52, 0.4, 2.5);
        this._burst(p.x, p.y - 10, 6, '#74e4ff', { speed: 60, life: 0.4, size: 2, glow: true });
      }
    }
  };

  SpellBrigadeGame.prototype._fireBase = function (w) {
    var p = this.player;
    var target = this._nearestEnemy(p.x, p.y, 600);
    if (!target) return false;
    var info = this._baseWeaponInfo(w);
    var mods = p.mods;
    var ang = angleTo(p.x, p.y, target.x, target.y);
    p.aim = ang;
    var count = 2 + (mods.shots || 0);
    var spread = 0.1;
    var area = mods.area;
    for (var i = 0; i < count; i++) {
      var a = ang + (i - (count - 1) / 2) * spread;
      this._spawnProj({
        x: p.x + Math.cos(a) * 20,
        y: p.y - 8 + Math.sin(a) * 20,
        angle: a,
        speed: info.speed,
        dmg: info.dmg * mods.dmg * 0.62,
        element: w.element,
        friendly: true,
        kind: w.element,
        pierce: mods.pierce,
        r: (w.element === 'fire' ? 6 : w.element === 'acid' ? 6.5 : 5) * Math.sqrt(area),
        life: 1.5,
        crit: mods.crit,
        critMult: mods.critMult,
        glow: true
      });
    }
    this._sfxThrottled(ELEM[w.element].shoot, 90);
    var el = ELEM[w.element];
    var mzx = p.x + Math.cos(ang) * 22;
    var mzy = p.y - 8 + Math.sin(ang) * 22;
    this._burst(mzx, mzy, 7, [el.color, el.glow, '#fff4d8'], {
      speed: 130, life: 0.24, size: 3, glow: true, angle: ang, spread: 0.7
    });
    this._ringFx(mzx, mzy, el.glow, 2, 24 * Math.sqrt(area), 0.18, 2.2);
    return true;
  };

  SpellBrigadeGame.prototype._orbBladeTick = function (w) {
    var p = this.player;
    var mods = p.mods;
    var blades = 1 + w.level;
    var radius = (60 + w.level * 6) * Math.sqrt(mods.area);
    var dmg = (12 + 6 * w.level) * mods.dmg;
    var baseAng = this.uiTime * 2.4;
    var hitAny = false;
    for (var e = 0; e < this.enemies.length; e++) {
      var en = this.enemies[e];
      if (!en.active) continue;
      for (var b = 0; b < blades; b++) {
        var ba = baseAng + (b / blades) * TAU;
        var bx = p.x + Math.cos(ba) * radius;
        var by = p.y + Math.sin(ba) * radius * 0.72;
        if (dist2(bx, by, en.x, en.y) < (18 + en.r) * (18 + en.r)) {
          this._hitEnemy(en, dmg, 'lightning', { angle: ba, crit: Math.random() < mods.crit, knock: 34, noChain: true });
          this._spawnArc(bx, by, en.x, en.y, '#ffe14d', 0.12, 2);
          hitAny = true;
          break;
        }
      }
    }
    var boss = this.boss;
    if (boss && boss.alive && boss.introT <= 0) {
      for (var b2 = 0; b2 < blades; b2++) {
        var ba2 = baseAng + (b2 / blades) * TAU;
        var bx2 = p.x + Math.cos(ba2) * radius;
        var by2 = p.y + Math.sin(ba2) * radius * 0.72;
        if (dist2(bx2, by2, boss.x, boss.y) < (18 + boss.r) * (18 + boss.r)) {
          this._damageBoss(dmg, 'lightning', { angle: ba2 });
          break;
        }
      }
    }
    if (hitAny) this._sfxThrottled('hit', 110);
  };

  SpellBrigadeGame.prototype._necroTick = function (w) {
    var p = this.player;
    var mods = p.mods;
    var radius = (74 + w.level * 10) * Math.sqrt(mods.area);
    var dmg = (8 + 3 * w.level) * mods.dmg;
    var r2 = radius * radius;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.active) continue;
      if (dist2(p.x, p.y, e.x, e.y) < r2 + e.r * e.r) {
        this._hitEnemy(e, dmg, 'acid', { angle: angleTo(p.x, p.y, e.x, e.y), knock: 18, noChain: true });
        e.slowT = Math.max(e.slowT, 0.6);
      }
    }
    var b = this.boss;
    if (b && b.alive && b.introT <= 0 && dist2(p.x, p.y, b.x, b.y) < r2 + b.r * b.r) {
      this._damageBoss(dmg, 'acid', {});
    }
    // swirling soul particles
    for (var s = 0; s < 2; s++) {
      var a = this.uiTime * 3.2 + rand(0, TAU);
      var rr = radius * rand(0.4, 1);
      this._burst(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * 0.8, 1, ['#abff5c', '#c9a0ff'], {
        speed: 14, life: 0.45, size: 2.6, glow: true
      });
    }
  };

  SpellBrigadeGame.prototype._castChain = function (w) {
    var p = this.player;
    var mods = p.mods;
    var target = this._nearestEnemy(p.x, p.y, 620);
    if (!target) return;
    var dmg = (20 + 8 * w.level) * mods.dmg;
    var hops = 2 + w.level;
    var excludes = [];
    var fromX = p.x, fromY = p.y - 8;
    var cur = target;
    for (var h = 0; h < hops && cur; h++) {
      this._spawnArc(fromX, fromY, cur.x, cur.y, '#fff9c9', 0.16, 2);
      this._spawnArc(fromX, fromY, cur.x, cur.y, '#ffe14d', 0.22, 3.4);
      this._hitEnemy(cur, dmg, 'lightning', { angle: angleTo(fromX, fromY, cur.x, cur.y), noChain: true, crit: Math.random() < mods.crit });
      this._burst(cur.x, cur.y, 6, '#fff9c9', { speed: 130, life: 0.25, size: 2.6, glow: true });
      excludes.push(cur.uid);
      fromX = cur.x; fromY = cur.y;
      cur = null;
      var bd = 240 * 240;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (!e.active || excludes.indexOf(e.uid) >= 0) continue;
        var d = dist2(fromX, fromY, e.x, e.y);
        if (d < bd) { bd = d; cur = e; }
      }
      if (this.boss && this.boss.alive && this.boss.introT <= 0) {
        var bd2 = dist2(fromX, fromY, this.boss.x, this.boss.y);
        if (bd2 < bd) { cur = null; }
      }
      dmg *= 0.78;
    }
    this._sfxThrottled('shoot-lightning', 140);
  };

  SpellBrigadeGame.prototype._castNova = function (w) {
    var p = this.player;
    var mods = p.mods;
    var radius = (110 + 16 * w.level) * Math.sqrt(mods.area);
    var dmg = (22 + 10 * w.level) * mods.dmg;
    this._ringFx(p.x, p.y, '#d7fbff', 16, radius, 0.5, 5);
    this._ringFx(p.x, p.y, '#74e4ff', 10, radius * 0.75, 0.4, 3);
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.active) continue;
      if (dist2(p.x, p.y, e.x, e.y) < radius * radius) {
        this._hitEnemy(e, dmg, 'ice', { angle: angleTo(p.x, p.y, e.x, e.y), knock: 50 });
        e.freezeT = Math.max(e.freezeT, 0.5);
      }
    }
    var b = this.boss;
    if (b && b.alive && b.introT <= 0 && dist2(p.x, p.y, b.x, b.y) < radius * radius) {
      this._damageBoss(dmg, 'ice', {});
    }
    this._burst(p.x, p.y, 18, ['#74e4ff', '#d7fbff', '#ffffff'], { speed: 220, life: 0.5, size: 3, glow: true });
    this._sfxThrottled('shoot-ice', 160);
  };

  SpellBrigadeGame.prototype._castAcidField = function (w) {
    var p = this.player;
    var target = this._nearestEnemy(p.x, p.y, 600);
    if (!target) return;
    var radius = (46 + 8 * w.level) * Math.sqrt(p.mods.area);
    var dps = (7 + 3 * w.level) * p.mods.dmg;
    this._spawnPool(target.x, target.y, radius, dps, 4, '#abff5c');
    this._burst(target.x, target.y, 12, ['#abff5c', '#ecffd2'], { speed: 140, life: 0.5, size: 3, glow: true });
    this._sfxThrottled('shoot-acid', 160);
  };

  SpellBrigadeGame.prototype._castStarfall = function (w) {
    var p = this.player;
    var target = this._nearestEnemy(p.x, p.y, 620);
    if (!target) return;
    var dmg = (60 + 30 * w.level) * p.mods.dmg;
    var radius = (70 + 10 * w.level) * Math.sqrt(p.mods.area);
    this._spawnMeteor(target.x, target.y, dmg, radius);
    this._sfxThrottled('shoot-fire', 150);
  };

  SpellBrigadeGame.prototype._updateWeapons = function (dt) {
    var p = this.player;
    if (!p) return;
    for (var i = 0; i < p.weapons.length; i++) {
      var w = p.weapons[i];
      if (w.type === 'base') {
        w.timer -= dt;
        if (w.timer <= 0) {
          if (this._fireBase(w)) w.timer = this._baseWeaponInfo(w).cd * p.mods.cd;
          else w.timer = 0.12;
        }
      } else if (w.type === 'orb') {
        w.tick -= dt;
        if (w.tick <= 0) { w.tick = 0.3; this._orbBladeTick(w); }
      } else if (w.type === 'necro') {
        w.tick -= dt;
        if (w.tick <= 0) { w.tick = 0.45; this._necroTick(w); }
      } else if (w.type === 'chain') {
        w.timer -= dt;
        if (w.timer <= 0) {
          w.timer = Math.max(0.75, 1.7 - 0.12 * w.level) * p.mods.cd;
          this._castChain(w);
        }
      } else if (w.type === 'nova') {
        w.timer -= dt;
        if (w.timer <= 0) {
          w.timer = Math.max(1.3, 2.8 - 0.2 * w.level) * p.mods.cd;
          this._castNova(w);
        }
      } else if (w.type === 'acid') {
        w.timer -= dt;
        if (w.timer <= 0) {
          w.timer = Math.max(1.2, 2.4 - 0.15 * w.level) * p.mods.cd;
          this._castAcidField(w);
        }
      } else if (w.type === 'star') {
        w.timer -= dt;
        if (w.timer <= 0) {
          w.timer = Math.max(1.8, 3.4 - 0.2 * w.level) * p.mods.cd;
          this._castStarfall(w);
        }
      }
    }
  };

  SpellBrigadeGame.prototype._updateAllies = function (dt) {
    var p = this.player;
    var mods = p.mods;
    for (var i = 0; i < this.allies.length; i++) {
      var a = this.allies[i];
      a.hurtT = Math.max(0, a.hurtT - dt);
      a.invuln = Math.max(0, a.invuln - dt);
      if (a.down) {
        a.reviveT -= dt;
        if (a.reviveT <= 0) {
          a.down = false;
          a.hp = Math.round(a.maxHp * 0.6);
          a.invuln = 1.6;
          a.x = clamp(p.x + a.formation.x, 40, WORLD.w - 40);
          a.y = clamp(p.y + a.formation.y, 40, WORLD.h - 40);
          this._ringFx(a.x, a.y, ELEM[a.element].glow, 8, 80, 0.5, 3);
          this._burst(a.x, a.y, 16, [ELEM[a.element].color, '#fff4d8'], { speed: 120, life: 0.5, size: 3, glow: true });
          this._sfx('pickup');
          this._emitEvent('toast', { text: a.character.name + ' 归队了', kind: 'info' });
        }
        continue;
      }
      var tx = p.x + a.formation.x;
      var ty = p.y + a.formation.y;
      tx += Math.cos(this.uiTime * 0.9 + a.slot * 2.1) * 9;
      ty += Math.sin(this.uiTime * 0.7 + a.slot * 1.7) * 7;
      tx = clamp(tx, 34, WORLD.w - 34);
      ty = clamp(ty, 34, WORLD.h - 34);
      var dx = tx - a.x, dy = ty - a.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      var spd = a.speed * (d > 220 ? 1.7 : 1);
      if (d > 2) {
        a.vx = damp(a.vx, (dx / d) * spd, 8, dt);
        a.vy = damp(a.vy, (dy / d) * spd, 8, dt);
      } else {
        a.vx = damp(a.vx, 0, 10, dt);
        a.vy = damp(a.vy, 0, 10, dt);
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (d > 820) {
        a.x = tx; a.y = ty;
        this._burst(a.x, a.y, 8, ELEM[a.element].glow, { speed: 70, life: 0.35, size: 2.5, glow: true });
      }
      a.x = clamp(a.x, 30, WORLD.w - 30);
      a.y = clamp(a.y, 30, WORLD.h - 30);
      if (Math.abs(a.vx) > 16) a.walk += dt * 10;
      if ((Math.abs(a.vx) + Math.abs(a.vy)) > 26 && Math.random() < dt * 6) {
        this._burst(a.x + rand(-4, 4), a.y + rand(0, 3), 1, [ELEM[a.element].color, ELEM[a.element].glow], { speed: 8, life: 0.5, size: 2, glow: true, lift: 8 });
      }
      if (a.vx) a.facing = a.vx > 0 ? 1 : -1;
      var target = this._nearestEnemy(a.x, a.y, 520);
      if (target) {
        a.aim = angleTo(a.x, a.y, target.x, target.y);
        a.fireTimer -= dt / (mods.allyRate || 1);
        if (a.fireTimer <= 0) {
          this._allyFire(a, target);
          a.fireTimer = 1.05 * (mods.allyRate || 1) * rand(0.85, 1.15);
        }
      } else {
        a.aim = angleTo(a.x, a.y, p.x, p.y);
      }
    }
    // gentle ally separation
    for (var x = 0; x < this.allies.length; x++) {
      for (var y = x + 1; y < this.allies.length; y++) {
        var a1 = this.allies[x], a2 = this.allies[y];
        if (a1.down || a2.down) continue;
        var ddx = a2.x - a1.x, ddy = a2.y - a1.y;
        var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        if (dd < 30) {
          var push = (30 - dd) * 0.5;
          a1.x -= (ddx / dd) * push; a1.y -= (ddy / dd) * push;
          a2.x += (ddx / dd) * push; a2.y += (ddy / dd) * push;
        }
      }
    }
  };

  SpellBrigadeGame.prototype._allyFire = function (a, target) {
    var p = this.player;
    var mods = p.mods;
    var ang = angleTo(a.x, a.y, target.x, target.y);
    var dmg = (9 + this.time * 0.07) * (a.dmgScale || 0.6) * (mods.allyDmg || 1) * mods.dmg * 0.74;
    var el = a.element;
    var speed = el === 'lightning' ? 640 : el === 'fire' ? 520 : el === 'acid' ? 430 : 500;
    this._spawnProj({
      x: a.x + Math.cos(ang) * 16,
      y: a.y - 8 + Math.sin(ang) * 16,
      angle: ang,
      speed: speed,
      dmg: dmg,
      element: el,
      friendly: true,
      kind: el,
      pierce: 0,
      r: 4.2,
      life: 1.2,
      crit: 0.04,
      critMult: 1.6,
      glow: true
    });
    this._burst(a.x + Math.cos(ang) * 16, a.y - 8 + Math.sin(ang) * 16, 2, [ELEM[el].color, ELEM[el].glow], {
      speed: 50, life: 0.18, size: 2, glow: true, angle: ang, spread: 0.4
    });
  };

  /* (continues below) */
  /* ============================================================
     enemies / boss update
     ============================================================ */
  SpellBrigadeGame.prototype._enemyTouch = function (e) {
    var p = this.player;
    var r2;
    var i;
    if (p && p.hp > 0) {
      r2 = e.r + p.r + 2;
      if (dist2(e.x, e.y, p.x, p.y) < r2 * r2) {
        if (e.touchCd <= 0) {
          this._damagePlayer(e.dmg, e.x, e.y);
          e.touchCd = 0.75;
        }
        var a = angleTo(e.x, e.y, p.x, p.y);
        p.vx += Math.cos(a) * 90;
        p.vy += Math.sin(a) * 90;
      }
    }
    for (i = 0; i < this.allies.length; i++) {
      var al = this.allies[i];
      if (al.down) continue;
      r2 = e.r + al.r + 2;
      if (dist2(e.x, e.y, al.x, al.y) < r2 * r2) {
        if (e.touchCd <= 0) {
          this._damageAlly(al, e.dmg, e.x, e.y);
          e.touchCd = 0.75;
        }
        var a2 = angleTo(e.x, e.y, al.x, al.y);
        al.vx += Math.cos(a2) * 70;
        al.vy += Math.sin(a2) * 70;
      }
    }
  };

  SpellBrigadeGame.prototype._damageAlly = function (a, amount, sx, sy) {
    if (!a || a.down || a.invuln > 0) return;
    a.hp -= amount * 0.45;
    a.hurtT = 0.28;
    a.invuln = 0.55;
    this._spawnNumber(a.x, a.y - a.r - 12, '-' + Math.round(amount * 0.62), '#ff9ec4', false);
    this._burst(a.x, a.y, 5, '#ff9ec4', { speed: 70, life: 0.3, size: 2, glow: true });
    if (sx !== undefined) {
      var ang = angleTo(sx, sy, a.x, a.y);
      a.vx += Math.cos(ang) * 80;
      a.vy += Math.sin(ang) * 80;
    }
    if (a.hp <= 0) {
      a.hp = 0;
      a.down = true;
      a.reviveT = this.player.mods.reviveTime || 7;
      this._burst(a.x, a.y, 14, ['#ffffff', '#74e4ff'], { speed: 120, life: 0.6, size: 3, glow: true });
      this._ringFx(a.x, a.y, '#74e4ff', 8, 90, 0.5, 3);
      this._sfxThrottled('hurt', 300);
      this._emitEvent('toast', { text: a.character.name + ' 倒下了', sub: 'REVIVE IN ' + Math.ceil(a.reviveT) + 's', kind: 'danger' });
      this.emitHud(true);
    }
  };

  SpellBrigadeGame.prototype._enemyShoot = function (e, target) {
    var ang = angleTo(e.x, e.y, target.x, target.y);
    var p = this._spawnProj({
      x: e.x, y: e.y - 6, angle: ang,
      speed: 168, dmg: e.dmg, element: 'ice', friendly: false,
      kind: 'enemy', r: 6, life: 3.2, glow: true, color: '#c9a0ff'
    });
    this._burst(e.x, e.y - 6, 4, ['#c9a0ff', '#ff9ec4'], { speed: 60, life: 0.3, size: 2.5, glow: true });
    this._sfxThrottled('shoot-ice', 200);
  };

  SpellBrigadeGame.prototype._updateEnemies = function (dt) {
    var p = this.player;
    if (!p) return;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.active) continue;
      e.anim += dt;
      e.hurtT = Math.max(0, e.hurtT - dt);
      e.slowT = Math.max(0, e.slowT - dt);
      e.freezeT = Math.max(0, e.freezeT - dt);
      e.touchCd = Math.max(0, e.touchCd - dt);
      e.kx = damp(e.kx, 0, 10, dt);
      e.ky = damp(e.ky, 0, 10, dt);

      if (e.burnT > 0) {
        e.burnT -= dt;
        e.burnAcc = (e.burnAcc || 0) + dt;
        while (e.burnAcc >= 0.5) {
          e.burnAcc -= 0.5;
          if (e.burnT > 0) {
            var bd = e.burnDps * 0.5;
            e.hp -= bd;
            this.damageDealt += bd;
            if (Math.random() < 0.4) {
              this._burst(e.x + rand(-8, 8), e.y - rand(0, 14), 1, ['#ff6b3d', '#ffd166'], { speed: 26, life: 0.35, size: 2.4, glow: true, lift: 20 });
            }
            if (e.hp <= 0) { this._killEnemy(e); break; }
          }
        }
        if (!e.active) continue;
      }

      var target = this._nearestTeam(e.x, e.y, true);
      if (!target) target = p;
      var frozen = e.freezeT > 0;
      var slowMul = e.slowT > 0 ? 0.52 : 1;
      var d = dist(e.x, e.y, target.x, target.y);
      var ang = angleTo(e.x, e.y, target.x, target.y);
      var spd = e.speed * slowMul;

      if (e.kind === 'crawler') {
        if (!frozen) ang += Math.sin(e.anim * 4.2 + e.wob) * 0.36;
      } else if (e.kind === 'bat') {
        if (!frozen) {
          ang += Math.sin(e.anim * 7 + e.wob) * 0.72;
          spd *= 1 + Math.sin(e.anim * 5 + e.wob) * 0.2;
        }
      } else if (e.kind === 'eye') {
        if (d > 300) { /* approach */ }
        else if (d < 190) ang += Math.PI;
        else ang += Math.PI / 2 * (Math.sin(e.anim * 0.9 + e.wob) > 0 ? 1 : -1);
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          if (d < 440) {
            this._enemyShoot(e, target);
            e.fireTimer = rand(1.8, 2.6) * Math.max(0.6, 1 - this.time / 150 * 0.35);
          } else {
            e.fireTimer = 0.4;
          }
        }
        spd *= 0.9;
      } else if (e.kind === 'brute') {
        if (e.state === 'wind') {
          e.stateT -= dt;
          spd = 0;
          if (e.stateT <= 0) {
            e.state = 'charge';
            e.stateT = 0.5;
            var ca = angleTo(e.x, e.y, target.x, target.y);
            e.chargeX = Math.cos(ca);
            e.chargeY = Math.sin(ca);
            this._ringFx(e.x, e.y, '#ffb02e', 12, 70, 0.35, 3);
            this._sfxThrottled('dash', 300);
          }
        } else if (e.state === 'charge') {
          e.stateT -= dt;
          e.x += e.chargeX * 330 * dt;
          e.y += e.chargeY * 330 * dt;
          spd = 0;
          if (Math.random() < 0.5) {
            this._burst(e.x, e.y + 8, 1, ['#ffb02e', '#fff4d8'], { speed: 20, life: 0.3, size: 3, glow: true });
          }
          if (e.stateT <= 0) { e.state = 'walk'; e.chargeCd = rand(2.8, 4.2); }
        } else {
          e.chargeCd -= dt;
          if (d < 300 && e.chargeCd <= 0) {
            e.state = 'wind';
            e.stateT = 0.55;
            spd = 0;
          }
        }
      }

      if (!frozen && spd > 0) {
        var tvx = Math.cos(ang) * spd;
        var tvy = Math.sin(ang) * spd;
        e.vx = damp(e.vx, tvx, 4.5, dt);
        e.vy = damp(e.vy, tvy, 4.5, dt);
      } else {
        e.vx = damp(e.vx, 0, 8, dt);
        e.vy = damp(e.vy, 0, 8, dt);
      }
      e.x += (e.vx + e.kx) * dt;
      e.y += (e.vy + e.ky) * dt;
      e.x = clamp(e.x, 30, WORLD.w - 30);
      e.y = clamp(e.y, 30, WORLD.h - 30);
      if (e.vx) e.facing = e.vx > 0 ? 1 : -1;
      this._enemyTouch(e);
    }
  };

  SpellBrigadeGame.prototype._bossVolley = function () {
    var b = this.boss;
    var p = this.player;
    if (!b || !b.alive || !p) return;
    var base = angleTo(b.x, b.y, p.x, p.y - 6);
    var n = b.enraged ? 11 : 9;
    var spread = 1.65;
    for (var i = 0; i < n; i++) {
      var a = base - spread / 2 + (spread / (n - 1)) * i;
      this._spawnProj({
        x: b.x + Math.cos(a) * 30, y: b.y + Math.sin(a) * 30,
        angle: a, speed: b.enraged ? 205 : 180,
        dmg: 8 * (this.diff.enemyDamage || 1), element: 'fire', friendly: false,
        kind: 'enemy', r: 7, life: 3.4, glow: true, color: '#ff5d8f', big: true
      });
    }
    this._burst(b.x, b.y, 10, ['#ff5d8f', '#c9a0ff'], { speed: 140, life: 0.4, size: 3, glow: true, angle: base, spread: 1.2 });
    this._sfxThrottled('shoot-fire', 130);
  };

  SpellBrigadeGame.prototype._bossContact = function () {
    var b = this.boss;
    if (!b || !b.alive) return;
    var p = this.player;
    var i;
    if (p && p.hp > 0) {
      var rr = b.r + p.r;
      if (dist2(b.x, b.y, p.x, p.y) < rr * rr && b.touchCd <= 0) {
        this._damagePlayer(14 * (this.diff.enemyDamage || 1), b.x, b.y);
        b.touchCd = 0.8;
        var a = angleTo(b.x, b.y, p.x, p.y);
        p.vx += Math.cos(a) * 240;
        p.vy += Math.sin(a) * 240;
      }
    }
    for (i = 0; i < this.allies.length; i++) {
      var al = this.allies[i];
      if (al.down) continue;
      rr = b.r + al.r;
      if (dist2(b.x, b.y, al.x, al.y) < rr * rr && b.touchCd <= 0) {
        this._damageAlly(al, 16 * (this.diff.enemyDamage || 1), b.x, b.y);
        b.touchCd = 0.8;
      }
    }
  };

  SpellBrigadeGame.prototype._updateBoss = function (dt) {
    var b = this.boss;
    if (!b || !b.alive) return;
    var p = this.player;
    if (!p) return;
    b.anim += dt;
    b.hurtT = Math.max(0, b.hurtT - dt);
    b.touchCd = Math.max(0, b.touchCd - dt);
    if (Math.random() < dt * 9) {
      this._burst(b.x + rand(-b.r, b.r) * 0.8, b.y + rand(-b.r, b.r) * 0.5, 1, ['#ff9ec4', '#c9a0ff', '#ffd166'], {
        speed: 12, life: 0.9, size: 2.6, glow: true, lift: 26
      });
    }
    b.kx = damp(b.kx, 0, 8, dt);
    b.ky = damp(b.ky, 0, 8, dt);

    if (b.burnT > 0) {
      b.burnT -= dt;
      b.hp -= b.burnDps * dt;
      this.damageDealt += b.burnDps * dt;
      if (b.hp <= 0) { this._killBoss(); return; }
      if (Math.random() < 0.35) {
        this._burst(b.x + rand(-20, 20), b.y + rand(-16, 16), 1, ['#ff6b3d', '#ffd166'], { speed: 22, life: 0.4, size: 3, glow: true, lift: 24 });
      }
    }

    if (b.introT > 0) {
      b.introT -= dt;
      this.bossIntro = b.introT;
      b.y += Math.sin(b.anim * 2.4) * 4 * dt;
      if (b.introT <= 0) {
        b.state = 'idle';
        b.actionCd = 1.2;
        b.stateT = 0;
        this.bossIntro = 0;
        this.camZoom = 1.02;
      }
      return;
    }
    this.bossIntro = 0;

    var d = dist(b.x, b.y, p.x, p.y);
    var ang = angleTo(b.x, b.y, p.x, p.y);
    b.facing = p.x < b.x ? -1 : 1;

    switch (b.state) {
      case 'idle':
        if (d > 150) {
          b.x += Math.cos(ang) * b.speed * dt;
          b.y += Math.sin(ang) * b.speed * dt;
        } else {
          b.x += Math.cos(ang + Math.PI / 2) * b.speed * 0.7 * dt;
          b.y += Math.sin(ang + Math.PI / 2) * b.speed * 0.7 * dt;
        }
        b.actionCd -= dt;
        if (b.actionCd <= 0) {
          b.actionIndex = (b.actionIndex + 1) % 3;
          if (b.actionIndex === 0) { b.state = 'chargeWind'; b.stateT = b.enraged ? 0.65 : 0.85; }
          else if (b.actionIndex === 1) { b.state = 'volleyWind'; b.stateT = b.enraged ? 0.5 : 0.7; }
          else { b.state = 'summonWind'; b.stateT = 0.55; }
        }
        break;
      case 'chargeWind':
        b.stateT -= dt;
        if (Math.random() < 0.4) {
          this._burst(b.x + rand(-30, 30), b.y + rand(-20, 20), 1, ['#ff5d8f', '#c9a0ff'], { speed: 40, life: 0.35, size: 3.4, glow: true });
        }
        if (b.stateT <= 0) {
          b.state = 'charge';
          b.stateT = 0.55;
          var ca = angleTo(b.x, b.y, p.x, p.y);
          b.chargeX = Math.cos(ca);
          b.chargeY = Math.sin(ca);
          this._ringFx(b.x, b.y, '#ff5d8f', 18, 130, 0.4, 5);
          this._sfx('dash');
        }
        break;
      case 'charge':
        b.stateT -= dt;
        b.x += b.chargeX * 430 * dt;
        b.y += b.chargeY * 430 * dt;
        if (Math.random() < 0.65) {
          this._burst(b.x + rand(-16, 16), b.y + rand(-10, 10), 1, ['#ff5d8f', '#c9a0ff'], { speed: 30, life: 0.4, size: 3.6, glow: true });
        }
        if (b.stateT <= 0) {
          b.state = 'idle';
          b.actionCd = b.enraged ? 0.7 : 1.15;
          this.shake = Math.max(this.shake, 3);
        }
        break;
      case 'volleyWind':
        b.stateT -= dt;
        if (b.stateT <= 0) {
          b.state = 'volley';
          b.stateT = 1.35;
          b.volleys = 0;
          b.volleyTimer = 0;
          this._ringFx(b.x, b.y, '#ff5d8f', 20, 170, 0.5, 4);
        }
        break;
      case 'volley':
        b.stateT -= dt;
        b.volleyTimer -= dt;
        if (b.volleyTimer <= 0 && b.volleys < 3) {
          b.volleys++;
          b.volleyTimer = 0.34;
          this._bossVolley();
        }
        if (b.stateT <= 0) { b.state = 'idle'; b.actionCd = b.enraged ? 0.65 : 1.05; }
        break;
      case 'summonWind':
        b.stateT -= dt;
        if (b.stateT <= 0) {
          b.state = 'idle';
          b.actionCd = 1.1;
          var n = b.enraged ? 5 : 3;
          for (var i = 0; i < n; i++) {
            var sa = rand(0, TAU);
            var sx = clamp(b.x + Math.cos(sa) * rand(90, 170), 60, WORLD.w - 60);
            var sy = clamp(b.y + Math.sin(sa) * rand(90, 170), 60, WORLD.h - 60);
            this._spawnEnemyAt(Math.random() < 0.55 ? 'bat' : 'crawler', sx, sy, false);
            this._burst(sx, sy, 6, ['#c9a0ff', '#abff5c'], { speed: 100, life: 0.5, size: 3, glow: true });
          }
          this._ringFx(b.x, b.y, '#c9a0ff', 20, 200, 0.6, 5);
          this._sfxThrottled('boss-roar', 500);
        }
        break;
    }
    b.x += b.kx * dt;
    b.y += b.ky * dt;
    b.x = clamp(b.x, 90, WORLD.w - 90);
    b.y = clamp(b.y, 90, WORLD.h - 90);
    this._bossContact();
  };

  /* ============================================================
     projectiles / loot / fx update
     ============================================================ */
  SpellBrigadeGame.prototype._projectileHit = function (pr, e) {
    var crit = Math.random() < (pr.crit || 0.05);
    var dmg = pr.dmg * (crit ? (pr.critMult || 1.8) : 1);
    var area = (this.player.mods.area || 1);
    var ang = angleTo(pr.x, pr.y, e.x, e.y);
    this._hitEnemy(e, dmg, pr.element, { angle: ang, crit: crit, noChain: true });
    if (pr.element === 'fire') {
      this._areaDamage(e.x, e.y, 30 * area, dmg * 0.3, 'fire', { noKnock: true, noChain: true });
      this._ringFx(e.x, e.y, '#ffd166', 6, 34 * area, 0.25, 2);
    } else if (pr.element === 'lightning') {
      this._chainLightning(e, dmg * 0.5, 1, []);
    } else if (pr.element === 'acid') {
      if (Math.random() < 0.5) this._spawnPool(e.x, e.y, 32 * area, dmg * 0.45, 2.6, '#abff5c');
    } else if (pr.element === 'ice') {
      this._ringFx(e.x, e.y, '#74e4ff', 4, 24, 0.22, 2);
    }
    var hitEl = ELEM[pr.element] ? ELEM[pr.element] : ELEM.fire;
    this._burst(e.x, e.y, 8, [hitEl.color, hitEl.glow, '#fff4d8'], {
      speed: 190, life: 0.3, size: 3, glow: true, jitter: 6
    });
    this._ringFx(e.x, e.y, hitEl.glow, 3, 30 + pr.r * 3, 0.22, 2.4);
    if (Math.random() < 0.35) this._spawnArc(e.x - 16, e.y - 12, e.x + rand(-6, 6), e.y + rand(-6, 6), hitEl.glow, 0.1, 1.6);
  };

  SpellBrigadeGame.prototype._updateProjectiles = function (dt) {
    var p = this.player;
    if (!p) return;
    var i, j;
    for (i = 0; i < this.projectiles.length; i++) {
      var pr = this.projectiles[i];
      if (!pr.active) continue;
      pr.life -= dt;
      if (pr.life <= 0) { pr.active = false; continue; }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.trailT -= dt;
      if (pr.trailT <= 0 && pr.glow) {
        pr.trailT = 0.085;
        var el = ELEM[pr.element] || ELEM.fire;
        this._burst(pr.x, pr.y, 1, [el.color, el.glow], { speed: 18, life: 0.22, size: pr.big ? 3.4 : 2.2, glow: true });
      }
      if (pr.x < -30 || pr.x > WORLD.w + 30 || pr.y < -30 || pr.y > WORLD.h + 30) {
        pr.active = false;
        continue;
      }
      if (pr.friendly) {
        var consumed = false;
        for (j = 0; j < this.enemies.length; j++) {
          var e = this.enemies[j];
          if (!e.active) continue;
          var rr = pr.r + e.r;
          if (dist2(pr.x, pr.y, e.x, e.y) < rr * rr) {
            if (pr.hitUids.indexOf(e.uid) >= 0) continue;
            pr.hitUids.push(e.uid);
            this._projectileHit(pr, e);
            if (pr.pierce > 0) {
              pr.pierce--;
            } else {
              pr.active = false;
              consumed = true;
              break;
            }
          }
        }
        if (!consumed && pr.active) {
          var b = this.boss;
          if (b && b.alive && b.introT <= 0) {
            var brr = pr.r + b.r;
            if (dist2(pr.x, pr.y, b.x, b.y) < brr * brr) {
              var crit = Math.random() < (pr.crit || 0.05);
              var dmg = pr.dmg * (crit ? (pr.critMult || 1.8) : 1);
              this._damageBoss(dmg, pr.element, { angle: Math.atan2(pr.vy, pr.vx), crit: crit });
              if (pr.pierce > 0) pr.pierce--; else pr.active = false;
            }
          }
        }
      } else {
        var hit = false;
        if (p.hp > 0) {
          var prr = pr.r + p.r;
          if (dist2(pr.x, pr.y, p.x, p.y) < prr * prr) {
            this._damagePlayer(pr.dmg, pr.x, pr.y);
            this._burst(pr.x, pr.y, 6, ['#ff9ec4', '#c9a0ff'], { speed: 110, life: 0.3, size: 2.6, glow: true });
            pr.active = false;
            hit = true;
          }
        }
        if (!hit) {
          for (j = 0; j < this.allies.length; j++) {
            var al = this.allies[j];
            if (al.down) continue;
            var arr = pr.r + al.r;
            if (dist2(pr.x, pr.y, al.x, al.y) < arr * arr) {
              this._damageAlly(al, pr.dmg, pr.x, pr.y);
              this._burst(pr.x, pr.y, 5, ['#ff9ec4', '#c9a0ff'], { speed: 90, life: 0.25, size: 2.2, glow: true });
              pr.active = false;
              hit = true;
              break;
            }
          }
        }
      }
    }
  };

  SpellBrigadeGame.prototype._updateGems = function (dt) {
    var p = this.player;
    if (!p) return;
    var magnetR = 145 * (p.mods.pickup || 1);
    var magnetR2 = magnetR * magnetR;
    for (var i = 0; i < this.gems.length; i++) {
      var g = this.gems[i];
      if (!g.active) continue;
      g.phase += dt * 3.2;
    if (Math.random() < dt * 0.75) {
      this._burst(g.x + rand(-5, 5), g.y - 6, 1, ['#ffd166', '#fff4d8'], { speed: 12, life: 0.45, size: 1.8, glow: true, lift: 16 });
    }
      if (!g.magnet) {
        g.vx = damp(g.vx, 0, 5, dt);
        g.vy = damp(g.vy, 0, 5, dt);
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.x = clamp(g.x, 24, WORLD.w - 24);
        g.y = clamp(g.y, 24, WORLD.h - 24);
        var near = this._nearestTeam(g.x, g.y, false);
        if (near) {
          var nd = dist(g.x, g.y, near.x, near.y);
          if (nd < magnetR) g.magnet = true;
          else if (nd < 320) {
            var driftA = angleTo(g.x, g.y, near.x, near.y);
            g.vx = damp(g.vx, Math.cos(driftA) * 30, 3, dt);
            g.vy = damp(g.vy, Math.sin(driftA) * 30, 3, dt);
          }
        }
      } else {
        var target = this._nearestTeam(g.x, g.y, true) || p;
        var ang = angleTo(g.x, g.y, target.x, target.y);
        var sp = 420;
        g.vx = damp(g.vx, Math.cos(ang) * sp, 14, dt);
        g.vy = damp(g.vy, Math.sin(ang) * sp, 14, dt);
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        if (dist2(g.x, g.y, target.x, target.y) < 24 * 24) {
          g.active = false;
          this.gemCount++;
          this._gainXp(g.value);
          this._sfxThrottled('pickup', 110);
          var el = this.player.element;
          this._burst(g.x, g.y, 3, [ELEM[el].glow, '#fff4d8'], { speed: 70, life: 0.28, size: 2, glow: true });
          if (this.state !== 'running') return;
        }
      }
    }
  };

  SpellBrigadeGame.prototype._updatePools = function (dt) {
    var i, j;
    for (i = 0; i < this.pools.length; i++) {
      var pool = this.pools[i];
      if (!pool.active) continue;
      pool.life -= dt;
      pool.phase += dt * 2;
      if (pool.life <= 0) { pool.active = false; continue; }
      pool.tick -= dt;
      if (pool.tick <= 0) {
        pool.tick = 0.4;
        var r2 = pool.r * pool.r;
        for (j = 0; j < this.enemies.length; j++) {
          var e = this.enemies[j];
          if (!e.active) continue;
          if (dist2(pool.x, pool.y, e.x, e.y) < r2 + e.r * e.r) {
            this._hitEnemy(e, pool.dps * 0.4, 'acid', { noChain: true, noKnock: true });
            if (!e.active) continue;
          }
        }
        var b = this.boss;
        if (b && b.alive && b.introT <= 0 && dist2(pool.x, pool.y, b.x, b.y) < r2 + b.r * b.r) {
          this._damageBoss(pool.dps * 0.4, 'acid', {});
        }
      }
      pool.bubble -= dt;
      if (pool.bubble <= 0) {
        pool.bubble = rand(0.12, 0.3);
        this._burst(pool.x + rand(-pool.r, pool.r) * 0.7, pool.y + rand(-pool.r, pool.r) * 0.5, 1, ['#abff5c', '#ecffd2'], {
          speed: 12, life: 0.5, size: 2.6, glow: true, lift: 20
        });
      }
    }
  };

  SpellBrigadeGame.prototype._updateMeteors = function (dt) {
    for (var i = 0; i < this.meteors.length; i++) {
      var m = this.meteors[i];
      if (!m.active) continue;
      m.t -= dt;
      if (m.t <= 0) {
        m.active = false;
        this._areaDamage(m.x, m.y, m.r, m.dmg, 'fire', { noKnock: false });
        this._ringFx(m.x, m.y, '#ffd166', 14, m.r * 1.5, 0.55, 6);
        this._ringFx(m.x, m.y, '#ff6b3d', 8, m.r, 0.4, 4);
        this._burst(m.x, m.y, 30, ['#ff6b3d', '#ffd166', '#fff0c0'], { speed: 240, life: 0.7, size: 4, glow: true, jitter: 20 });
        this.shake = Math.max(this.shake, 6);
        this._sfxThrottled('shoot-fire', 160);
      }
    }
  };

  SpellBrigadeGame.prototype._updateParticles = function (dt) {
    for (var i = 0; i < this.particles.length; i++) {
      var pt = this.particles[i];
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) { pt.active = false; continue; }
      if (pt.type === 'ring') {
        pt.r += pt.grow * dt;
        continue;
      }
      var k = Math.pow(pt.drag || 0.9, dt * 60);
      pt.vx *= k;
      pt.vy = pt.vy * k + (pt.grav || 0) * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
  };

  SpellBrigadeGame.prototype._updateNumbers = function (dt) {
    for (var i = 0; i < this.numbers.length; i++) {
      var n = this.numbers[i];
      if (!n.active) continue;
      n.life -= dt;
      if (n.life <= 0) { n.active = false; continue; }
      n.vy += 34 * dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
    }
  };

  SpellBrigadeGame.prototype._updateArcs = function (dt) {
    for (var i = 0; i < this.arcs.length; i++) {
      var a = this.arcs[i];
      if (!a.active) continue;
      a.life -= dt;
      if (a.life <= 0) a.active = false;
    }
  };

  SpellBrigadeGame.prototype._clampCamera = function (immediate) {
    var halfW = this.vw / (2 * (this.scale || 1));
    var halfH = this.vh / (2 * (this.scale || 1));
    if (WORLD.w <= halfW * 2) this.cam.x = WORLD.w / 2;
    else this.cam.x = clamp(this.cam.x, halfW, WORLD.w - halfW);
    if (WORLD.h <= halfH * 2) this.cam.y = WORLD.h / 2;
    else this.cam.y = clamp(this.cam.y, halfH, WORLD.h - halfH);
  };

  SpellBrigadeGame.prototype._updateCamera = function (dt) {
    var p = this.player;
    if (!p) return;
    var tx = p.x + p.vx * 0.12;
    var ty = p.y + p.vy * 0.1;
    if (this.boss && this.boss.alive && this.boss.introT > 0) {
      tx = lerp(p.x, this.boss.x, 0.5);
      ty = lerp(p.y, this.boss.y, 0.5);
    }
    this.cam.x = damp(this.cam.x, tx, 6.5, dt);
    this.cam.y = damp(this.cam.y, ty, 6.5, dt);
    this._clampCamera(false);
    this.shake = Math.max(0, this.shake - dt * 26);
    if (this.shake > 0.2) {
      this.shakeX = rand(-1, 1) * this.shake;
      this.shakeY = rand(-1, 1) * this.shake;
    } else {
      this.shake = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }
    this.camZoom = damp(this.camZoom, 1, 4.5, dt);
    this.screenFlash = Math.max(0, this.screenFlash - dt * 2.6);
  };

  SpellBrigadeGame.prototype._updateTimers = function (dt) {
    if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
    this.shieldRecharge += dt;
  };

  SpellBrigadeGame.prototype._damagePlayer = function (amount, sx, sy) {
    var p = this.player;
    if (!p || p.hp <= 0) return;
    if (p.invuln > 0 || this.dashT > 0) return;
    if (p.shield > 0) {
      p.shield--;
      p.shieldTimer = 0;
      p.invuln = 0.6;
      this._ringFx(p.x, p.y, '#74e4ff', 14, 74, 0.45, 3.5);
      this._burst(p.x, p.y - 10, 10, ['#74e4ff', '#ffffff'], { speed: 120, life: 0.4, size: 3, glow: true });
      this._spawnNumber(p.x, p.y - 30, '护盾', '#74e4ff', false);
      this._sfxThrottled('hit', 120);
      return;
    }
    var dmg = amount * (1 - (p.mods.armor || 0));
    p.hp -= dmg;
    this.damageTaken += dmg;
    p.hurtT = 0.36;
    p.invuln = 0.85;
    this.shake = Math.max(this.shake, 5);
    this.screenFlash = Math.max(this.screenFlash, 0.16);
    this._sfx('hurt');
    this._spawnNumber(p.x + rand(-6, 6), p.y - p.r - 16, '-' + Math.round(dmg), '#ff5d8f', false);
    this._burst(p.x, p.y, 8, ['#ff5d8f', '#fff4d8'], { speed: 120, life: 0.35, size: 2.6, glow: true });
    if (sx !== undefined) {
      var ang = angleTo(sx, sy, p.x, p.y);
      p.vx += Math.cos(ang) * 150;
      p.vy += Math.sin(ang) * 150;
    }
    this.emitHud(true);
  };
  /* ============================================================
     render
     ============================================================ */
  SpellBrigadeGame.prototype._buildAmbient = function () {
    var rnd = mulberry32(77123);
    var mist = [];
    for (var i = 0; i < 20; i++) {
      mist.push({
        x: rnd() * WORLD.w, y: rnd() * WORLD.h,
        s: 130 + rnd() * 250,
        sp: 4 + rnd() * 12,
        ph: rnd() * TAU,
        a: 0.05 + rnd() * 0.08,
        high: i >= 13
      });
    }
    var flies = [];
    for (var j = 0; j < 46; j++) {
      flies.push({
        x: rnd() * WORLD.w, y: rnd() * WORLD.h,
        ph: rnd() * TAU,
        sp: 6 + rnd() * 14,
        r: 1.4 + rnd() * 2.2,
        hue: rnd() < 0.55 ? '#ffd166' : '#74e4ff'
      });
    }
    var embers = [];
    for (var k = 0; k < 26; k++) {
      embers.push({ x: rnd() * WORLD.w, y: rnd() * WORLD.h, ph: rnd() * TAU, sp: 8 + rnd() * 16, r: 1 + rnd() * 1.8 });
    }
    this.mist = mist;
    this.flies = flies;
    this.embers = embers;
  };

  SpellBrigadeGame.prototype._drawAmbient = function (g, high, left, top, right, bottom) {
    if (!this.mist) this._buildAmbient();
    var t = this.uiTime;
    var i;
    if (!high) {
      g.save();
      g.globalCompositeOperation = 'source-over';
      for (i = 0; i < this.mist.length; i++) {
        var m = this.mist[i];
        if (m.high) continue;
        var mx = m.x + t * m.sp;
        mx = mx % WORLD.w;
        var my = m.y + Math.sin(t * 0.25 + m.ph) * 24;
        if (mx < left - m.s || mx > right + m.s || my < top - m.s || my > bottom + m.s) continue;
        var pulse = 0.75 + 0.25 * Math.sin(t * 0.5 + m.ph);
        g.globalAlpha = m.a * pulse;
        g.drawImage(this.sprites.mist, mx - m.s / 2, my - m.s / 2, m.s, m.s);
      }
      g.globalAlpha = 1;
      g.restore();
      return;
    }
    // above characters: thinner mist + fireflies
    g.save();
    for (i = 0; i < this.mist.length; i++) {
      var m2 = this.mist[i];
      if (!m2.high) continue;
      var mx2 = m2.x + t * m2.sp * 0.7;
      mx2 = mx2 % WORLD.w;
      var my2 = m2.y + Math.sin(t * 0.2 + m2.ph) * 30;
      if (mx2 < left - m2.s || mx2 > right + m2.s || my2 < top - m2.s || my2 > bottom + m2.s) continue;
      g.globalAlpha = m2.a * 0.55;
      g.drawImage(this.sprites.mist, mx2 - m2.s / 2, my2 - m2.s / 2, m2.s, m2.s);
    }
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.flies.length; i++) {
      var f = this.flies[i];
      var fx = f.x + Math.sin(t * 0.32 + f.ph) * 46 + t * f.sp * 0.35;
      fx = fx % WORLD.w;
      var fy = f.y + Math.cos(t * 0.27 + f.ph * 1.7) * 34 + Math.sin(t * 0.6 + f.ph) * 10;
      if (fx < left || fx > right || fy < top || fy > bottom) continue;
      var flick = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.2 + f.ph));
      g.globalAlpha = flick * 0.8;
      var fs = f.r * 9;
      var spr = this.sprites.glow[f.hue === '#ffd166' ? 'fire' : 'ice'];
      g.drawImage(spr, fx - fs / 2, fy - fs / 2, fs, fs);
      g.globalAlpha = flick;
      g.fillStyle = f.hue;
      g.beginPath(); g.arc(fx, fy, f.r * 0.8, 0, TAU); g.fill();
    }
    // drifting embers
    if (this.embers) {
      for (i = 0; i < this.embers.length; i++) {
        var em = this.embers[i];
        var ex = (em.x + t * em.sp) % WORLD.w;
        var ey = em.y - ((t * (18 + em.sp * 2) + em.ph * 50) % 720);
        if (ey < top - 40) ey += 720;
        if (ex < left || ex > right || ey < top || ey > bottom) continue;
        var flick2 = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.6 + em.ph));
        g.globalAlpha = flick2 * 0.5;
        var esz = em.r * 11;
        g.drawImage(this.sprites.glow.fire, ex - esz / 2, ey - esz / 2, esz, esz);
        g.globalAlpha = flick2 * 0.85;
        g.fillStyle = '#ffb26b';
        g.beginPath(); g.arc(ex, ey, em.r, 0, TAU); g.fill();
      }
    }
    g.globalAlpha = 1;
    g.restore();
  };

  SpellBrigadeGame.prototype._drawPools = function (g) {
    for (var i = 0; i < this.pools.length; i++) {
      var p = this.pools[i];
      if (!p.active) continue;
      var a = clamp(p.life / 0.6, 0, 1);
      g.save();
      g.globalAlpha = 0.15 * a;
      g.fillStyle = '#abff5c';
      g.beginPath();
      g.ellipse(p.x, p.y, p.r, p.r * 0.62, 0, 0, TAU);
      g.fill();
      g.globalAlpha = 0.34 * a;
      g.strokeStyle = '#abff5c';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(p.x, p.y, p.r * 0.92, p.r * 0.58, 0, 0, TAU);
      g.stroke();
      g.globalAlpha = 0.25 * a;
      g.fillStyle = '#ecffd2';
      for (var b = 0; b < 5; b++) {
        var ba = p.phase + b * 1.3;
        var br = p.r * (0.2 + 0.6 * ((b * 0.37 + p.phase * 0.1) % 1));
        var bx = p.x + Math.cos(ba) * br;
        var by = p.y + Math.sin(ba) * br * 0.6;
        g.beginPath();
        g.arc(bx, by, 1.6 + 1.6 * Math.abs(Math.sin(ba * 2)), 0, TAU);
        g.fill();
      }
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawGems = function (g) {
    var t = this.uiTime;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.gems.length; i++) {
      var gem = this.gems[i];
      if (!gem.active) continue;
      var bob = Math.sin(gem.phase) * 2.2;
      var gs = gem.magnet ? 22 : 16;
      g.globalAlpha = 0.42;
      var spr = this.sprites.glow.fire;
      g.drawImage(spr, gem.x - gs / 2, gem.y - 6 + bob - gs / 2, gs, gs);
    }
    g.restore();
    for (var j = 0; j < this.gems.length; j++) {
      var gem2 = this.gems[j];
      if (!gem2.active) continue;
      var bob2 = Math.sin(gem2.phase) * 2.2;
      var x = gem2.x, y = gem2.y - 5 + bob2;
      var r = 5.5;
      g.save();
      g.translate(x, y);
      g.rotate(Math.sin(gem2.phase * 0.7) * 0.25);
      g.beginPath();
      g.moveTo(0, -r);
      g.lineTo(r * 0.72, 0);
      g.lineTo(0, r);
      g.lineTo(-r * 0.72, 0);
      g.closePath();
      g.fillStyle = '#ffd166';
      g.fill();
      g.strokeStyle = '#7a4b12';
      g.lineWidth = 1.6;
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.beginPath();
      g.moveTo(0, -r * 0.75);
      g.lineTo(r * 0.3, 0);
      g.lineTo(0, r * 0.2);
      g.closePath();
      g.fill();
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawTelegraphs = function (g) {
    var b = this.boss;
    if (!b || !b.alive || b.introT > 0) return;
    var p = this.player;
    if (!p) return;
    if (b.state === 'chargeWind') {
      var prog = 1 - clamp(b.stateT / (b.enraged ? 0.65 : 0.85), 0, 1);
      var ang = angleTo(b.x, b.y, p.x, p.y);
      g.save();
      g.translate(b.x, b.y);
      g.rotate(ang);
      g.globalAlpha = 0.16 + 0.2 * prog;
      g.fillStyle = '#ff5d8f';
      g.beginPath();
      g.moveTo(0, -b.r * 0.6);
      g.lineTo(460, -18);
      g.lineTo(460, 18);
      g.lineTo(0, b.r * 0.6);
      g.closePath();
      g.fill();
      g.globalAlpha = 0.4;
      g.strokeStyle = '#ff9ec4';
      g.lineWidth = 2;
      g.stroke();
      g.restore();
    } else if (b.state === 'volleyWind') {
      var pa = angleTo(b.x, b.y, p.x, p.y);
      var prog2 = 1 - clamp(b.stateT / (b.enraged ? 0.5 : 0.7), 0, 1);
      g.save();
      g.globalAlpha = 0.12 + 0.16 * prog2;
      g.fillStyle = '#ff5d8f';
      g.beginPath();
      g.moveTo(b.x, b.y);
      g.arc(b.x, b.y, 300, pa - 0.9, pa + 0.9);
      g.closePath();
      g.fill();
      g.globalAlpha = 0.3;
      g.strokeStyle = '#ff9ec4';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(b.x, b.y, 300, pa - 0.9, pa + 0.9);
      g.stroke();
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawMeteors = function (g) {
    for (var i = 0; i < this.meteors.length; i++) {
      var m = this.meteors[i];
      if (!m.active) continue;
      var prog = clamp(1 - m.t / 0.55, 0, 1);
      // warning ring
      g.save();
      g.globalAlpha = 0.2 + 0.35 * prog;
      g.strokeStyle = '#ffd166';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(m.x, m.y, m.r * (0.5 + prog * 0.5), m.r * 0.62 * (0.5 + prog * 0.5), 0, 0, TAU);
      g.stroke();
      g.globalAlpha = 0.12 + 0.2 * prog;
      g.fillStyle = '#ff6b3d';
      g.beginPath();
      g.ellipse(m.x, m.y, m.r, m.r * 0.62, 0, 0, TAU);
      g.fill();
      // falling star
      var fall = (1 - prog) * 320;
      var sx = m.x, sy = m.y - fall;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.9;
      var fs = 46 + prog * 40;
      g.drawImage(this.sprites.glow.fire, sx - fs / 2, sy - fs / 2, fs, fs);
      g.globalAlpha = 0.7;
      g.strokeStyle = '#ffd166';
      g.lineWidth = 4 + prog * 4;
      g.beginPath();
      g.moveTo(sx + 20, sy - 70);
      g.lineTo(sx, sy);
      g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = '#fff0c0';
      g.beginPath(); g.arc(sx, sy, 10 + prog * 8, 0, TAU); g.fill();
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawProjectiles = function (g) {
    var i, pr, s;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.projectiles.length; i++) {
      pr = this.projectiles[i];
      if (!pr.active) continue;
      var el = ELEM[pr.element] || ELEM.fire;
      var spr = pr.friendly ? (this.sprites.glow[pr.element] || this.sprites.glow.fire) : this.sprites.glow.fire;
      var vis = pr.r * (pr.big ? 3.6 : 2.9) + 8;
      var sp = Math.sqrt(pr.vx * pr.vx + pr.vy * pr.vy) || 1;
      var ux = pr.vx / sp, uy = pr.vy / sp;
      // tapered additive trail
      for (s = 1; s <= 4; s++) {
        var back = s * (pr.big ? 13 : 8.5);
        var sz = vis * (1 - s * 0.17);
        g.globalAlpha = 0.34 - s * 0.06;
        g.drawImage(spr, pr.x - ux * back - sz / 2, pr.y - uy * back - sz / 2, sz, sz);
      }
      // main halo
      g.globalAlpha = 0.95;
      var pulse = 1 + Math.sin(pr.spin + this.uiTime * 14) * 0.08;
      g.drawImage(spr, pr.x - (vis * pulse) / 2, pr.y - (vis * pulse) / 2, vis * pulse, vis * pulse);
      // bright core halo
      g.globalAlpha = 0.75;
      var core = vis * 0.42;
      g.drawImage(this.sprites.glow[pr.element] || this.sprites.white, pr.x - core / 2, pr.y - core / 2, core, core);
      g.globalAlpha = 1;
    }
    g.restore();

    for (i = 0; i < this.projectiles.length; i++) {
      pr = this.projectiles[i];
      if (!pr.active) continue;
      var el2 = ELEM[pr.element] || ELEM.fire;
      var col2 = pr.color || el2.color;
      var visR = pr.r * (pr.big ? 2.1 : 1.7);
      g.save();
      g.translate(pr.x, pr.y);
      var ang = Math.atan2(pr.vy, pr.vx);
      g.rotate(ang);
      if (pr.friendly) {
        if (pr.element === 'ice') {
          // crystalline shard
          g.beginPath();
          g.moveTo(visR * 2.4, 0);
          g.lineTo(visR * 0.2, -visR * 1.1);
          g.lineTo(-visR * 1.4, 0);
          g.lineTo(visR * 0.2, visR * 1.1);
          g.closePath();
          g.fillStyle = '#eaffff';
          g.fill();
          g.strokeStyle = '#2a7a99';
          g.lineWidth = 1.4;
          g.stroke();
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.moveTo(visR * 1.2, 0);
          g.lineTo(visR * 0.1, -visR * 0.4);
          g.lineTo(-visR * 0.4, 0);
          g.lineTo(visR * 0.1, visR * 0.4);
          g.closePath();
          g.fill();
        } else if (pr.element === 'lightning') {
          g.strokeStyle = '#fff9c9';
          g.lineWidth = Math.max(2, visR * 0.9);
          g.lineCap = 'round';
          g.lineJoin = 'round';
          g.beginPath();
          g.moveTo(visR * 2.6, 0);
          g.lineTo(visR * 0.6, -visR * 1.1);
          g.lineTo(-visR * 0.2, visR * 0.5);
          g.lineTo(-visR * 1.8, 0);
          g.stroke();
          g.strokeStyle = '#ffffff';
          g.lineWidth = Math.max(1, visR * 0.35);
          g.beginPath();
          g.moveTo(visR * 2.2, 0);
          g.lineTo(visR * 0.5, -visR * 0.7);
          g.lineTo(-visR * 0.2, visR * 0.3);
          g.lineTo(-visR * 1.4, 0);
          g.stroke();
        } else if (pr.element === 'acid') {
          g.fillStyle = '#abff5c';
          g.strokeStyle = '#294d18';
          g.lineWidth = 1.8;
          g.beginPath();
          g.arc(0, 0, visR, 0, TAU);
          g.fill();
          g.stroke();
          g.fillStyle = 'rgba(236,255,210,0.95)';
          g.beginPath();
          g.arc(-visR * 0.3, -visR * 0.32, visR * 0.42, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(41,77,24,0.5)';
          g.beginPath(); g.arc(visR * 0.35, visR * 0.3, visR * 0.22, 0, TAU); g.fill();
        } else {
          // fireball with flame tongues
          g.fillStyle = 'rgba(255,107,61,0.85)';
          g.beginPath();
          g.moveTo(-visR * 0.2, -visR);
          g.quadraticCurveTo(-visR * 2.4, -visR * 0.4, -visR * 1.2, 0);
          g.quadraticCurveTo(-visR * 2.3, visR * 0.4, -visR * 0.2, visR);
          g.closePath();
          g.fill();
          g.beginPath();
          g.arc(0, 0, visR, 0, TAU);
          g.fillStyle = '#ff6b3d';
          g.fill();
          g.strokeStyle = '#7a2718';
          g.lineWidth = 1.6;
          g.stroke();
          g.beginPath();
          g.arc(visR * 0.1, -visR * 0.15, visR * 0.55, 0, TAU);
          g.fillStyle = '#fff0c0';
          g.fill();
        }
      } else {
        g.fillStyle = pr.color || '#8a5fa8';
        g.strokeStyle = '#2b1636';
        g.lineWidth = 2.2;
        g.beginPath();
        g.arc(0, 0, visR, 0, TAU);
        g.fill();
        g.stroke();
        var pr2 = visR * 0.55;
        g.fillStyle = '#ff9ec4';
        g.beginPath();
        g.arc(-visR * 0.15, -visR * 0.15, pr2, 0, TAU);
        g.fill();
        g.fillStyle = '#fff4d8';
        g.beginPath();
        g.arc(-visR * 0.2, -visR * 0.2, pr2 * 0.4, 0, TAU);
        g.fill();
      }
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawArcs = function (g) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.arcs.length; i++) {
      var a = this.arcs[i];
      if (!a.active) continue;
      var lifeRatio = a.life / a.maxLife;
      var dx = a.x2 - a.x1, dy = a.y2 - a.y1;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var segs = 6;
      g.globalAlpha = 0.85 * lifeRatio;
      for (var pass = 0; pass < 2; pass++) {
        g.strokeStyle = pass === 0 ? a.color : '#ffffff';
        g.lineWidth = (pass === 0 ? a.width * 2.4 : a.width) * (0.6 + 0.4 * lifeRatio);
        g.lineCap = 'round';
        g.beginPath();
        for (var s = 0; s <= segs; s++) {
          var t = s / segs;
          var off = Math.sin(a.seed + s * 12.9898) * 12 * Math.sin(t * Math.PI);
          var px = a.x1 + dx * t + nx * off;
          var py = a.y1 + dy * t + ny * off;
          if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    g.restore();
  };

  SpellBrigadeGame.prototype._drawParticles = function (g) {
    var i, pt;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.particles.length; i++) {
      pt = this.particles[i];
      if (!pt.active) continue;
      var lr = pt.life / pt.maxLife;
      if (!pt.glow) continue;
      if (pt.type === 'ring') {
        g.globalAlpha = lr * 0.85;
        g.strokeStyle = pt.color;
        g.lineWidth = pt.size * (0.4 + 0.6 * lr);
        g.beginPath();
        g.arc(pt.x, pt.y, pt.r, 0, TAU);
        g.stroke();
      } else {
        var size = pt.size * (0.6 + lr * 0.9) * 3.2;
        g.globalAlpha = lr * 0.8;
        var spr = this.sprites.white;
        if (pt.color === ELEM.fire.color || pt.color === ELEM.fire.glow || pt.color === '#ff6b3d') spr = this.sprites.glow.fire;
        else if (pt.color === ELEM.ice.color || pt.color === ELEM.ice.glow || pt.color === '#74e4ff' || pt.color === '#d7fbff') spr = this.sprites.glow.ice;
        else if (pt.color === ELEM.lightning.color || pt.color === ELEM.lightning.glow || pt.color === '#ffe14d' || pt.color === '#fff9c9') spr = this.sprites.glow.lightning;
        else if (pt.color === ELEM.acid.color || pt.color === ELEM.acid.glow || pt.color === '#abff5c' || pt.color === '#ecffd2') spr = this.sprites.glow.acid;
        g.drawImage(spr, pt.x - size / 2, pt.y - size / 2, size, size);
      }
    }
    g.globalAlpha = 1;
    g.restore();

    g.save();
    for (i = 0; i < this.particles.length; i++) {
      pt = this.particles[i];
      if (!pt.active || pt.glow) continue;
      var lr2 = pt.life / pt.maxLife;
      g.globalAlpha = lr2 * 0.8;
      g.fillStyle = pt.color;
      g.beginPath();
      g.arc(pt.x, pt.y, Math.max(0.4, pt.size * lr2), 0, TAU);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
  };

  SpellBrigadeGame.prototype._drawNumbers = function (g) {
    g.save();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (var i = 0; i < this.numbers.length; i++) {
      var n = this.numbers[i];
      if (!n.active) continue;
      var lr = n.life / n.maxLife;
      var pop = n.crit ? 1 + Math.max(0, (1 - lr) * 0.5) : 1;
      var fs = Math.round((n.crit ? 17 : 13) * pop);
      g.globalAlpha = clamp(lr * 1.6, 0, 1);
      g.font = '700 ' + fs + 'px "ZCOOL KuaiLe","Microsoft YaHei",sans-serif';
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(20,14,26,0.85)';
      g.strokeText(n.text, n.x, n.y);
      g.fillStyle = n.color;
      g.fillText(n.text, n.x, n.y);
    }
    g.globalAlpha = 1;
    g.restore();
  };

  SpellBrigadeGame.prototype._drawShadows = function (g, list) {
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var w, h;
      if (e.isBoss) {
        w = e.r * 3.2;
        h = e.r * 1.6;
        g.globalAlpha = 0.7;
      } else {
        var mult = e.isPlayer ? 1.25 : e.isAlly ? 1.05 : e.elite ? 1.05 : 0.9;
        w = e.r * 2.6 * mult;
        h = e.r * 1.15 * mult;
        g.globalAlpha = 0.55;
      }
      g.drawImage(this.sprites.shadow, e.x - w / 2, e.y - h * 0.32, w, h);
    }
    g.globalAlpha = 1;
  };

  SpellBrigadeGame.prototype._drawActors = function (g, left, top, right, bottom) {
    var p = this.player;
    if (!p) return;
    var list = this._actorList;
    if (!list) { list = this._actorList = []; }
    list.length = 0;
    list.push(p);
    var i;
    for (i = 0; i < this.allies.length; i++) list.push(this.allies[i]);
    for (i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.active) continue;
      if (e.x < left || e.x > right || e.y < top || e.y > bottom) continue;
      list.push(e);
    }
    var b = this.boss;
    if (b && b.alive && b.x > left && b.x < right && b.y > top && b.y < bottom) list.push(b);
    list.sort(function (a, c) { return a.y - c.y; });
    this._drawShadows(g, list);
    for (i = 0; i < list.length; i++) {
      var ent = list[i];
      if (ent === p || ent.isAlly) this._drawWizard(g, ent);
      else if (ent.isBoss) this._drawBoss(g, ent);
      else this._drawEnemy(g, ent);
    }
  };

  SpellBrigadeGame.prototype._drawWizard = function (g, ent) {
    var theme = ent.theme || FALLBACK_THEMES.fire;
    var el = ent.element || 'fire';
    var colors = ELEM[el] || ELEM.fire;
    var S = (ent.r / 15) * (ent.isPlayer ? 1.12 : 0.96);
    var walk = ent.walk || 0;
    var bob = Math.sin(walk) * 1.6;
    var x = ent.x, y = ent.y;

    if (ent.isAlly && ent.down) {
      this._drawDowned(g, ent, S);
      return;
    }
    var flash = ent.hurtT > 0;
    g.save();
    g.translate(x + (flash ? rand(-1.5, 1.5) : 0), y + bob);
    if (ent.facing < 0) g.scale(-S, S);
    else g.scale(S, S);
    if (ent.invuln > 0 && Math.floor(ent.invuln * 18) % 2 === 0) g.globalAlpha = 0.62;

    // aura under the wizard
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.35;
    g.drawImage(this.sprites.glow[el], -18, -6, 36, 22);
    g.restore();
    g.globalAlpha = ent.invuln > 0 && Math.floor(ent.invuln * 18) % 2 === 0 ? 0.62 : 1;

    // cape behind
    var grad = theme.gradient || ['#ff8a4c', '#ff4d8f'];
    g.beginPath();
    g.moveTo(-10, -22);
    g.quadraticCurveTo(-16, -6, -12, 2);
    g.quadraticCurveTo(0, 6, 12, 2);
    g.quadraticCurveTo(16, -6, 10, -22);
    g.closePath();
    g.fillStyle = theme.deep || '#2b1a3a';
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    g.fill();
    g.stroke();

    // robe
    g.beginPath();
    g.moveTo(-8.5, -2);
    g.quadraticCurveTo(-12, -12, -8, -22);
    g.quadraticCurveTo(-3, -27, 0, -27);
    g.quadraticCurveTo(3, -27, 8, -22);
    g.quadraticCurveTo(12, -12, 8.5, -2);
    g.quadraticCurveTo(0, 2, -8.5, -2);
    g.closePath();
    g.fillStyle = grad[0];
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2.6;
    g.stroke();

    // hem trim
    g.beginPath();
    g.moveTo(-8.5, -2);
    g.quadraticCurveTo(0, 2, 8.5, -2);
    g.quadraticCurveTo(8.4, 1, 0, 4);
    g.quadraticCurveTo(-8.4, 1, -8.5, -2);
    g.closePath();
    g.fillStyle = grad[1] || theme.accent || '#ff4d8f';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();

    // robe highlight
    g.strokeStyle = 'rgba(255,244,216,0.35)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-5.5, -20);
    g.quadraticCurveTo(-8, -10, -6, -3);
    g.stroke();
    // belt
    g.fillStyle = theme.deep || '#2b1a3a';
    g.fillRect(-8, -15.5, 16, 3);
    g.fillStyle = colors.glow;
    g.fillRect(-2.4, -15.8, 4.8, 3.6);
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.strokeRect(-2.4, -15.8, 4.8, 3.6);

    // arms
    g.fillStyle = grad[1] || theme.accent;
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath(); g.arc(-9.5, -16.5, 3.4, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(9.5, -16.5, 3.4, 0, TAU); g.fill(); g.stroke();

    // head
    g.beginPath();
    g.arc(0, -33, 8.4, 0, TAU);
    g.fillStyle = CREAM;
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2.6;
    g.stroke();

    // face
    g.fillStyle = INK;
    g.beginPath(); g.arc(-3, -34.5, 1.5, 0, TAU); g.fill();
    g.beginPath(); g.arc(3, -34.5, 1.5, 0, TAU); g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(0, -31.5, 3.2, 0.2, Math.PI - 0.2);
    g.stroke();
    g.fillStyle = rgba(colors.color, 0.35);
    g.beginPath(); g.arc(-5, -31, 1.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(5, -31, 1.8, 0, TAU); g.fill();

    this._drawHat(g, ent, theme, colors);

    if (ent.isPlayer) {
      // tiny gold crown pip so the player reads at a glance
      g.fillStyle = '#ffd166';
      g.strokeStyle = INK;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0, -55);
      g.lineTo(2.4, -52);
      g.lineTo(0.8, -49.6);
      g.lineTo(-0.8, -49.6);
      g.lineTo(-2.4, -52);
      g.closePath();
      g.fill();
      g.stroke();
    }
    g.restore();

    // staff (unflipped, aims at target)
    g.save();
    g.translate(x, y + bob);
    g.scale(S, S);
    this._drawStaff(g, ent, colors, theme);
    g.restore();

    // orbiting element motes
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (var mi = 0; mi < 2; mi++) {
      var motA = this.uiTime * 1.7 + mi * Math.PI + (ent.walk || 0) * 0.15;
      var motX = x + Math.cos(motA) * (17 * S);
      var motY = y - 26 * S + Math.sin(motA * 1.3) * (10 * S);
      g.globalAlpha = 0.45 + 0.3 * Math.sin(this.uiTime * 4 + mi * 2.1);
      var motS = (mi === 0 ? 17 : 12) * S;
      g.drawImage(this.sprites.glow[el], motX - motS / 2, motY - motS / 2, motS, motS);
      g.globalAlpha = 0.9;
      g.fillStyle = colors.glow;
      g.beginPath(); g.arc(motX, motY, (mi === 0 ? 1.8 : 1.2) * S, 0, TAU); g.fill();
    }
    g.restore();
    // player rotating rune ring
    if (ent.isPlayer) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55;
      g.strokeStyle = 'rgba(255,209,102,0.7)';
      g.lineWidth = 1.8;
      g.beginPath();
      g.arc(x, y + 3, 25 * S, this.uiTime * 1.1, this.uiTime * 1.1 + 1.5);
      g.stroke();
      g.strokeStyle = 'rgba(116,228,255,0.6)';
      g.beginPath();
      g.arc(x, y + 3, 25 * S, this.uiTime * 1.1 + Math.PI, this.uiTime * 1.1 + Math.PI + 1.5);
      g.stroke();
      g.restore();
    }

    if (flash) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(0.75, ent.hurtT * 3.4);
      g.drawImage(this.sprites.white, x - 24, y - 44, 48, 48);
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawHat = function (g, ent, theme, colors) {
    var el = ent.element || 'fire';
    var grad = theme.gradient || ['#ff8a4c', '#ff4d8f'];
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    g.lineJoin = 'round';
    if (el === 'fire') {
      // jester horn hat
      g.fillStyle = grad[1] || '#ff4d8f';
      g.beginPath();
      g.moveTo(-8, -38);
      g.quadraticCurveTo(-16, -46, -13, -53);
      g.quadraticCurveTo(-7, -47, -2, -40);
      g.closePath();
      g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(8, -38);
      g.quadraticCurveTo(17, -46, 14, -53);
      g.quadraticCurveTo(8, -47, 2, -40);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = '#ffd166';
      g.beginPath(); g.arc(-13, -53, 2.6, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.arc(14, -53, 2.6, 0, TAU); g.fill(); g.stroke();
      // collar ruffles
      g.fillStyle = colors.glow;
      for (var i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-7 + i * 6, -25);
        g.lineTo(-4 + i * 6, -21);
        g.lineTo(-1 + i * 6, -25);
        g.closePath();
        g.fill();
        g.lineWidth = 1.4;
        g.stroke();
      }
    } else if (el === 'ice') {
      g.fillStyle = theme.deep || '#111d44';
      g.beginPath();
      g.moveTo(-10, -35);
      g.quadraticCurveTo(-11, -46, 0, -55);
      g.quadraticCurveTo(11, -46, 10, -35);
      g.quadraticCurveTo(0, -30, -10, -35);
      g.closePath();
      g.fill(); g.stroke();
      // crescent mask
      g.fillStyle = colors.glow;
      g.beginPath();
      g.arc(0, -34, 7, Math.PI * 0.1, Math.PI * 0.9);
      g.arc(0, -37.5, 5.2, Math.PI * 0.85, Math.PI * 0.15, true);
      g.closePath();
      g.fill();
      g.strokeStyle = '#2a7a99';
      g.lineWidth = 1.4;
      g.stroke();
      // glowing eyes
      g.fillStyle = '#eaffff';
      g.beginPath(); g.arc(-2.6, -33.4, 1.3, 0, TAU); g.fill();
      g.beginPath(); g.arc(2.6, -33.4, 1.3, 0, TAU); g.fill();
      // ice crystal on hood
      g.fillStyle = '#d7fbff';
      g.strokeStyle = INK;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0, -55);
      g.lineTo(2.4, -50.5);
      g.lineTo(0, -47);
      g.lineTo(-2.4, -50.5);
      g.closePath();
      g.fill(); g.stroke();
    } else if (el === 'lightning') {
      // sun helmet
      g.fillStyle = '#ffbe2e';
      g.beginPath();
      g.arc(0, -34, 9.5, Math.PI, TAU);
      g.lineTo(9.5, -32);
      g.lineTo(-9.5, -32);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = '#ffd166';
      for (var r = 0; r < 6; r++) {
        var ra = Math.PI + (r / 5) * Math.PI;
        var rx = Math.cos(ra) * 12.5, ry = -34 + Math.sin(ra) * 12.5;
        g.beginPath();
        g.moveTo(Math.cos(ra - 0.16) * 9.2, -34 + Math.sin(ra - 0.16) * 9.2);
        g.lineTo(rx, ry);
        g.lineTo(Math.cos(ra + 0.16) * 9.2, -34 + Math.sin(ra + 0.16) * 9.2);
        g.closePath();
        g.fill();
        g.lineWidth = 1.2;
        g.stroke();
      }
      // visor
      g.fillStyle = '#3a2408';
      g.fillRect(-7, -35.5, 14, 3.4);
      g.fillStyle = '#fff9c9';
      g.fillRect(-5.4, -34.8, 10.8, 1.5);
      // plume
      g.fillStyle = '#ff6b3d';
      g.beginPath();
      g.moveTo(0, -44);
      g.quadraticCurveTo(0, -54, 8, -56);
      g.quadraticCurveTo(2, -48, 3, -43);
      g.closePath();
      g.fill(); g.stroke();
    } else {
      // witch hat
      g.fillStyle = theme.deep || '#1d3223';
      g.beginPath();
      g.ellipse(0, -37, 12.5, 3.6, 0, 0, TAU);
      g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(-7.5, -38);
      g.quadraticCurveTo(-4, -51, 3, -60);
      g.quadraticCurveTo(12, -62, 10, -55);
      g.quadraticCurveTo(5, -48, 7, -38);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = colors.glow;
      g.fillRect(-6, -42.5, 12, 3.2);
      g.strokeStyle = INK;
      g.lineWidth = 1.2;
      g.strokeRect(-6, -42.5, 12, 3.2);
      g.fillStyle = '#ffd166';
      g.fillRect(-1.8, -43.2, 3.6, 4.6);
      g.strokeRect(-1.8, -43.2, 3.6, 4.6);
      // goggles
      g.strokeStyle = '#294d18';
      g.lineWidth = 1.6;
      g.fillStyle = 'rgba(171,255,92,0.55)';
      g.beginPath(); g.arc(-3.2, -34, 2.6, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.arc(3.2, -34, 2.6, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = INK;
      g.beginPath(); g.moveTo(-6, -35.6); g.lineTo(-9.5, -37); g.stroke();
    }
  };

  SpellBrigadeGame.prototype._drawStaff = function (g, ent, colors, theme) {
    var aim = ent.aim || 0;
    var hx = Math.cos(aim) * 7;
    var hy = -16 + Math.sin(aim) * 4.4;
    var tx = Math.cos(aim) * 22;
    var ty = -17 + Math.sin(aim) * 15;
    g.save();
    g.strokeStyle = '#3a2a22';
    g.lineWidth = 2.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(tx, ty);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(hx + (tx - hx) * 0.2, hy + (ty - hy) * 0.2);
    g.stroke();
    // orb glow
    g.globalCompositeOperation = 'lighter';
    var pulse = 1 + Math.sin(this.uiTime * 6 + (ent.walk || 0)) * 0.14;
    var os = 26 * pulse;
    var spr = this.sprites.glow[ent.element] || this.sprites.glow.fire;
    g.globalAlpha = 0.85;
    g.drawImage(spr, tx - os / 2, ty - os / 2, os, os);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = colors.glow;
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(tx, ty, 3.1 * pulse, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(tx - 0.8, ty - 0.8, 1.1, 0, TAU);
    g.fill();
    g.restore();
  };

  SpellBrigadeGame.prototype._drawDowned = function (g, ent, S) {
    var theme = ent.theme || FALLBACK_THEMES.fire;
    var total = (this.player.mods.reviveTime || 8);
    var frac = clamp(1 - ent.reviveT / total, 0, 1);
    g.save();
    g.globalAlpha = 0.55;
    g.drawImage(this.sprites.shadow, ent.x - ent.r * 2.4, ent.y - ent.r * 0.5, ent.r * 4.8, ent.r * 2.1);
    g.translate(ent.x, ent.y - 4);
    g.rotate(-Math.PI / 2 + 0.15);
    g.scale(S, S);
    g.globalAlpha = 0.62;
    g.beginPath();
    g.moveTo(-8.5, -2);
    g.quadraticCurveTo(-11, -12, -7, -20);
    g.quadraticCurveTo(0, -24, 7, -20);
    g.quadraticCurveTo(11, -12, 8.5, -2);
    g.closePath();
    g.fillStyle = (theme.gradient || ['#888', '#666'])[0];
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2.2;
    g.stroke();
    g.beginPath();
    g.arc(0, -28, 7.4, 0, TAU);
    g.fillStyle = CREAM;
    g.fill();
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-4, -30); g.lineTo(-1, -27); g.moveTo(-1, -30); g.lineTo(-4, -27); g.stroke();
    g.beginPath(); g.moveTo(2, -30); g.lineTo(5, -27); g.moveTo(5, -30); g.lineTo(2, -27); g.stroke();
    g.restore();

    // revive progress + stars
    g.save();
    g.globalAlpha = 0.9;
    g.strokeStyle = 'rgba(20,24,30,0.5)';
    g.lineWidth = 4;
    g.beginPath(); g.arc(ent.x, ent.y - 2, ent.r + 10, 0, TAU); g.stroke();
    g.strokeStyle = ELEM.ice.glow;
    g.lineWidth = 3.4;
    g.beginPath();
    g.arc(ent.x, ent.y - 2, ent.r + 10, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
    g.stroke();
    for (var i = 0; i < 3; i++) {
      var a = this.uiTime * 2 + i * (TAU / 3);
      var sx = ent.x + Math.cos(a) * 20;
      var sy = ent.y - 22 + Math.sin(a) * 7;
      g.fillStyle = 'rgba(255,244,216,' + (0.45 + 0.4 * Math.abs(Math.sin(this.uiTime * 3 + i))) + ')';
      g.beginPath();
      g.arc(sx, sy, 1.8, 0, TAU);
      g.fill();
    }
    g.restore();
  };
  SpellBrigadeGame.prototype._drawEnemy = function (g, e) {
    var r = e.r;
    var t = this.uiTime;
    if (e.elite) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      var pulse = 0.5 + 0.5 * Math.sin(t * 4 + e.wob);
      g.globalAlpha = 0.18 + 0.14 * pulse;
      g.drawImage(this.sprites.glow.fire, e.x - r * 2.6, e.y - r * 2.6, r * 5.2, r * 5.2);
      g.globalAlpha = 0.5 + 0.25 * pulse;
      g.strokeStyle = '#ffd166';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(e.x, e.y, r * 1.9 + pulse * 3, 0, TAU);
      g.stroke();
      for (var sp = 0; sp < 3; sp++) {
        var sa = t * 1.8 + sp * (TAU / 3);
        g.globalAlpha = 0.8;
        g.fillStyle = '#ffd166';
        g.beginPath();
        g.arc(e.x + Math.cos(sa) * r * 2.1, e.y + Math.sin(sa) * r * 1.4, 2.2, 0, TAU);
        g.fill();
      }
      g.restore();
    }

    g.save();
    if (e.kind === 'crawler') {
      var bounce = Math.abs(Math.sin(e.anim * 7)) * r * 0.14;
      g.translate(e.x, e.y + bounce);
      g.scale(e.facing < 0 ? -1 : 1, 1);
      g.strokeStyle = INK;
      g.lineWidth = Math.max(1.6, r * 0.16);
      g.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        var lx = i * r * 0.5;
        var swing = Math.sin(e.anim * 7 + i * 1.4) * r * 0.22;
        g.beginPath();
        g.moveTo(lx, -r * 0.25);
        g.lineTo(lx + swing, r * 0.62);
        g.stroke();
      }
      g.beginPath();
      g.ellipse(0, -r * 0.6, r * 1.02, r * 0.84, 0, 0, TAU);
      g.fillStyle = '#3f5a3f';
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = Math.max(2, r * 0.2);
      g.stroke();
      g.beginPath();
      g.ellipse(0, -r * 0.42, r * 0.56, r * 0.42, 0, 0, TAU);
      g.fillStyle = '#71905a';
      g.fill();
      g.fillStyle = 'rgba(171,255,92,0.35)';
      g.beginPath(); g.arc(-r * 0.45, -r * 0.75, r * 0.16, 0, TAU); g.fill();
      g.beginPath(); g.arc(r * 0.4, -r * 0.6, r * 0.13, 0, TAU); g.fill();
      // horns
      g.fillStyle = '#c9a0ff';
      g.strokeStyle = INK;
      g.lineWidth = Math.max(1.4, r * 0.12);
      g.beginPath(); g.moveTo(-r * 0.68, -r * 1.2); g.lineTo(-r * 0.9, -r * 1.48); g.lineTo(-r * 0.38, -r * 1.3); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(r * 0.68, -r * 1.2); g.lineTo(r * 0.9, -r * 1.48); g.lineTo(r * 0.38, -r * 1.3); g.closePath(); g.fill(); g.stroke();
      // eyes
      g.fillStyle = '#fff4d8';
      g.beginPath(); g.arc(-r * 0.34, -r * 0.75, r * 0.24, 0, TAU); g.fill();
      g.beginPath(); g.arc(r * 0.34, -r * 0.75, r * 0.24, 0, TAU); g.fill();
      g.fillStyle = INK;
      g.beginPath(); g.arc(-r * 0.3, -r * 0.77, r * 0.11, 0, TAU); g.fill();
      g.beginPath(); g.arc(r * 0.38, -r * 0.77, r * 0.11, 0, TAU); g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 1.5;
      g.beginPath(); g.arc(0, -r * 0.42, r * 0.2, 0.25, Math.PI - 0.25); g.stroke();
      // little glowcap mushroom
      g.fillStyle = '#ffd166';
      g.strokeStyle = INK;
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(r * 0.42, -r * 1.25, r * 0.26, Math.PI, TAU);
      g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = '#fff4d8';
      g.fillRect(r * 0.42 - r * 0.05, -r * 1.24, r * 0.1, r * 0.22);
    } else if (e.kind === 'bat') {
      var flap = Math.sin(e.anim * 13) * r * 0.8;
      g.translate(e.x, e.y + Math.sin(e.anim * 4) * r * 0.22);
      g.scale(e.facing < 0 ? -1 : 1, 1);
      g.fillStyle = '#5a3c66';
      g.strokeStyle = INK;
      g.lineWidth = Math.max(1.6, r * 0.16);
      g.beginPath();
      g.moveTo(-r * 0.25, -r * 0.85);
      g.quadraticCurveTo(-r * 2.1, -r * 1.5 - flap, -r * 2.6, -r * 0.25);
      g.quadraticCurveTo(-r * 1.5, -r * 0.1, -r * 0.35, -r * 0.2);
      g.closePath();
      g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(r * 0.25, -r * 0.85);
      g.quadraticCurveTo(r * 2.1, -r * 1.5 - flap, r * 2.6, -r * 0.25);
      g.quadraticCurveTo(r * 1.5, -r * 0.1, r * 0.35, -r * 0.2);
      g.closePath();
      g.fill(); g.stroke();
      g.beginPath();
      g.ellipse(0, -r * 0.58, r * 0.62, r * 0.7, 0, 0, TAU);
      g.fillStyle = '#6b4a78';
      g.fill(); g.stroke();
      g.fillStyle = '#5a3c66';
      g.beginPath(); g.moveTo(-r * 0.4, -r * 1.1); g.lineTo(-r * 0.15, -r * 1.55); g.lineTo(-r * 0.02, -r * 1.05); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(r * 0.4, -r * 1.1); g.lineTo(r * 0.15, -r * 1.55); g.lineTo(r * 0.02, -r * 1.05); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffe14d';
      g.beginPath(); g.arc(-r * 0.22, -r * 0.7, r * 0.16, 0, TAU); g.fill();
      g.beginPath(); g.arc(r * 0.22, -r * 0.7, r * 0.16, 0, TAU); g.fill();
      g.fillStyle = INK;
      g.beginPath(); g.arc(-r * 0.2, -r * 0.7, r * 0.07, 0, TAU); g.fill();
      g.beginPath(); g.arc(r * 0.24, -r * 0.7, r * 0.07, 0, TAU); g.fill();
      g.fillStyle = '#fff4d8';
      g.beginPath(); g.moveTo(-r * 0.14, -r * 0.38); g.lineTo(-r * 0.05, -r * 0.15); g.lineTo(-r * 0.22, -r * 0.22); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(r * 0.14, -r * 0.38); g.lineTo(r * 0.05, -r * 0.15); g.lineTo(r * 0.22, -r * 0.22); g.closePath(); g.fill();
    } else if (e.kind === 'eye') {
      var float = Math.sin(e.anim * 2.6) * r * 0.5;
      g.translate(e.x, e.y - r * 0.7 + float);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.3;
      g.drawImage(this.sprites.glow.ice, -r * 2, -r * 2, r * 4, r * 4);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.strokeStyle = '#8a5fa8';
      g.lineWidth = Math.max(1.6, r * 0.2);
      g.lineCap = 'round';
      for (var tnt = 0; tnt < 4; tnt++) {
        var ta = -0.9 + tnt * 0.6 + Math.sin(e.anim * 2.4 + tnt) * 0.25;
        g.beginPath();
        g.moveTo((tnt - 1.5) * r * 0.32, r * 0.72);
        g.quadraticCurveTo(
          (tnt - 1.5) * r * 0.5 + Math.cos(ta) * r * 0.4,
          r * 1.15,
          (tnt - 1.5) * r * 0.6 + Math.cos(ta) * r * 0.6,
          r * 1.5 + Math.sin(e.anim * 3 + tnt) * r * 0.2
        );
        g.stroke();
      }
      g.beginPath(); g.arc(0, 0, r * 1.02, 0, TAU);
      g.fillStyle = '#fff4d8';
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = Math.max(2, r * 0.2);
      g.stroke();
      g.beginPath(); g.arc(r * 0.1, 0, r * 0.62, 0, TAU);
      g.fillStyle = '#c9a0ff';
      g.fill();
      g.strokeStyle = '#5a3c66';
      g.lineWidth = Math.max(1.4, r * 0.14);
      g.stroke();
      g.beginPath(); g.arc(r * 0.18, r * 0.05, r * 0.32, 0, TAU);
      g.fillStyle = INK;
      g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(r * 0.34, -r * 0.18, r * 0.12, 0, TAU); g.fill();
      // crown
      g.fillStyle = '#ffd166';
      g.strokeStyle = INK;
      g.lineWidth = 1.3;
      for (var cr = -1; cr <= 1; cr++) {
        g.beginPath();
        g.moveTo(cr * r * 0.42 - r * 0.16, -r * 1.08);
        g.lineTo(cr * r * 0.42, -r * 1.5);
        g.lineTo(cr * r * 0.42 + r * 0.16, -r * 1.08);
        g.closePath();
        g.fill(); g.stroke();
      }
    } else {
      // brute
      g.translate(e.x, e.y + Math.sin(e.anim * 2) * r * 0.08);
      g.scale(e.facing < 0 ? -1 : 1, 1);
      g.fillStyle = '#4a4f5c';
      g.strokeStyle = INK;
      g.lineWidth = Math.max(2.4, r * 0.14);
      g.beginPath();
      g.moveTo(-r * 0.95, -r * 0.1);
      g.quadraticCurveTo(-r * 1.15, -r * 1.05, -r * 0.7, -r * 1.35);
      g.quadraticCurveTo(0, -r * 1.6, r * 0.7, -r * 1.35);
      g.quadraticCurveTo(r * 1.15, -r * 1.05, r * 0.95, -r * 0.1);
      g.closePath();
      g.fill(); g.stroke();
      // chest plate
      g.beginPath();
      g.moveTo(-r * 0.62, -r * 0.75);
      g.quadraticCurveTo(0, -r * 1.05, r * 0.62, -r * 0.75);
      g.lineTo(r * 0.5, -r * 0.25);
      g.quadraticCurveTo(0, -r * 0.1, -r * 0.5, -r * 0.25);
      g.closePath();
      g.fillStyle = '#6f7787';
      g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,244,216,0.16)';
      g.fillRect(-r * 0.45, -r * 0.72, r * 0.2, r * 0.48);
      g.fillStyle = '#ffbe2e';
      g.beginPath(); g.arc(0, -r * 0.52, r * 0.12, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(20,22,28,0.6)';
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-r * 0.3, -r * 0.35); g.lineTo(-r * 0.1, -r * 0.18); g.stroke();
      // shoulder spikes
      g.fillStyle = '#c9c4b4';
      g.strokeStyle = INK;
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-r * 0.85, -r * 1.18); g.lineTo(-r * 1.25, -r * 1.55); g.lineTo(-r * 0.5, -r * 1.3); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(r * 0.85, -r * 1.18); g.lineTo(r * 1.25, -r * 1.55); g.lineTo(r * 0.5, -r * 1.3); g.closePath(); g.fill(); g.stroke();
      // head
      g.beginPath(); g.arc(0, -r * 1.62, r * 0.46, 0, TAU);
      g.fillStyle = '#3f4450';
      g.fill(); g.stroke();
      g.fillStyle = '#ffbe2e';
      g.beginPath(); g.arc(-r * 0.17, -r * 1.66, r * 0.09, 0, TAU); g.fill();
      g.beginPath(); g.arc(r * 0.17, -r * 1.66, r * 0.09, 0, TAU); g.fill();
      g.fillStyle = INK;
      g.fillRect(-r * 0.24, -r * 1.52, r * 0.48, r * 0.06);
      // fists
      g.fillStyle = '#6f7787';
      g.strokeStyle = INK;
      g.lineWidth = 2;
      g.beginPath(); g.arc(-r * 1.0, -r * 0.6, r * 0.28, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.arc(r * 1.0, -r * 0.6, r * 0.28, 0, TAU); g.fill(); g.stroke();
      // legs
      g.fillStyle = '#3f4450';
      g.fillRect(-r * 0.55, -r * 0.1, r * 0.32, r * 0.5);
      g.fillRect(r * 0.23, -r * 0.1, r * 0.32, r * 0.5);
      // charge telegraph
      if (e.state === 'wind') {
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.55;
        g.strokeStyle = '#ffb02e';
        g.lineWidth = 2;
        g.beginPath(); g.arc(0, -r * 1.2, r * 1.7, 0, TAU); g.stroke();
      }
    }
    g.restore();

    // freeze / slow tint + hurt flash
    if (e.freezeT > 0) {
      g.save();
      g.globalAlpha = 0.4;
      g.fillStyle = '#74e4ff';
      g.beginPath(); g.ellipse(e.x, e.y - r * 0.6, r * 1.15, r * 1.25, 0, 0, TAU); g.fill();
      g.globalAlpha = 0.7;
      g.strokeStyle = '#d7fbff';
      g.lineWidth = 1.4;
      for (var ic = 0; ic < 3; ic++) {
        var ia = ic * 2.1 + 0.4;
        g.beginPath();
        g.moveTo(e.x + Math.cos(ia) * r * 0.3, e.y - r * 0.6 + Math.sin(ia) * r * 0.3);
        g.lineTo(e.x + Math.cos(ia) * r * 1.1, e.y - r * 0.6 + Math.sin(ia) * r * 1.1);
        g.stroke();
      }
      g.restore();
    }
    if (e.hurtT > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(0.8, e.hurtT * 4.5);
      g.drawImage(this.sprites.white, e.x - r * 1.8, e.y - r * 2.2, r * 3.6, r * 3.6);
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawBoss = function (g, b) {
    var introP = b.introT > 0 ? clamp(1 - b.introT / (this.bossIntroMax || 2.6), 0, 1) : 1;
    var scale = 0.55 + 0.45 * easeOutCubic(introP);
    var alpha = 0.15 + 0.85 * easeOutCubic(introP);
    var bob = Math.sin(b.anim * 2.1) * 6;
    var t = this.uiTime;
    g.save();
    g.globalAlpha = alpha;
    // menace aura
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = alpha * (0.28 + 0.12 * Math.sin(t * 3));
    var auraSpr = this.sprites.glow.fire;
    var auraS = b.r * 4.6;
    g.drawImage(auraSpr, b.x - auraS / 2, b.y - auraS / 2 + bob, auraS, auraS);
    if (b.enraged) {
      g.globalAlpha = alpha * (0.2 + 0.14 * Math.sin(t * 7));
      var auraS2 = b.r * 3.4;
      g.drawImage(this.sprites.glow.ice, b.x - auraS2 / 2, b.y - auraS2 / 2 + bob, auraS2, auraS2);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = alpha;
    g.translate(b.x, b.y + bob);
    g.scale(scale * (b.facing < 0 ? -1 : 1), scale);
    var r = b.r;

    // cloak with animated wavy hem
    g.beginPath();
    g.moveTo(-r * 0.55, -r * 0.85);
    g.quadraticCurveTo(-r * 1.0, -r * 0.2, -r * 1.15, r * 0.95);
    for (var w = 0; w <= 6; w++) {
      var wx = -r * 1.15 + (w / 6) * r * 2.3;
      var wy = r * 0.95 + Math.sin(t * 2.4 + w * 1.15) * r * 0.14 - (w % 2) * r * 0.12;
      g.lineTo(wx, wy);
    }
    g.quadraticCurveTo(r * 1.0, -r * 0.2, r * 0.55, -r * 0.85);
    g.quadraticCurveTo(0, -r * 1.05, -r * 0.55, -r * 0.85);
    g.closePath();
    g.fillStyle = b.enraged ? '#3a1436' : '#26122f';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.stroke();
    // cloak trim glow
    g.strokeStyle = b.enraged ? 'rgba(255,93,143,0.65)' : 'rgba(201,160,255,0.5)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-r * 1.05, r * 0.8);
    for (var w2 = 0; w2 <= 6; w2++) {
      var wx2 = -r * 1.05 + (w2 / 6) * r * 2.1;
      var wy2 = r * 0.8 + Math.sin(t * 2.4 + w2 * 1.15) * r * 0.12;
      g.lineTo(wx2, wy2);
    }
    g.stroke();
    // inner glow chest
    g.beginPath();
    g.ellipse(0, -r * 0.25, r * 0.5, r * 0.42, 0, 0, TAU);
    g.fillStyle = b.enraged ? 'rgba(255,93,143,0.35)' : 'rgba(201,160,255,0.22)';
    g.fill();
    // arms / claws
    g.fillStyle = '#33203d';
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-r * 0.75, -r * 0.55);
    g.quadraticCurveTo(-r * 1.35, -r * 0.3, -r * 1.2, r * 0.15);
    g.quadraticCurveTo(-r * 0.9, r * 0.2, -r * 0.65, -r * 0.1);
    g.closePath();
    g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(r * 0.75, -r * 0.55);
    g.quadraticCurveTo(r * 1.35, -r * 0.3, r * 1.2, r * 0.15);
    g.quadraticCurveTo(r * 0.9, r * 0.2, r * 0.65, -r * 0.1);
    g.closePath();
    g.fill(); g.stroke();
    // head
    g.beginPath();
    g.ellipse(0, -r * 0.78, r * 0.52, r * 0.46, 0, 0, TAU);
    g.fillStyle = '#2b1636';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 3.4;
    g.stroke();
    // horns / crown
    g.fillStyle = '#c9a0ff';
    g.strokeStyle = INK;
    g.lineWidth = 2;
    var hornPts = [[-0.42, -1.02, -0.72, -1.55, -0.16, -1.16], [0, -1.12, 0.02, -1.72, 0.2, -1.18], [0.42, -1.02, 0.72, -1.55, 0.16, -1.16]];
    for (var hp = 0; hp < hornPts.length; hp++) {
      var hh = hornPts[hp];
      g.beginPath();
      g.moveTo(r * hh[0], r * hh[1]);
      g.lineTo(r * hh[2], r * hh[3]);
      g.lineTo(r * hh[4], r * hh[5]);
      g.closePath();
      g.fill(); g.stroke();
    }
    // crown band
    g.fillStyle = '#ffd166';
    g.strokeStyle = INK;
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-r * 0.44, -r * 1.04);
    g.lineTo(-r * 0.5, -r * 0.9);
    g.lineTo(r * 0.5, -r * 0.9);
    g.lineTo(r * 0.44, -r * 1.04);
    g.closePath();
    g.fill(); g.stroke();
    // eye sockets
    g.fillStyle = '#140c1a';
    g.beginPath(); g.ellipse(-r * 0.24, -r * 0.84, r * 0.17, r * 0.13, 0.22, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(r * 0.24, -r * 0.84, r * 0.17, r * 0.13, -0.22, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, -r * 1.08, r * 0.1, 0, TAU); g.fill();
    // burning eyes
    var eyeGlow = b.enraged ? '#ff5d8f' : '#ff9ec4';
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.95;
    g.fillStyle = eyeGlow;
    g.beginPath(); g.ellipse(-r * 0.24, -r * 0.84, r * 0.11, r * 0.085, 0.22, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(r * 0.24, -r * 0.84, r * 0.11, r * 0.085, -0.22, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, -r * 1.08, r * 0.075, 0, TAU); g.fill();
    g.fillStyle = '#fff4d8';
    g.beginPath(); g.ellipse(-r * 0.24, -r * 0.85, r * 0.045, r * 0.04, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(r * 0.24, -r * 0.85, r * 0.045, r * 0.04, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, -r * 1.08, r * 0.028, 0, TAU); g.fill();
    g.globalAlpha = 0.5;
    g.drawImage(this.sprites.glow.fire, -r * 1.1, -r * 1.75, r * 2.2, r * 1.9);
    g.restore();
    g.fillStyle = '#1b1220';
    g.beginPath(); g.ellipse(-r * 0.24, -r * 0.84, r * 0.03, r * 0.075, 0.22, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(r * 0.24, -r * 0.84, r * 0.03, r * 0.075, -0.22, 0, TAU); g.fill();
    // fanged grin
    g.strokeStyle = 'rgba(255,244,216,0.85)';
    g.lineWidth = 2.4;
    g.beginPath();
    g.arc(0, -r * 0.58, r * 0.3, 0.2, Math.PI - 0.2);
    g.stroke();
    g.fillStyle = '#fff4d8';
    g.beginPath();
    g.moveTo(-r * 0.17, -r * 0.5); g.lineTo(-r * 0.12, -r * 0.4); g.lineTo(-r * 0.07, -r * 0.5);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(r * 0.17, -r * 0.5); g.lineTo(r * 0.12, -r * 0.4); g.lineTo(r * 0.07, -r * 0.5);
    g.closePath(); g.fill();
    // shoulder spikes
    g.fillStyle = '#c9a0ff';
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(-r * 0.7, -r * 0.62); g.lineTo(-r * 1.02, -r * 0.86); g.lineTo(-r * 0.5, -r * 0.46); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(r * 0.7, -r * 0.62); g.lineTo(r * 1.02, -r * 0.86); g.lineTo(r * 0.5, -r * 0.46); g.closePath(); g.fill(); g.stroke();
    g.restore();

    // interaction rings
    if (b.state === 'chargeWind' || b.state === 'volleyWind' || b.state === 'summonWind') {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 9);
      g.strokeStyle = '#ff5d8f';
      g.lineWidth = 3;
      g.beginPath(); g.arc(b.x, b.y - 20 + bob, b.r * 1.5, 0, TAU); g.stroke();
      g.restore();
    }
    if (b.hurtT > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(0.7, b.hurtT * 4);
      g.drawImage(this.sprites.white, b.x - 70, b.y - 90 + bob, 140, 140);
      g.restore();
    }
  };

  SpellBrigadeGame.prototype._drawOverlays = function (g) {
    var w = this.vw, h = this.vh;
    if (this._darkVig) {
      g.fillStyle = this._darkVig;
      g.fillRect(0, 0, w, h);
    }
    var p = this.player;
    if (p && p.hp > 0 && p.maxHp > 0) {
      var ratio = p.hp / p.maxHp;
      if (ratio < 0.42 && this._lowVig) {
        var pulse = 0.5 + 0.5 * Math.sin(this.uiTime * 6.4);
        g.globalAlpha = clamp((0.42 - ratio) / 0.42, 0, 1) * (0.32 + 0.3 * pulse);
        g.fillStyle = this._lowVig;
        g.fillRect(0, 0, w, h);
        g.globalAlpha = 1;
      }
    }
    if (this.screenFlash > 0) {
      g.globalAlpha = Math.min(0.55, this.screenFlash * 0.6);
      g.fillStyle = '#fff4d8';
      g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;
    }
    if (this.bossIntro > 0) {
      var max = this.bossIntroMax || 2.6;
      var elapsed = max - this.bossIntro;
      var a = Math.min(clamp(elapsed / 0.35, 0, 1), clamp(this.bossIntro / 0.5, 0, 1));
      if (a > 0) {
        var bh = Math.min(104, h * 0.155) * easeOutCubic(a);
        g.fillStyle = 'rgba(8,6,16,' + (0.9 * a) + ')';
        g.fillRect(0, 0, w, bh);
        g.fillRect(0, h - bh, w, bh);
        g.fillStyle = 'rgba(255,209,102,' + (0.55 * a) + ')';
        g.fillRect(0, bh - 2, w, 2);
        g.fillRect(0, h - bh, w, 2);
        g.globalAlpha = a;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = '700 ' + Math.round(Math.min(34, w * 0.086)) + 'px "ZCOOL KuaiLe","Microsoft YaHei",sans-serif';
        g.lineWidth = 6;
        g.strokeStyle = 'rgba(20,14,26,0.75)';
        var titleY = h / 2 - 16;
        var bossTitle = (this.boss && this.boss.name) || this.bossName || BOSS_NAME;
        g.strokeText(bossTitle, w / 2, titleY);
        g.fillStyle = '#ffd166';
        g.fillText(bossTitle, w / 2, titleY);
        g.font = '700 11px "Cinzel Decorative","Palatino Linotype",Georgia,serif';
        g.fillStyle = 'rgba(255,244,216,0.8)';
        g.fillText('NIGHTMARE LORD · THE LAST NIGHT', w / 2, titleY + 42);
        g.globalAlpha = 1;
        g.textAlign = 'left';
        g.textBaseline = 'alphabetic';
      }
    }
  };

  SpellBrigadeGame.prototype.render = function () {
    var g = this.ctx;
    var canvas = this.canvas;
    if (!g || !canvas) return;
    if (!this.vw || !this.vh) this.resize();
    var dpr = this.dpr || 1;
    var s = this.scale || 1;
    var zoom = this.camZoom || 1;
    var vw = this.vw, vh = this.vh;
    var camX = this.cam.x, camY = this.cam.y;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#0b0f0d';
    g.fillRect(0, 0, canvas.width, canvas.height);
    if (!this.ground) return;
    var k = dpr * s * zoom;
    var ox = dpr * (vw / 2 - camX * s * zoom + (this.shakeX || 0));
    var oy = dpr * (vh / 2 - camY * s * zoom + (this.shakeY || 0));
    g.setTransform(k, 0, 0, k, ox, oy);
    var halfW = vw / (2 * s * zoom) + 90;
    var halfH = vh / (2 * s * zoom) + 90;
    var left = camX - halfW, top = camY - halfH, right = camX + halfW, bottom = camY + halfH;
    var gx = clamp(Math.floor(left), 0, WORLD.w - 1);
    var gy = clamp(Math.floor(top), 0, WORLD.h - 1);
    var gx2 = clamp(Math.ceil(right), 0, WORLD.w);
    var gy2 = clamp(Math.ceil(bottom), 0, WORLD.h);
    var gw = gx2 - gx, gh = gy2 - gy;
    if (gw > 0 && gh > 0) g.drawImage(this.ground, gx, gy, gw, gh, gx, gy, gw, gh);
    this._drawAmbient(g, false, left, top, right, bottom);
    this._drawPools(g);
    this._drawGems(g);
    this._drawTelegraphs(g);
    this._drawActors(g, left, top, right, bottom);
    this._drawMeteors(g);
    this._drawProjectiles(g);
    this._drawArcs(g);
    this._drawParticles(g);
    this._drawNumbers(g);
    this._drawAmbient(g, true, left, top, right, bottom);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._drawOverlays(g);
  };

  /* ============================================================
     export
     ============================================================ */
  if (typeof window !== 'undefined') {
    window.SpellBrigadeGame = SpellBrigadeGame;
  }
})();
