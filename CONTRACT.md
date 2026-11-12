# 咒语旅团 THE SPELL BRIGADE — 团队开发契约 v1

> 本文件由 Lead 维护。所有成员必须遵守，不得修改本文件（有异议先给 Lead 发消息）。
> 目标：一个可直接双击打开的 H5 游戏（竖屏优先，桌面端居中手机框预览），风格为怪诞 Q 萌欧美卡通 + 暗黑童话油画质感 + 高饱和魔法色。

---

## 1. 项目结构 / 写权限边界

```
D:\AI\小游戏\
  index.html               <- screen-smith  (UI 负责人)
  css\style.css            <- screen-smith
  css\fonts.css            <- lead（字体，已由 Lead 提供，不要修改）
  js\ui.js                 <- screen-smith（页面路由、HUD、弹窗、触控 UI）
  js\game.js               <- engine-smith（Canvas 战斗引擎，唯一负责人）
  js\data.js               <- lead（角色/法术静态数据，已由 Lead 提供，不要修改）
  js\audio.js              <- lead（程序化 WebAudio，已由 Lead 提供）
  assets\*.svg             <- artisan（美术资产，唯一负责人）
  assets\fonts\*           <- lead
  _review\                 <- 截图/测试产物，可写
  CONTRACT.md              <- lead
  README.md                <- lead
```

**严禁跨边界写文件。** 需要协作时发消息给 Lead。
禁止引入 npm / CDN / 框架 / TypeScript。仅原生 HTML/CSS/JS。
必须使用传统 `<script src="...">`（非 ES module），保证 `file://` 双击可用。
不要使用 fetch 加载本地 JSON/字体（file:// 会跨域失败）。

---

## 2. 视觉基准

- 关键词：The Spell Brigade 咒语旅团、怪诞 Q 萌欧美卡通、暗黑童话油画质感、高饱和魔法配色、粗黑轮廓手绘、俯视角魔法弹幕、肉鸽合作巫师。
- 色彩令牌（必须使用，写在 `:root`）：见 `css/fonts.css` 的 `:root` 变量；命名：
  `--ink #1b1220` 轮廓、`--night #140f24` 深夜、`--plum #3a1f4f`、`--moss #1d4536`、
  `--cream #fff4d8`、`--gold #ffd166`、`--fire #ff6b3d`、`--ice #74e4ff`、
  `--thunder #ffe14d`、`--acid #abff5c`、`--rose #ff5d8f`。
- 笔画：角色/图标使用不均匀粗轮廓（3–6px @ 128px），内部有手绘高光与暗部。
- 质感：用 SVG `feTurbulence`/`feDisplacementMap`/半透明纹理斑块做出油画颗粒；禁止写实人物、照片、3D 写实。
- 禁止：水印、无意义文字、杂乱元素、畸形肢体、六指、写实人脸、血腥恐怖。
- 字体：`var(--font-display)` 中文展示、`var(--font-fantasy)` 英文标题、`var(--font-body)` 正文。已在 fonts.css 中定义。

---

## 3. 页面 / 屏幕流

单页应用，所有屏幕都在 `index.html`，使用 `section.screen` + `.is-active` 切换。
屏幕顺序：`loading -> home -> roster -> lobby -> game -> result`。
浮层：升级三选一、暂停、分享海报、设置/帮助、Toast。

### 3.1 UI 必需元素与 ID（engine-smith 会依赖）
```html
<!-- 游戏屏 -->
<canvas id="game-canvas"></canvas>          <!-- 放在 #battle-stage 内，开始游戏后必须有非零尺寸 -->
<div id="joystick-zone"><div id="joystick-knob"></div></div> <!-- 引擎自动绑定；仅游戏屏显示 -->
<button id="btn-dash">...</button>            <!-- 引擎自动绑定；游戏屏 -->
<div id="hud-...">                            <!-- UI 自己维护，引擎只通过回调提供数据 -->
```
- UI 必须提供 `#screen-game.is-active` 并在调用 `startGame` 前让 `#battle-stage` 可见、尺寸非零。
- 引擎只操作 `#game-canvas` 内部像素，不改 HUD DOM。
- 触摸摇杆范围就是 `#joystick-zone`；`#joystick-knob` 是视觉元素。引擎设置 style transform。UI 负责这两种元素外观。
- `#btn-dash` 上可放 `<span id="dash-cooldown">`，引擎不修改其内容（避免冲突），UI 用 HUD 回调更新。

