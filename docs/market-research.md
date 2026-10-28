# 三市场上架调研：ClawHub / SkillHub / DSH 插件广场

> T3 · 2026-10-28 · 全部数字为本机当天实测（可复现命令见 §0），非二手转述。
> 结论先行：**音乐类目很浅、竞争者在「几百下载 / 十几 star」量级，没有垄断者；我们的机会在「中文写词 + BYOK 零配置 + 出歌后导流画板做 MV」这三件竞品都没有的事。**
> 本文件只解决「怎么写才有人装」；具体命令在 `docs/publishing.md`，文案成品在 `artifacts/publish/listings.md`。

---

## 0. 调研方法与可复现证据

本机已登录的 CLI 就是最准的数据源（比网页快、比截图可信）：

```bash
# ClawHub：元数据 + 下载量/安装量/版本数/owner
clawhub inspect yinchao-ai-music --json | jq '.skill.stats, .owner, .latestVersion'

# SkillHub 插件广场（GitHub 仓爬取，免登录，63 条 music 命中）
curl -s "https://api.skillhub.cn/api/v1/plugins?q=music&page=1&page_size=50"
curl -s "https://api.skillhub.cn/api/v1/plugins/yinhcao/yinchao-ai-music-skill"

# SkillHub 技能（CLI 发布那条线）：详情字段含 downloads/stars/category/安全报告
curl -s "https://api.skillhub.cn/api/v1/skills/music-generation-studio?namespace=@beatra-ai"

# dshmp（dsh marketplace）：npm 收录 + JSON API
curl -s "https://dshmp.com/api/plugins?q=music&limit=50"
```

- 原始抓取脚本与去敏摘要留在 `artifacts/publish/research/`（`probe-skillhub.mjs`、`probe-web*.mjs`、`skillhub-plugins-digest.json`）。
- 外站（GitHub / skills.sh / dshbase / awesome）本机需走代理 `http://127.0.0.1:7897`；Node 侧用 `NODE_USE_ENV_PROXY=1 node ...`（Node 24 实测可用，无需装 undici）。
- 标注 **「待验证」** 的条目 = 无法从公开接口直接确认，已给出验证方法，发布后按方法校验。

---

## 1. 三市场一览（实测规模，2026-10-28）

| 市场 | 形态 | 规模 | 音乐/音频类样本 | 收录方式 | 我们要做的事 |
|---|---|---|---|---|---|
| **ClawHub** clawhub.ai | OpenClaw 技能市场 | 全球，页脚显示生态导航 + `/skills` 全站 | 头部音乐 skill 下载 **176–661**，无千级 | `clawhub publish` 即上架，无人工审批；有安全审计标记 | 发一个 skill（英文 slug + 中文名） |
| **SkillHub** skillhub.cn（腾讯系） | ①技能 ②插件广场 | 技能区头部音乐 skill **152,325 下载**；插件广场 music 命中 **63 条** | 插件头部 21★/20★/19★；技能头部 152k 下载 | 技能=CLI 发布要 Token/实名；插件=**公开 GitHub 仓自动爬取** | 发 skill + 让 GitHub 仓被自动收录 |
| **DSH 插件目录** dshmp / dshbase / awesome / dsh-market | npm 插件目录站 | dshmp **7,585 verified**；dshbase **20,008 条 / 7,836 verified**；awesome 目录 **7,211 条** | dshmp music 命中 **38 条**，真音频插件头部 82★ | dshmp/dshbase=**npm 自动**；awesome/dsh-market=**PR 一个 YAML** | `npm publish` + 一个 awesome PR |
| **skills.sh**（附加） | Vercel Labs 技能榜 | 4.1M 装机 badge 量级 | 竞品 yinchao 已铺 | CLI 装即索引，**无投稿表单** | 公开仓 + `npx skills add` 自测 |
| **GitHub**（根链路） | 落地页 + 爬虫源头 | — | — | — | `dongsheng123132/xiapan-music` 公开仓 |

---

## 2. ClawHub（clawhub.ai / OpenClaw）

### 2.1 平台机制（决定我们怎么写）

