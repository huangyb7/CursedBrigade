/* ============================================================
   咒语旅团 THE SPELL BRIGADE — 静态数据
   由 Lead 维护，UI 与引擎只读，禁止挂载时修改。
   传统脚本：全局 window.SB_DATA
   ============================================================ */
(function () {
  'use strict';

  var characters = [
    {
      id: 'jester',
      name: '笑面小丑',
      alias: '狂欢',
      en: 'THE JESTER',
      element: 'fire',
      role: '混乱术士',
      tagline: '笑声比火球先到。',
      blurb: '没人知道他在面具下藏了几副表情。唯一确定的是，他扔出的每一颗火星，都喜欢在怪物堆里多跳两下。',
      quote: '别眨眼——火烧起来的时候，才最好笑。',
      portrait: 'assets/wizard-jester.svg',
      startSpell: 'ember-bolt',
      theme: {
        accent: '#ff7a45',
        deep: '#35142c',
        glow: '#ffd166',
        gradient: ['#ff8a4c', '#ff4d8f']
      },
      stats: { power: 3, speed: 5, arcane: 4, vitality: 2 },
      statLabels: ['火力', '灵巧', '奥术', '生存'],
      difficulty: '进阶',
      difficultyLevel: 2,
      formation: { x: 0, y: 0 }
    },
    {
      id: 'moon',
      name: '月蚀祭司',
      alias: '塞勒涅',
      en: 'THE MOON',
      element: 'ice',
      role: '霜月祭司',
      tagline: '月光会把伤口缝好。',
      blurb: '她说话总是很慢，像怕惊动脚边的影子。可当那轮银色新月抬起时，整片战场都会安静下来。',
      quote: '嘘。月亮在听。',
      portrait: 'assets/wizard-moon.svg',
      startSpell: 'frost-shard',
      theme: {
        accent: '#74e4ff',
        deep: '#111d44',
        glow: '#c9f8ff',
        gradient: ['#4b8dff', '#b49bff']
      },
      stats: { power: 2, speed: 3, arcane: 5, vitality: 4 },
      statLabels: ['火力', '灵巧', '奥术', '生存'],
      difficulty: '稳健',
      difficultyLevel: 1,
      formation: { x: -58, y: 46 }
    },
    {
      id: 'sun',
      name: '日冕哨兵',
      alias: '赫利俄斯',
      en: 'THE SUN',
      element: 'lightning',
      role: '雷光守卫',
      tagline: '让太阳从你头顶砸下来。',
      blurb: '他坚信所有问题都能用更大的雷声解决。至于队友的头发为什么总是竖着——那是冒险的代价。',
      quote: '光会先到。审判随后就来。',
      portrait: 'assets/wizard-sun.svg',
      startSpell: 'storm-barrage',
      theme: {
        accent: '#ffe14d',
        deep: '#412612',
        glow: '#fff6c2',
        gradient: ['#ffbe2e', '#ff6b3d']
      },
      stats: { power: 5, speed: 3, arcane: 3, vitality: 4 },
      statLabels: ['火力', '灵巧', '奥术', '生存'],
      difficulty: '爽快',
      difficultyLevel: 2,
      formation: { x: 58, y: 46 }
    },
    {
      id: 'witch',
      name: '沼泽女巫',
      alias: '苔藓',
      en: 'THE WITCH',
      element: 'acid',
      role: '腐雾女巫',
      tagline: '坏主意通常长得像蘑菇。',
      blurb: '她的尖帽里永远搜得出三样东西：一瓶冒泡的绿药、一块发霉的饼干，以及一个绝妙的坏主意。',
      quote: '先别踩那滩绿色的东西——好吧，已经踩了。',
      portrait: 'assets/wizard-witch.svg',
      startSpell: 'acid-splash',
      theme: {
        accent: '#abff5c',
        deep: '#1d3223',
        glow: '#e2ffad',
        gradient: ['#8ee03c', '#8b5cf6']
      },
      stats: { power: 4, speed: 2, arcane: 5, vitality: 3 },
      statLabels: ['火力', '灵巧', '奥术', '生存'],
      difficulty: '控场',
      difficultyLevel: 2,
      formation: { x: 0, y: 88 }
    }
  ];

  var elements = {
    fire: {
      name: '烈焰',
      en: 'EMBER',
      color: '#ff6b3d',
      glow: '#ffd166',
      icon: 'assets/element-fire.svg',
      desc: '灼烧与溅射，把战场烧成一锅好汤。'
    },
    ice: {
      name: '霜月',
      en: 'FROST',
      color: '#74e4ff',
      glow: '#d7fbff',
      icon: 'assets/element-ice.svg',
      desc: '减速与冻结，让怪物的脚步慢成一场梦。'
    },
    lightning: {
      name: '惊雷',
      en: 'THUNDER',
      color: '#ffe14d',
      glow: '#fff9c9',
      icon: 'assets/element-lightning.svg',
      desc: '连锁弹射，吵闹、耀眼、绝不讲道理。'
    },
    acid: {
      name: '腐雾',
      en: 'ACID',
      color: '#abff5c',
      glow: '#ecffd2',
      icon: 'assets/element-acid.svg',
      desc: '持续腐蚀与扩散，耐心是一种绿色。'
    }
  };

  var spells = [
    {
      id: 'ember-bolt',
      name: '火花飞弹',
      en: 'EMBER BOLT',
      element: 'fire',
      icon: 'assets/spell-fireball.svg',
      type: 'weapon',
      desc: '朝最近的敌人投出会弹跳的火花，点燃命中的目标。'
    },
    {
      id: 'frost-shard',
      name: '霜月碎片',
      en: 'FROST SHARD',
      element: 'ice',
      icon: 'assets/spell-frost.svg',
      type: 'weapon',
      desc: '发射一枚追月冰晶，减速命中的敌人，并有机会冻结。'
    },
    {
      id: 'storm-barrage',
      name: '闪电弹幕',
      en: 'STORM BARRAGE',
      element: 'lightning',
      icon: 'assets/spell-lightning.svg',
      type: 'weapon',
      desc: '高频释放短促雷弹，命中后可在敌人之间连锁。'
    },
    {
      id: 'acid-splash',
      name: '酸雾喷溅',
      en: 'ACID SPLASH',
      element: 'acid',
      icon: 'assets/spell-acid.svg',
      type: 'weapon',
      desc: '抛出腐蚀性酸液，落点留下持续伤害的酸雾。'
    }
  ];

  var difficulties = [
    {
      id: 'easy',
      name: '学徒之夜',
      en: 'APPRENTICE',
      desc: '怪物更少，出手更轻。适合第一次踏进遗忘回廊。',
      enemyScale: 0.82,
      enemyDamage: 0.75,
      spawnScale: 0.85,
      reward: '轻松'
    },
    {
      id: 'normal',
      name: '月蚀之夜',
      en: 'ECLIPSE',
      desc: '标准的旅团试炼。撑过 150 秒，别让篝火熄灭。',
      enemyScale: 1,
      enemyDamage: 1,
      spawnScale: 1,
      reward: '标准'
    },
    {
      id: 'nightmare',
      name: '梦魇之潮',
      en: 'NIGHTMARE',
      desc: '怪物更快、更狠、更不讲武德。为老练的旅团准备。',
      enemyScale: 1.32,
      enemyDamage: 1.25,
      spawnScale: 1.18,
      reward: '荣耀'
    }
  ];

  window.SB_DATA = {
    meta: {
      title: '咒语旅团',
      en: 'THE SPELL BRIGADE',
      subtitle: '肉鸽合作 · 元素弹幕 · 四人小队',
      version: '1.0.0 H5 DEMO',
      stageName: '遗忘回廊',
      stageEn: 'THE FORGOTTEN CLOISTER',
      objective: '撑过 150 秒，等待黎明',
      timeLimit: 150,
      bossTime: 120,
      loadingLines: [
        '正在点亮旅团篝火…',
        '正在给法杖灌装坏脾气…',
        '正在说服月亮保持安静…',
        '正在清点回来的队友…'
      ],
      home: {
        kicker: 'ROGUELITE CO-OP · 4 WIZARDS',
        titleTop: '别怕，',
        titleBottom: '队友比怪物更疯。',
        desc: '在黎明之前，把笑声、月光、雷火和酸雾，统统砸向那群不请自来的家伙。',
        cta: '开始冒险',
        secondaryCta: '小队集结',
        chips: ['4 人小队', '元素弹幕', '肉鸽升级'],
        disclaimer: 'H5 演示版 · 3 位 AI 巫师自动补位',
        corner: '失落纪元 · 第 07 号遗迹'
      },
      lobby: {
        title: '小队集结',
        subtitle: '篝火还亮着。把你的疯子们叫齐。',
        ready: '已就位',
        player: '你',
        ai: 'AI 巫师',
        invite: '复制邀请',
        codeLabel: '房间码',
        enter: '踏入遗迹',
        difficultyLabel: '选择今夜难度'
      },
      result: {
        victoryTitle: '黎明，来了',
        victorySub: '你们把整座遗迹的笑声都吵醒了。',
        defeatTitle: '篝火，熄了',
        defeatSub: '别担心，巫师的命比看上去硬。',
        again: '再战一次',
        lobby: '返回大厅',
        share: '分享战绩'
      },
      share: {
        codePrefix: 'SPB',
        title: '咒语旅团 · 组队开启弹幕冒险',
        text: '我在《咒语旅团》撑过了 {time} 秒，干掉了 {kills} 只怪物！火冰电酸都到齐了，就差你一个。组队开启弹幕冒险！',
        button: '组队开启弹幕冒险',
        copy: '复制邀请文案',
        copied: '已复制，去骚扰你的朋友吧',
        hashtags: '#咒语旅团 #THE SPELL BRIGADE #H5游戏'
      },
      waves: [
        { at: 0, name: '第一夜', sub: '雾里有东西在动。' },
        { at: 30, name: '第二夜', sub: '它们开始学会绕后了。' },
        { at: 60, name: '第三夜', sub: '月亮被谁咬掉了一口。' },
        { at: 90, name: '第四夜', sub: '地面在呼吸。' },
        { at: 120, name: '最后之夜', sub: '梦魇领主醒了。' }
      ],
      tips: [
        '拖动左侧摇杆移动，巫师会自动施法。',
        '冲刺可以穿过怪物，还能躲掉一次伤害。',
        '每升一级，可以从三项法术共鸣中选择一项。',
        '先清掉会远程吐司的漂浮眼，再理会爬行怪。',
        '如果你看见绿雾，别站在里面——那是你们女巫的。'
      ],
      credits: '灵感来自 The Spell Brigade · 本作为学习演示项目，非官方作品'
    },
    characters: characters,
    elements: elements,
    spells: spells,
    difficulties: difficulties,
    getCharacter: function (id) {
      for (var i = 0; i < characters.length; i++) {
        if (characters[i].id === id) return characters[i];
      }
      return characters[0];
    },
    getElement: function (id) {
      return elements[id] || elements.fire;
    },
    getSpell: function (id) {
      for (var i = 0; i < spells.length; i++) {
        if (spells[i].id === id) return spells[i];
      }
      return spells[0];
    }
  };
})();