### 3.2 路由建议
`showScreen(name)` 负责：
1. 给所有 `.screen` 移除 `.is-active`，给目标加 `.is-active`；`document.body.dataset.screen = name`。
2. 更新 hash（`#home` 等），但不强制依赖 hash。
3. 进入 game 时启动；离开 game 时清理引擎。
4. 首次用户手势时调用 `SBAudio.init()`。

调试参数（必须支持，供 Lead 截图验收）：
- `?screen=home|roster|lobby|result|share` 可直接打开对应屏幕。
- `?screen=game` 用默认角色/难度直接开局。
- `?nofx=1` 关闭加载动画（便于截图）。
- `?autostart=1` 跳过 loading 直接到 home。

---

## 4. 静态数据 `window.SB_DATA`（由 Lead 提供）

结构（已实现于 `js/data.js`）：
```js
SB_DATA.meta = { title:'咒语旅团', en:'THE SPELL BRIGADE', tagline, ... }
SB_DATA.characters = [{
  id, name, alias, en, element,                 // element: fire|ice|lightning|acid
  role, tagline, blurb, quote,
  portrait,                                     // assets/wizard-xxx.svg
  startSpell,
  theme:{ accent, deep, glow, gradient:[c1,c2] },
  stats:{ power, speed, arcane, vitality },     // 1-5
  difficulty, difficultyLevel
}]
SB_DATA.elements = { fire:{name,en,color,glow,icon,desc}, ... }
SB_DATA.spells = [{ id,name,en,element,icon,desc,type }]
SB_DATA.difficulties = [{ id:'easy'|'normal'|'nightmare', name, desc, enemyScale, reward }]
SB_DATA.share = { title, text, hashtags, codePrefix }
```
UI 直接读取，禁止修改。

---

## 5. 美术资产清单（artisan 交付，文件名不可变）

全部为 SVG，透明背景，自包含（无外部图片、无字体、无脚本、无可变 ID 冲突）。风格统一。

| 文件 | viewBox / 尺寸 | 内容 |
|---|---|---|
| `assets/hero-scene.svg` | 1080x1920 | H5 开屏主视觉：暗黑童话遗迹草地，4 名巫师站在中央偏下，巨大月亮/魔法阵/传送门背景，火冰电酸弹幕与符文环绕，远处怪物剪影，魔法光晕。顶部 22% 和底部 24% 相对安静，供 Logo/CTA 叠字。不要任何文字/水印/边框。 |
| `assets/crest.svg` | 512x512 | 旅团徽记：新月 + 星星 + 交叉法杖/短剑，粗轮廓，金/紫/青，可做 loading 与 Logo 点缀。 |
| `assets/wizard-jester.svg` | 900x1200 | 角色立绘：咧嘴小丑巫师（火），尖角小丑帽、夸张笑面面具/彩绘脸、铃铛、火焰法术悬浮，Q 版 3.5 头身，居中。透明背景。 |
| `assets/wizard-moon.svg` | 900x1200 | 角色立绘：月亮面具巫师（冰），深蓝长袍、巨大新月面具、冰晶悬浮。 |
| `assets/wizard-sun.svg` | 900x1200 | 角色立绘：太阳头盔巫师（雷），青铜太阳盔、暖金战袍、闪电弧。 |
| `assets/wizard-witch.svg` | 900x1200 | 角色立绘：尖帽女巫（酸），歪斜巨尖帽、绿紫长袍、药瓶与酸雾。 |
| `assets/element-fire.svg` | 128x128 | 火焰元素图标（UI 徽章/弹窗），粗轮廓。 |
| `assets/element-ice.svg` | 128x128 | 冰晶元素图标。 |
| `assets/element-lightning.svg` | 128x128 | 雷电元素图标。 |
| `assets/element-acid.svg` | 128x128 | 酸雾/毒液元素图标。 |
| `assets/spell-fireball.svg` | 128x128 | 法术图标：火花飞弹。 |
| `assets/spell-frost.svg` | 128x128 | 法术图标：霜月碎片。 |
| `assets/spell-lightning.svg` | 128x128 | 法术图标：闪电弹幕。 |
| `assets/spell-acid.svg` | 128x128 | 法术图标：酸雾喷溅。 |
| `assets/spell-blade.svg` | 128x128 | 法术图标：奥术阔剑。 |
| `assets/spell-necro.svg` | 128x128 | 法术图标：死灵旋风。 |
| `assets/monster-imp.svg` | 600x600 | 装饰用 Q 萌黑暗小怪（圆滚滚、发光眼睛、角），透明背景。 |
| `assets/monster-eye.svg` | 600x600 | 装饰用漂浮大眼怪，透明背景。 |
| `assets/favicon.svg` | 64x64 | 简版徽记。 |