- 一个 skill = 一个目录，**详情页就是把 `SKILL.md` 渲染出来**，顶部有分类、topic、安装命令、License、Last updated、Current version、Downloads、Security audit 标记；页面 tab 为 `SKILL.md / Skill Card / Files / Versions`。
- 安装三条路并存（页面同时给出）：`openclaw skills install @acedatacloud/suno`、`clawhub install <ref>`、`npx skills`。→ 我们的 README 要三条都给。
- **命名空间是 owner + slug**：URL 形如 `https://clawhub.ai/<owner>/skills/<slug>`，引用写法 `@<owner>/<slug>`。同名 slug 允许并存，`clawhub inspect <slug>` 会报 `AMBIGUOUS_SKILL_SLUG` 并列出候选 → 所以对外引用一律写全 `@dongsheng123132/xiapan-music`。
- 分类/ topic 由平台归类：页面链接形如 `/skills?category=creative`、`/skills?topic=music-generation`；实测同类 skill 的 topic 有 `music`、`ai-music`、`text-to-music`、`lyrics-to-song` 等英文 slug。
- 每个 skill 有安全审计标记（示例页显示 `Pass`）。

### 2.2 头部样本（真实链接 + 实测数字）

| # | 链接 | downloads | versions | license | 一句话简介（节选） |
|---|---|---|---|---|---|
| 1 | [音潮 AI 音乐创作](https://clawhub.ai/joeydqyuan/skills/yinchao-ai-music) | **661** | 5 | MIT | 「用 YinChao v4.5 生成完整 AI 歌曲、纯音乐和 BGM…」 |
| 2 | [Suno Lyrics to Song](https://clawhub.ai/beatra-ai/skills/suno-lyrics-to-song) | 625 | 4 | — | "Turn complete lyrics … into a structured, listenable Suno song." |
| 3 | [AI Song Cover Studio](https://clawhub.ai/beatra-ai/skills/ai-song-cover-studio) | 426 | 2 | — | "Turn a song recording into a newly interpreted cover…" |
| 4 | [苏诺之音-SunoAI音乐助手](https://clawhub.ai/sky-lv/skills/suno-cn-music) | 296 | 1 | — | 长中文 summary 堆满触发词（翻唱/续写/人声分离/MIDI/乐谱…） |
| 5 | [Suno Music（AceDataCloud）](https://clawhub.ai/acedatacloud/skills/suno) | — | v1.0.1 | MIT-0 | "Generate AI music with Suno via AceDataCloud API…"；topic `#music-generation`，Audit `Pass` |
| 6 | [Skill Publish Guide](https://clawhub.ai/clawhub-master/skills/skill-publish-guide) | — | 1.0.0 | — | 官方发布指南 skill，可作发布细节的权威补充（本机抓取受 CF 拦截，标注待验证） |

> 结论 1：**整个音乐类目的天花板是「几百下载」**（下载≠安装，ClawHub 还单独统计 installs，实测多数为 0–1）。这是一个还在窗口期的类目。
> 结论 2：榜单前列全是**「A 站能力 + Suno/MiniMax/ElevenLabs」的二次封装**，没人做「中文写词 + 零配置 Key + 导流创作工具」的组合。

### 2.3 头部做法拆解（可直接抄）

**① 命名**
- slug 一律英文短横线，能拼出使用场景：`suno-lyrics-to-song`、`ai-song-cover-studio`、`suno-cn-music`。
- displayName 中英混排且**带品牌前缀**：`音潮 AI 音乐创作`、`苏诺之音-SunoAI音乐助手`、`Suno Music`。
- 同理我们：`slug=xiapan-music`，displayName=`虾盘云音乐 · 一句话出歌`。

**② 一句话简介（summary / description 第一行）**
- 英文侧用固定句式 **"Turn X into Y — … Use when …"**；中文侧把触发词成串列出（苏诺之音那段 200+ 字几乎全是触发词：AI 作曲、AI 写歌、文字生成音乐、歌词生成歌曲、翻唱、续写、纯音乐、BGM…）。
- 实操：**前 80 字给结论，后面接触发词**，两头都吃（人看前 80 字，检索吃关键词）。

**③ SKILL.md 结构（以 yinchao 为范本，这是同类里最规范的）**
```
frontmatter: name / description / license / metadata{slug, displayName, version, summary, tags, homepage}
# 标题
> 一句话定位（平台/模型 v4.5 + 平台链接）
## 判断任务        ← 消除歧义：写歌 vs 纯音乐 vs 只写词；明确「不用于搜歌/播放/TTS」
## 创作原则        ← 怎么把口语需求变创作提示；不承诺克隆艺人
## 认证与执行      ← 优先用工具，其次脚本；key 从 env/文件读，绝不回显
## 按任务读取说明  ← references/ 分包，长文档不进主文件
## 输出规范        ← 不伪造结果、不重复提交、长任务续查原任务
```

**④ 分类 / topic / SEO 关键词**
- 分类实际落在 `creative`（示例页）；topic 是英文 slug 集合（`music-generation`、`ai-music`、`lyrics-to-song`…）。
- 从实测 topic 反推平台检索词：`music, ai-music, text-to-music, lyrics-to-song, song, bgm, suno`。中文检索词（写歌/作曲/BGM/歌词）主要靠 summary 中的中文命中。
- 待验证：topic 是否可在发布时/发布后自行指定。**验证方法**：`clawhub publish` 后立刻 `clawhub inspect @dongsheng123132/xiapan-music --json` 看 `topics` 字段；若为空，改 summary 里的英文关键词后再发一个补丁版本，看 topic 是否跟随。

**⑤ 审核 / 收录**
- 无人工审批：`clawhub publish` 成功即上架；页面挂 Security audit 结果（我们的 skill 只有纯脚本，预期 Pass）。
- 更新 = 再 publish 一个更高 semver；`clawhub skill rename/merge` 可保旧 slug 跳转；删除是 soft-delete（`delete/hide/undelete/unhide` 可回滚）。

**⑥ README/首图**
- ClawHub 详情页无自定义截图位，视觉=SKILL.md 正文 + 平台生成的 Skill Card；所以**首图只能通过 SKILL.md 内嵌图片**（GitHub raw 链接）或平台 Skill Card 自动生成。
- 可抄：在 SKILL.md 第一屏放一张 GitHub raw 的 hero 图（1200×630），并让 `description` 第一句能独立成卡片文案。

---

## 3. SkillHub（skillhub.cn，腾讯系）——两条完全不同的链路

### 3.1 链路 A：技能（skills，CLI 发布）

**头部样本（实测详情 API）**：[音乐生成工作室（@beatra-ai/music-generation-studio）](https://skillhub.cn/skills/@beatra-ai/music-generation-studio)

| 字段 | 实测值 | 对我们的含义 |
|---|---|---|
| downloads | **152,325** | 技能区流量远大于 ClawHub（百倍级），值得重点做 |
| stars | 8 | 点赞少，说明下载主要来自站内分发/搜索，不是社区口碑 |
| category / subCategories | `design-media`（设计·媒体） | 我们的技能投这一类 |
| publisher | 企业认证（乐萱同行科技（深圳）有限公司） | 有企业/实名认证加分项，个人也能发 |
| labels.requires_api_key | `true` | 需要我们这种 BYOK 的，应如实标注（平台有该 label） |
| securityReports | `keen`（腾讯 tix，benign）+ `sanbu`（腾讯云，benign） | **平台自动做安全扫描并公示**，脚本无网络回传更易通过 |
| changelog / latestVersion | 有逐版本 changelog（中文） | 每次发版都要写 changelog |

**生态特征（重要）**：技能搜索里大量 `@clawhub_<handle>` 命名空间（如 `@clawhub_ivangdavila/music`、`@clawhub_bytesagain3/music-playlist`）——**SkillHub 会把 ClawHub 的技能镜像过来**。意味着：先把 ClawHub 发好，SkillHub 技能区可能自动多一个镜像位（镜像时效待验证：发完 24h/72h 各搜一次 `skillhub search xiapan` 确认）。

**发布契约（读 SkillHub CLI 源码实证，非猜测）**
- CLI：`skillhub publish <dir|zip> [--version] [--changelog] [--dry-run] [--json]`
- `--dry-run` 只做本地校验：解析 `SKILL.md` front matter + 校验 `slug`（kebab-case 3–128）/`version`（SemVer）/`displayName` 必填，不打网络请求。
- 正式发布：`POST https://api.skillhub.cn/api/v1/community/skills/publish`，multipart = `payload`(JSON: slug/version/displayName/summary/description/tags/license/homepage/changelog) + `files`(每个文件一个 part)。
- 返回 `skillId / status / publicUrl`；错误码：401=没登录、403=权限不足、409=slug 冲突、429=限流（带 rule 说明）。
- 详情 API（验证用）：`GET https://api.skillhub.cn/api/v1/skills/xiapan-music?namespace=@user_abeb50e0`。

**前置（我们的实测状态）**：CLI 已装（`skillhub 2026.8.5`），已登录 handle `user_abeb50e0` / role `user`（非企业认证）。发布是否需要手机号实名/社区 Token 刷新 → 走一遍 `skillhub publish --dry-run` 后正式发时才知道，见 `publishing.md` 的失败兜底。

### 3.2 链路 B：插件广场（plugins，GitHub 仓自动爬取）

**这是 DSH 插件在 SkillHub 的唯一上架方式，不是 CLI 发布。** 平台公开 API 实证：

```bash
curl -s "https://api.skillhub.cn/api/v1/plugins?q=music&page=1&page_size=50"
# total=63；字段：fullName / repositoryUrl / stars / topics / installability / contentAuditStatus / categoryKey / description / license
curl -s "https://api.skillhub.cn/api/v1/plugins/<owner>/<repo>"   # 详情多出 manifest(仓库根 package.json) + readme
```

**q=music 63 条分类分布**：`client` 16 / `fun-dressup` 15 / `model-inference` 13 / `web-tools` 6。

**头部样本（star 真实值）**

| # | 仓库 | ★ | categoryKey | 做什么 | 对我们的含义 |
|---|---|---|---|---|---|
| 1 | [kendu76/dsh-music-player](https://github.com/kendu76/dsh-music-player) | 21 | client | 本地音乐播放器（Web UI） | 播放器赛道，不是竞品；但它证明「Web UI + client 类」有曝光 |
| 2 | [dhicoc/dsh-theme-mineradio](https://github.com/dhicoc/dsh-theme-mineradio) | 20 | fun-dressup | 玻璃拟物电台主题 | 主题/装饰类拿 star 更快 |
| 3 | [yinhcao/yinchao-ai-music-skill](https://github.com/yinhcao/yinchao-ai-music-skill) | **19** | model-inference | **AI 音乐生成 Agent Skill（我们最直接竞品）** | 我们的直接对标：一仓=DSH 插件 + 内置 skill，五入口铺量 |
| 4 | [welsione/dsh-mmx-bridge](https://github.com/welsione/dsh-mmx-bridge) | 12 | model-inference | MiniMax 全模态（含唱歌/翻唱） | 多模态打包打法 |
| 5 | [alittlelov/dsh-soundcheck](https://github.com/alittlelov/dsh-soundcheck) | 10 | model-inference | 本地音乐分析（音频不出本机） | 「本地/隐私」是卖点 |
| 6 | [ayst-z/music-code-mv](https://github.com/ayst-z/music-code-mv) | 4 | model-inference | 把音乐渲染成 MV | **与我们的「画板做 MV」导流直接相关**，可参考其表述 |

**收录条件（实证 + 待验证项）**
- 已证：列表/详情里出现 `installability: "verified"`、`contentAuditStatus: "passed"`、`lastSyncedAt`（毫秒时间戳）→ 平台在做**自动可安装性验证 + 自动内容审核 + 周期性同步**。
- 已证：竞品详情里 `manifest` = 仓库根 `package.json` 原文，`topics` 含 `dsh-plugin`，`readme` 全文被抓。
- 推论（待验证）：触发条件是「公开 GitHub 仓 + 根 `package.json` 声明 `dsh.bundle` + `dsh-plugin` topic」。
- **验证方法**：公开仓建好、topics 加齐后，每隔 24h 查一次 `curl -s "https://api.skillhub.cn/api/v1/plugins?q=xiapan"`；出现即收录成功，`installability` 应为 verified、`contentAuditStatus` 应为 passed。

### 3.3 SkillHub 上「我们该怎么写」

- 名字：插件广场显示 `fullName`（`owner/repo`）+ `description`。**description 用中文一句话讲清「一句话出歌 + BYOK」**，因为这条 description 同时是搜索结果摘要。
- 分类：我们属于内容生成 → 对标 yinchao 的 `model-inference`。待验证：`categoryKey` 是否可由仓库侧影响（推测平台按 manifest/README 自动分类）。**验证方法**：收录后看 `categoryKey`，若不是 `model-inference`/`client`，在 README 首段明确写「AI 音乐生成 / 文本生成音乐」后再等一个同步周期。
- README 是详情页正文（API 直接返回全文）→ **GitHub README = 上架详情页**，必须自带截图和安装命令（不能只写开发说明）。
- topics：`dsh-plugin` + `deepseek-harness` + `ai-music` + `text-to-music` + `music-generation` + `agent-skills`。

---

## 4. DSH 插件目录生态（npm 为源，四站消费）

### 4.1 dshmp.com（dsh marketplace）

- 规模：**7,585 verified** / 5,049 带 Web UI / 5,719 有公开源码；收录口号是「A package is listed here only if it declares a `dsh.bundle` manifest — 不做 star 数、topic 标签这种装不上也能进的门槛」。
- 收录规则（官方 Publish 指南原文要点）：
  - npm 包必须含三件：`package.json`(声明 `dsh.bundle.patch`) + `cordis.patch.yml` + `index.js`；
  - **`keywords` 含 `dsh-plugin`**，目录站每日读 npm registry → **1 天内自动出现，无投稿表单、无人工审批、无账号**；
  - 新版本 = 普通 `npm publish`，目录站次日自动跟随（version/description/keywords/repository 全部跟随）；
  - npm `deprecate` → 目录站标记 archived 并隐藏，permalink 保留；
  - 收录异常时用 `/en/guides/publish/check` 的自检工具（跑的就是索引器同一条规则）。
- JSON API（验证用）：`https://dshmp.com/api/plugins?q=xiapan`；页面 URL 形如 `https://dshmp.com/en/plugins/<slug>`（slug 来自 API 返回的 `slug` 字段，例如 `dsh-music-player`）。
- **q=music 实测 38 条**，按 star 头部：`oh-story-dsh` 1175（写作/短剧）、`dsh-tongflow` 1046、`dsh-computer-use-win` 174、`dsh-game-material-master` 82（含 ai-music 标签）、`dsh-music-player` 19、`omaseek-music` 16、`dsh-mmx-bridge` 10。
- 可抄：dshmp 的排序吃 `totalStars`（GitHub star）与 npm 下载量 → **GitHub 仓的 star 与 npm 下载都会回头影响目录排序**，发布后值得做「GitHub 引流」。
- 可抄：它的 `tags` 字段直接来自 npm `keywords`（实测 `dsh-turn-music` tags=audio/music/ringtone/…）→ **npm keywords 是我们的 SEO 主战场**。

### 4.2 dshbase.com

- 规模：**20,008 条 listing / 7,836 条 Verified / 1,505 条 listed 未测**。
- Verified 的定义比别家狠：**真机跑过 L1 安装 → L2 加载 → L3 无头问答 → L4 Web CDP**（Web-only 插件必须过 L4）；「别的目录叫 verified 只是能从 manifest 装上」。
- 收录：读 npm 生态（`dsh plugin add <pkg>` 可装即可列），无投稿表单；通过安装测试后才升级为 Verified。
- 验证 URL（待验证具体路径）：`https://dshbase.com/plugins/dsh-xiapan-music/`（页面 slug 形如 `/plugins/<kebab-name>/`，实测 `open-design`、`archify`、`dshbase-catalog` 等）。**验证方法**：npm 发布后 1–2 天打开目录页搜索 `xiapan`，或 `https://dshbase.com/plugins/directory/?q=xiapan`。
- 对我们的风险：**L3 无头问答 / L4 Web CDP 可能失败**（插件依赖真实 Key + 付费出歌）。→ 插件必须做到「无 Key 时也能正常加载、给出明确提示」，否则拿不到 Verified。这条要回传给 T2。

### 4.3 awesome-dsh-plugin.com（＋ dsh-market 依赖它）

- 规模：页面 **7,406 条**；npm 同步包 `dsh-plugin-catalog` 实测 **7,211 条 / 112 个版本 / latest 2026.1027.11136**（日期即构建日，说明每日构建）。
- 收录规则（`contributing.md` 原文，硬门槛）：
  1. **PR 只加一个文件**：`data/plugins/<owner>__<repo>.yml`；
  2. 字段：`url`（必须与仓库完全一致）、`name`（`owner/repo`）、`category`（`agi|ui|usage|theme|model|identity|session|memory|tools|wsl|browser|vision|voice|docs|skill|workflow|git|notify|dev|security|remote|market|fun`）、`description.en`（必填）/`description.zh`（可选，维护者补）、`icon`（可选，GitHub 托管的 180×180 位图）；
  3. 仓库要求：`package.json` 声明 **`dsh.bundle`**（只声明 `dsh.client` 一律拒）、有真实可用代码（占位/纯 README 不收）、**仓库创建满 1 天**（CI 自动查）、**加 `dsh-plugin` topic**、描述只说功能不带营销词且必须与代码一致；
  4. 描述里含 `: ` 必须加引号（YAML 解析坑）。
- **这条链路不是自动的**：npm 发布不会自动进 awesome；**dsh-market 与 dsh 0.2.1+ 的 Discover 索引 `cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json` 都来自这里** → 相当于「不投 PR 就没有 dsh 市场曝光」。
- 分类我们投 `skill`（内置 Agent Skill）或 `voice`（音频类，待定；`skill` 更贴近「给 Agent 加能力」）。

### 4.4 dsh-market（第三方插件内市场）

- 1,265★，DSH 内置插件市场（浏览/搜索/一键安装），索引源就是 `dsh-plugin-catalog` 的 `index.json`（即 awesome 数据）。
- 对我们的含义：awesome PR 合并后，dsh-market 搜索 `xiapan` 就能装，无需额外动作。验证：装 dsh-market 后在 Discover 搜索，或直接查 `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json` 里是否出现 `dsh-xiapan-music`。

---

## 5. skills.sh / `npx skills add`（GitHub 仓的附加分发）

- 运营方 Vercel（Labs），CLI 开源在 `github.com/vercel-labs/skills`；安装：`npx skills add <owner>/<repo> [--skill <name>] [-g]`。
- 索引规则（官网 About/Docs 原文）：
  - **"We index every public skill that ships through the open skills CLI"**——靠 CLI 分发即被索引；
  - 排名来自**匿名去重的安装量遥测**（CLI 默认上报 skill 名 + 文件 + 时间戳，`DISABLE_TELEMETRY=1` 可关），每小时去重防刷；
  - **每个公开 GitHub 仓都有 repo page**，"lists every skill we have seen from a GitHub repo"，**无审批、无白名单**；
  - 可选 `skills.sh.json` 放在仓库根自定义 repo 页（无审批）；
  - 徽章：`https://skills.sh/b/<owner>/<repo>`（实测返回 SVG，如 vercel-labs 的 badge）。
- 对我们的含义：**不是「提交收录」，而是「能被 CLI 装上 + 有人装」**。我们要做的是保证 `npx skills add dongsheng123132/xiapan-music --skill xiapan-music` 一次成功，然后把这条命令放进所有 README/详情页 —— 每装一次就是一次排名信号。
- 竞品 yinchao 的 `npx skills add` 入口已铺（Lead 提供），我们没有理由不铺。

---

## 6. 竞品速览与我们的差异位

| 竞品 | 入口数 | 要用户做什么 | 我们的差异 |
|---|---|---|---|
| **yinchao-ai-music**（19★ SkillHub / 661 下载 ClawHub / DSH 插件 / skills.sh / awesome 五入口） | 5 | 去音潮开放平台注册建 Key | 我们**装了虾盘 U 盘/U-King 的机器零配置**（读 `~/.uking/device.json` 设备 Key），且出歌后可直接去画板做 MV |
| **beatra-ai**（SkillHub 152k 下载 / ClawHub 3 个 skill 矩阵 / 企业认证） | 4+ | 要 API Key（`requires_api_key=true`） | 我们中文写词链路专门调过（结构化 JSON 歌词），且 Key 来自用户已有的虾盘云账户，不是新平台 |
| **suno.cn（@sky-lv）** | 2 | 网页授权 3 天，不填 Key | 我们可长期免 OAuth（BYOK 直连），无 3 天到期 |
| **AceDataCloud Suno**（ClawHub 精品页） | 2 | 去 platform.acedata.cloud 建 Key | 同上，且我们是本地中文文案/中文写词 |
| **dsh-music-player / dsh-musicplayer / dsh-turn-music**（DSH 目录） | 3 | 装插件即可 | 它们是「播放/提醒」，我们是「创作并产出可下载 mp3」，不冲突可互补 |
| **music-code-mv / dsh-plugin-audiolib** | — | — | 它们做「歌→MV/配乐」；我们做「一句话→歌」，再把歌送去画板做 MV，**是上游** |

**一句话定位**：别人卖「出歌」，我们卖「**一句话出歌 + 不用配 Key（U 盘自带）+ 直接进画板做 MV**」。

---

## 7. 结论：我们的 listing 该怎么写（可直接落到 `listings.md`）

### 7.1 标题与命名（三处必须一致）

| 位置 | 值 |
|---|---|
| slug / name（ClawHub、SkillHub、npm 目录） | `xiapan-music` |
| displayName（市场显示名） | `虾盘云音乐 · 一句话出歌` |
| 英文标题（README H1 / skills.sh） | `Xiapan Music — One Sentence, A Whole Song` |
| npm 包名（DSH 插件） | `dsh-xiapan-music` |

理由：slug 必须英文（ClawHub/SkillHub 的 slug 校验、topic、URL 全是英文）；displayName 用中文品牌 + 中文能力词（「一句话出歌」比「AI 音乐创作」更具体、更被搜）。

### 7.2 一句话简介（三版，按平台字数取用）

- **中文（≤60 字，ClawHub/SkillHub 摘要）**：`一句话生成完整歌曲：AI 写词 + Suno v6 出 2 首，可下载 mp3；也能出纯音乐 BGM。BYOK，虾盘云 Key，装了虾盘 U 盘免配置。`
- **中文长版（SkillHub 描述位，带触发词）**：见 `listings.md` §2。
- **英文（≤160 字符）**：`One sentence in, a full song out: AI writes Chinese/English lyrics, Suno v6 renders 2 tracks, download mp3. BYOK (Xiapan Key) — zero-config on Xiapan USB.`

### 7.3 长描述骨架（所有市场共用，按字段裁剪）

1. **第一句给结果**（不是「这是一个…的 skill」）：一句话描述想写什么 → AI 写词 → Suno v6 出 2 首 → 试听/下载。
2. **30 秒上手**：装（三条命令）→ 拿 Key（网址）→ 说一句话。
3. **能做什么**（4 条以内，动词开头）：一句话出歌 / 已有歌词谱曲 / 纯音乐 BGM / 查余额。
4. **凭什么选我们**（差异三连）：BYOK 零配置（U 盘设备 Key）/ 中文写词 / 出歌后去画板做 MV。
5. **凭据与安全**：Key 只从 `XIAPAN_API_KEY`、`~/.uking/device.json` 读，不写盘、不回显、不进日志。
6. **费用**：只写「约 ¥2.4/次（一次 2 首完整歌），以实际扣费为准」——**注意 PLAN §1.1 记的是 ¥1.2/次，README 写的是 ¥2.4/次，需 Lead 拍板统一口径**（见 §8 风险 1）。
7. **链接**：GitHub / 画板（带 UTM）/ 领 Key / 充值。
8. **限制**：只支持虾盘云 Key；生成需联网；音乐版权归用户，商用需自行确认。

### 7.4 分类与标签

| 市场 | 分类 | 标签 / topics / keywords |
|---|---|---|
| ClawHub | `creative`（同类页实测） | music, ai-music, text-to-music, lyrics-to-song, song, bgm, suno, chinese |
| SkillHub 插件广场 | `model-inference`（对标 yinchao）/ 若强调面板则 `client` | topics：`dsh-plugin`, `deepseek-harness`, `agent-skills`, `ai-music`, `text-to-music`, `music-generation` |
| SkillHub 技能 | `design-media`（对标音乐生成工作室） | tags：AI音乐、AI写歌、歌词生成、文字生成音乐、BGM、纯音乐、Suno |
| npm | — | keywords：`dsh`, `dsh-plugin`, `deepseek-harness`, `agent-skills`, `music`, `suno`, `ai-music`, `text-to-music`, `music-generation`, `xiapan` |
| GitHub | — | topics：`dsh-plugin`, `deepseek-harness`, `agent-skills`, `ai-music`, `text-to-music`, `suno`, `chinese` |

> 英文 slug 主导（平台检索、topic、URL 都是英文），中文关键词铺在 summary/description 里吃中文检索。

### 7.5 README / SKILL.md / 首图

- **README = GitHub 落地页 = SkillHub 插件详情页 = skills.sh repo 页**：首屏必须是「一句话 + 三条安装命令 + 一张真实歌曲卡截图」。
- **SKILL.md = ClawHub 详情页 = SkillHub 技能详情页**：照 §2.3 的六段结构；第一屏放 hero 图（GitHub raw）。
- **首图/截图**：规格清单见 `artifacts/publish/listings.md` §4（尺寸、拍什么、存哪）。
- **不要做的事**：不写「最强/第一/秒杀」这类词（awesome 明确拒收营销词，ClawHub/SkillHub 审核也会打回）；不承诺「版权/商用无忧」；不放竞品品牌做对比图。

---

## 8. 待验证清单（发布后必须逐条确认）

| # | 事项 | 验证方法 | 影响 |
|---|---|---|---|
| 1 | **费用口径**：PLAN ¥1.2/次 vs README ¥2.4/次 | 问 T1/看 `docs/api-contract.md` 实测扣费；统一后改 README + 所有 listing | 承诺价格错=退款/差评风险 |
| 2 | ClawHub topic 是否可自定 | publish 后 `clawhub inspect @dongsheng123132/xiapan-music --json` 看 `topics` | 影响检索曝光 |
| 3 | SkillHub 插件收录触发条件与延迟 | 公开仓+topics 就绪后每天 `curl -s "https://api.skillhub.cn/api/v1/plugins?q=xiapan"` | 决定何时发 PR/宣传 |
| 4 | SkillHub 插件 categoryKey 是否可影响 | 收录后看 `categoryKey`；不对就在 README 强化「AI 音乐生成」 | 影响分类页曝光 |
| 5 | SkillHub 技能是否需要实名/企业认证 | 正式 publish 返回 403 时看提示；同时看网页控制台是否需要实名 | 阻塞技能发布 |
| 6 | ClawHub 技能是否会被 SkillHub 自动镜像 | 搜索 `skillhub search xiapan` 看是否出现 `@clawhub_*` 镜像 | 决定要不要单独发 SkillHub 技能 |
| 7 | dshbase 页面 URL 与 Verified 是否可得 | npm 发布后 1–2 天看 `/plugins/` 搜索 + L1–L4 结果 | 决定宣传口径（能否说 Verified） |
| 8 | skills.sh repo page 是否出现 | 发布后 24h 打开 `https://skills.sh/dongsheng123132/xiapan-music`；没有就多自测几次 `npx skills add` | 影响榜单曝光 |
| 9 | dshmp 页面 slug | 发布后 `curl -s "https://dshmp.com/api/plugins?q=xiapan"` 取 `slug` | 对外引用链接准确性 |
| 10 | ClawHub 发布页网页路径 | 浏览器打开 `https://clawhub.ai/skills/publish`（本机 CLI 抓取被 CF 拦，标注待验证） | 备用发布路径 |
| 11 | **CTA 域名可用性**：`api.u-claw.org` 本机 8/8 ECONNRESET（带代理也不通），`api.u-claw.org.cn` 4/4→200 | 浏览器打开两个域名对比；恢复后同步改回 | **所有「领 Key/充值」CTA 目前必须用 `.cn`**；README 里的 `.org` 链接要改 |