要求：
- 一致的光源：顶部偏左暖色主光、右后方冷色轮廓光。
- 角色立绘是 UI 卡片主视觉：细节集中在头部/法杖，脚部可简化；上下留 4% 安全区；不要在画布外裁切。
- 使用统一的粗描边（非纯黑，用 `#1b1220`）与油画纹理滤镜。每张 SVG 的 `<filter>` id 加文件前缀避免冲突。
- 完成后用 Chrome headless 截图或打开渲染，自查：无裁切、无黑块、无错误、轮廓清楚、缩小到 320px 宽仍可辨识。
- 交付时在 `_review/art-report.md` 写每个文件的尺寸/主色/自查结果（仅写这一个文件）。

---

## 6. 战斗引擎 API（js/game.js，engine-smith）

全局构造函数 `window.SpellBrigadeGame`。传统脚本、IIFE、无依赖。必须兼容 `file://`。

```js
const game = new SpellBrigadeGame({
  canvas: document.getElementById('game-canvas'),
  playerId: 'jester',
  allyIds: ['moon','sun','witch'],     // 3 个 AI 队友，来自 SB_DATA
  difficulty: 'normal',
  onHud(hud) {},                        // 约 10Hz，且关键状态变化时
  onLevelUp(choices) {},                // 引擎先自动暂停
  onGameOver(stats) {},
  onVictory(stats) {},
  onEvent(type, payload) {}             // 'wave' | 'boss' | 'toast' | 'pause'（可选）
});
game.start();
game.pause();      // 暂停模拟与输入（升级/暂停菜单用）
game.resume();
game.applyUpgrade(choiceId);  // 选卡后恢复并继续
game.destroy();    // 必须取消 RAF、移除 window/document 监听、清空计时器
game.resize();     // 容器尺寸变化时调用
```

HUD 对象：
```js
{
  hp, maxHp, level, xp, xpNext, time, timeLimit, kills,
  wave, waveName,
  boss: null | { name, hp, maxHp },
  dashCd, dashMax,
  score,
  party: [{ id,name,element,portrait,hp,maxHp,alive }]  // 含玩家在内的 4 人
}
```
升级选项：
```js
[{ id, name, en, element, rarity, rarityLabel, icon, desc, tag }]
// rarity: common | rare | epic | legendary
// icon: 'assets/spell-xxx.svg' 或元素图标
```
结算 stats：
```js
{ result:'victory'|'defeat', characterId, time, kills, level, damage, damageTaken, score, grade:'S'|'A'|'B'|'C', wave }
```
音效（可选依赖，未加载时静默）：
`window.SBAudio && SBAudio.sfx(name)`，允许的 name：
`shoot-fire, shoot-ice, shoot-lightning, shoot-acid, hit, enemy-die, pickup, level-up, hurt, dash, boss-roar, wave, victory, defeat`。
不要调用 UI 或其他模块。

### 6.1 玩法规格（必须实现）
- 竖屏融合视野，Canvas 全屏铺满 `#battle-stage`，devicePixelRatio 上限 2。
- 俯视角 2D 战场，摄像机平滑跟随玩家；世界边界有氛围围栏（废墟/荆棘/雾气），不是纯色矩形。
- 移动：WASD/方向键 + 触摸虚拟摇杆；自动射击最近的敌人；自动瞄准。
- 冲刺：Space 或 `#btn-dash`，短位移 + 0.2s 无敌，冷却 3s。
- 4 人小队：玩家 1 人 + 3 个 AI 队友跟随，采用三角/菱形站位，自动攻击最近的敌人，各自拥有对应元素弹道。AI 不会永久死亡，倒地后 8s 复活（增加团队感）。队友伤害较低，不抢玩家风头。
- 4 种元素手感：火（溅射/灼烧）、冰（减速/冻结）、雷（连锁弹射）、酸（持续腐蚀/范围）。弹幕必须亮、有拖尾、有命中特效。
- 敌人：至少 4 种普通怪 + 1 种精英 + 1 个 Boss：地面爬行怪、蝙蝠、漂浮眼法师（远程弹）、重甲蛮怪；精英带光环；Boss「梦魇领主」有冲撞/扇形弹幕/召唤，血条显示。敌人 Q 萌暗黑、粗轮廓，不要恐怖。
- 波次：0–150 秒节奏递进；每 30 秒提示新波次；120 秒 Boss 登场；撑过 150 秒即胜利（Boss 未死也可撤离胜利），Boss 击杀给额外分；玩家 HP 归零则失败。难度影响敌人血量/伤害/数量。
- 经验：敌人掉魔法水晶，靠近吸附拾取；升级暂停并弹出三选一；每次从法术/被动池中随机不同选项；等级上限 20。
- 升级池至少 14 种，包含：新法术（奥术阔剑环绕、死灵旋风、闪电弹幕、酸雾领域、霜环 etc.）、武器强化（数量/伤害/攻速/穿透/范围）、被动（移速、最大生命、拾取范围、护盾、暴击、冷却缩减、治疗）。
- 视觉：地面油画草地、石砖/魔法阵、废墟石块、树影、萤火粒子、体积雾；角色脚下阴影+起伏动画；受击白闪/击退/伤害数字；屏幕震动可轻微；Boss 登场演出；低血量红色边缘脉冲。禁止满屏噪点和卡顿。
- 性能：中端手机 60fps 目标；粒子上限 ~450；敌人上限 ~140；对象池复用；离屏 canvas 预渲染地面；垃圾回收友好。
- 开局 8 秒内必须有战斗反馈，30 秒内至少升 1 级。
- 当 tab 隐藏时自动暂停模拟并通知 UI（`onEvent('pause')` 可选），恢复由 UI 决定。

### 6.2 引擎自测
- 创建 `_review/engine-harness.html` 作为独立测试页（用自己的临时 CSS 内联），能一键开局、模拟升级、显示回调数据；不得修改 UI 文件。
- 用 Chrome headless 截图/console 验证无报错，并记录 `_review/engine-report.md`（只写这一个文件）。
- 自测后通知 Lead，附 API 实现差异与已知问题。

---

## 7. UI 规格（index.html / css/style.css / js/ui.js，screen-smith）

### 7.1 通用
- `<!DOCTYPE html>`，`lang="zh-CN"`，viewport 使用 `width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no`。
- 引入顺序：`css/fonts.css` → `css/style.css` → 底部 `js/data.js` → `js/audio.js` → `js/game.js` → `js/ui.js`。
- 根容器 `#app`：移动端 100dvh 全屏；桌面端最大宽 520px、比例接近 9:16，居中，两侧深色氛围背景 + 手机阴影；画布/弹窗不溢出。
- 安全区：`env(safe-area-inset-*)`，底部按钮至少留 18px。
- 禁止横向滚动。触摸目标 ≥ 44px。
- 所有交互有按压/悬停反馈；页面转场 300–500ms，带轻微缩放/模糊/上浮；尊重 `prefers-reduced-motion`。
- 只使用本地 SVG 资产；加载失败用 CSS 占位，不出现破图图标。
- 每个屏幕内容不能被顶部/底部遮挡；小屏（667px 高）也要可用。

### 7.2 每个屏幕的内容
1. **loading**：深色魔法背景 + 旋转符环/徽记 + Logo + 进度条（伪进度 1.2s）。`?nofx=1` 立即跳 home。
2. **home**：`hero-scene.svg` 全屏底图；顶部 Logo 组合（中文《咒语旅团》主标 + `THE SPELL BRIGADE` 英文小标）；顶部右侧音效/设置按钮；底部营销文案 + 主 CTA「开始冒险」+ 次 CTA「小队集结」；功能 chips（4人小队 / 元素弹幕 / 肉鸽升级）；角落小号免责声明「演示版 · AI 队友自动补位」；叠加 CSS 粒子/浮游符文/飘动光点，不要遮挡 CTA。
3. **roster**：标题「选择你的巫师」，横向滑动 4 张 3:4 角色卡（scroll-snap + 桌面箭头）；卡内立绘、序号 01–04、名字、英文名、元素徽章、角色定位、一句 tagline、四维属性条；选中卡金色描边+外发光；底部「确认巫师」；返回按钮。默认选中上次选择（localStorage `sb.character`，失败静默）。支持键盘左右。
4. **lobby**：「小队集结」；4 个席位卡片：玩家（选中角色）+ 3 名 AI 补位角色（用其余角色立绘做头像）；每席显示元素、准备状态；房间码（`SB_DATA.share.codePrefix` + 随机 4 位，持久到本次会话）；「复制邀请」按钮（真实 writeText，失败回退）；难度选择 3 档；「踏入遗迹」主 CTA；返回 roster。邀请可打开分享海报浮层。
5. **game**：Canvas 战场 + HUD：
   - 顶部：返回/暂停按钮、关卡名「遗忘回廊」、计时「黎明倒计时」/波次、击杀数；Boss 出现时顶部 Boss 血条。
   - 左/右侧：队伍 4 人小头像与血条（AI 倒地置灰/复活倒计时可由 HUD 数据近似实现），玩家 HP 条 + 等级 + XP 条；分数/连杀可简化为击杀数。
   - 底部左右：虚拟摇杆（视觉 max 半径 ~52px）、冲刺按钮（圆形、显示冷却环/秒数）、当前法术图标条。
   - 首局提示浮层：「左侧拖动移动 · 自动施法 · 冲刺躲避」3 秒后消失，可跳过。
   - 升级弹窗：标题「法术共鸣」+ 副标「选择一项强化」；3 张横排卡牌（竖屏可横滑/等分三列，卡片上部图标+元素，下部名称/稀有度/描述/标签），选中动画 + 粒子，点击后调用 `SBGame.applyUpgrade(id)` 并关闭。键盘 1/2/3 可选。
   - 暂停弹窗：继续/重新开始/返回大厅/音效开关；暂停时游戏引擎已暂停。
   - 游戏屏默认无滚动。竖屏 375x667 检查 HUD 不重叠。
6. **result**：胜利/失败大标题、评价 grade、用时/击杀/等级/伤害/受伤/分数；队伍四头像；按钮「再战一次」「返回大厅」「分享战绩」。
7. **分享海报浮层**：9:16 展示型卡片（非真实截图）：顶部 Logo、`hero-scene.svg` 或角色立绘+当前巫师、战斗数据、4 人小队头像、底部文案「组队开启弹幕冒险」+ 房间码；按钮「复制邀请文案」「关闭」。`writeText` 失败时显示可选中文本。**不要求生成图片下载**。
8. **设置浮层**：音乐/音效开关（调用 `SBAudio.set`）、玩法说明、重置进度、关闭。设置持久化 localStorage。

### 7.3 UI ↔ 游戏引擎连接（必须）
- 开始游戏：
  ```js
  window.SBGame = new SpellBrigadeGame({
    canvas, playerId, allyIds, difficulty,
    onHud: updateGameHud,
    onLevelUp: showUpgrade,
    onGameOver: showResult,
    onVictory: showResult,
    onEvent: handleGameEvent
  });
  SBGame.start();
  ```
- 离开游戏屏：`if (window.SBGame) { SBGame.destroy(); SBGame = null; }`。
- 升级卡片点击：`SBGame.applyUpgrade(choice.id)`，关闭弹窗。
- 暂停：`SBGame.pause()` 后打开菜单；继续 `SBGame.resume()`。
- 可用 `SBAudio.sfx('ui-click')` / `SBAudio.sfx('ui-confirm')`；BGM 进入 home 时 `SBAudio.music('home')`，战斗 `SBAudio.music('battle')`，结算 `SBAudio.music('result')`。
- 引擎回调可能早于 UI 完成 DOM 更新：全部做空值保护。
- 若引擎文件尚未就绪，UI 需在点击开始后显示「正在唤醒魔法…」并 1.5s 后提示刷新，不能白屏崩溃。
- **禁止 UI 直接计算战斗数值**；HUD 只展示回调数据。

### 7.4 UI 自测
- 用 Chrome headless 截 `home/roster/lobby/result/share/game` 至少 6 张图到 `_review/ui-*.png`，检查 375x812 与 430x932 两个尺寸、无横向滚动、无遮挡、无错误。
- Chrome 路径：`C:\Program Files\Google\Chrome\Application\chrome.exe`。
- 启动本地服务：`python -m http.server 8123`（python 路径见下）；若用 file:// 检查更真实也可。
- 写 `_review/ui-report.md`（仅此文件）说明截图、已知问题、控制台错误。
- 必须等 Lead 给出「可以动 UI 以外的文件」后才能改边界外文件；不要抢改。

---

## 8. 验收标准（全局）
- 双击 `index.html` 可玩；无需网络；桌面 Chrome/Edge 与手机视口正常。
- 从开屏到一局完整战斗（至少 120 秒不崩）、升级选择、暂停、结算、分享海报全链路可走通。
- 控制台无未捕获错误；无 404（字体/资产齐全）。
- 视觉统一、有记忆点；首页第一眼像高质量 H5 游戏宣传页；战斗画面弹幕华丽但可读。
- 移动端触控与安全区正确；音效可关闭且不自动播放扰民。
- 验收后 Lead 会跑自动化截图 + 逻辑冒烟；任何修改以 Lead 最终集成为准。

## 9. 沟通
- 每完成关键节点/被阻塞，给 `lead` 发消息（send_message），包括：完成了什么、如何验证、还缺什么。
- 不修改其他成员的写范围；发现契约问题先找 Lead，不要私自改接口。
- 文件名/ID 完全按本契约。中文文案可以润色，但不要偏离角色设定。
