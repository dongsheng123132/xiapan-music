# 虾盘云音乐 · 上架文案与视觉规格（中英文）

> T3 · 2026-10-28 · 可直接复制到各平台表单。
> 固定常量：slug=`xiapan-music` · displayName=`虾盘云音乐 · 一句话出歌` · version=`0.1.0` · license=`MIT` · npm=`dsh-xiapan-music`。
> 价格口径（**2026-10-28 Lead 拍板**）：一律用「约 ¥2.4 / 次（一次 2 首），以实际扣费为准」；以 T1 真机实测扣费为准（¥1.2/首 × 2 首）。

---

## 1. 各平台字段映射（先看这张表再复制）

| 平台 / 位置 | 标题字段 | 一句话字段 | 长描述字段 | 标签字段 | 安装命令展示 |
|---|---|---|---|---|---|
| **ClawHub** | `--name`（displayName） | `SKILL.md` frontmatter `summary` | `SKILL.md` 正文（详情页渲染） | frontmatter `metadata.tags` + 平台自动 topic | `openclaw skills install @dongsheng123132/xiapan-music` |
| **SkillHub 技能** | frontmatter `displayName` | `summary`（payload） | `description`（payload，可长） | `tags`（payload，数组） | `skillhub install xiapan-music --namespace user_abeb50e0` |
| **SkillHub 插件广场** | 仓库 `owner/repo` | GitHub repo `description` | 仓库 `README.md`（API 抓全文） | 仓库 topics | `dsh plugin --profile web add dsh-xiapan-music` |
| **npm / dshmp / dshbase** | `package.json` `name` | `package.json` `description` | npm README（= 仓库 README） | `keywords` | `npm i -g dsh-xiapan-music` / `dsh plugin add dsh-xiapan-music` |
| **awesome-dsh-plugin** | YAML `name` | YAML `description.en/zh` | 仓库 README | YAML `category` + 仓库 topics | `dsh plugin --profile web add dsh-xiapan-music` |
| **skills.sh** | 仓库 `owner/repo` | GitHub `description` | 仓库 README | 仓库 topics | `npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y` |
| **GitHub** | repo name | repo description | `README.md` | topics | README 首屏 |

> **一致性要求**：`displayName` / npm `description` / GitHub repo description 三处口径必须一样（都用「一句话出歌」，不要一处「写歌」一处「出歌」）。
> ⚠️ 当前 `package.json` description 写的是「一句话**写歌**」，与 displayName「一句话**出歌**」不一致 → 发布前统一为「出歌」。

---

## 2. 中文文案

### 2.1 标题套件

| 用途 | 文案 |
|---|---|
| 主标题（displayName） | 虾盘云音乐 · 一句话出歌 |
| 长标题（详情页 H1，可带英文） | 虾盘云音乐 · 一句话出歌（Xiapan Music） |
| 短标题（列表卡片、窄位） | 虾盘云音乐 |
| 备用标题（若平台限制长度） | 虾盘云音乐 · AI 写词 + Suno 出歌 |

### 2.2 一句话简介（按字数取用）

**A 版 · 超短（≤30 字，卡片/列表）**
> 说一句想写什么歌，AI 写词 + Suno v6 出 2 首完整歌。

**B 版 · 标准（≤60 字，ClawHub summary / SkillHub summary）**
> 一句话生成完整歌曲：AI 写词 + Suno v6 出 2 首，可试听下载 mp3；也能出纯音乐 BGM、查余额。BYOK，虾盘云 Key，装了虾盘 U 盘免配置。

**C 版 · 带触发词（≤160 字，检索权重最高的位置）**
> 虾盘云音乐（Xiapan Music）：一句话出歌。你说想听什么歌，AI 自动作词（中文/英文），Suno v6 生成 2 首完整歌曲，可试听、可下载 mp3；也支持已有歌词谱曲、纯音乐 BGM、视频配乐、播客片头、生日歌/毕业歌/班级歌、短视频配乐，以及查询虾盘云余额。BYOK：用你自己的虾盘云 Key；装了虾盘 U 盘 / U-King 的电脑零配置开箱即用。出歌后可直接去虾盘云画板配画面、做 MV。

**D 版 · 英文式描述（用于需要英文 summary 的平台）**
> One sentence in, a full song out — AI writes the lyrics, Suno v6 renders 2 complete tracks you can preview and download as mp3. Also makes instrumental BGM, writes lyrics-only, and checks your Xiapan balance. BYOK with a Xiapan API key; zero-config on Xiapan USB devices.

### 2.3 长描述（详情页正文，ClawHub `SKILL.md` / SkillHub `description` / GitHub README 首屏可复用）

```markdown
# 虾盘云音乐 · 一句话出歌

> 你说一句想听什么歌，AI 写词 + Suno v6 出 2 首完整歌，试听、下载 mp3，一键去画板做 MV。

## 它能干什么

- **一句话出歌**：给一句描述（例：「写一首关于深夜便利店的城市流行歌」），AI 自动定风格、写词、出 2 个版本，30–90 秒后可听、可下载。
- **已有歌词谱曲**：把你的词直接交给 Suno 唱出来，不改词。
- **纯音乐 / BGM**：视频配乐、口播背景、播客片头、游戏 BGM，无人声。
- **查余额**：这把 Key 还能出几首，一句话问清楚。
- **出歌之后**：拿到 mp3 与封面后，直接去[虾盘云画板](https://tu.u-claw.org.cn/?utm_source=<market>&utm_medium=skill&utm_campaign=xiapan-music)配画面、排歌词、做 MV。

## 30 秒上手

1. **拿 Key**：注册 [api.u-claw.org.cn](https://api.u-claw.org.cn)（令牌管理 → 创建 Key）→ 充值 [api.u-claw.org.cn/recharge](https://api.u-claw.org.cn/recharge)。**装了虾盘 U 盘 / U-King 的电脑不用配，自动使用设备 Key。**
2. **装**（三选一）：
   ```bash
   # Agent Skill
   npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y
   # 或 ClawHub
   openclaw skills install @dongsheng123132/xiapan-music
   # 或 DeepSeek Harness 插件
   dsh plugin --profile web add dsh-xiapan-music
   ```
3. **说一句**：「写一首送给毕业十年老同学的温暖民谣」→ 等出歌 → 试听 → 下载。

## 为什么用它

- **BYOK 零配置**：不绑平台账号、不跳网页授权；装了虾盘 U 盘 / U-King 的机器直接读设备 Key，新机器才需要填一次 `XIAPAN_API_KEY`。
- **中文写词是专门调过的**：歌词走中文模型 + 严格 JSON 输出（歌名 / 风格标签 / 正文），不是把中文硬塞进英文出歌接口。
- **出歌只是开始**：歌能直接带进虾盘云画板做 MV，形成「写歌 → 配画面 → 成片」的闭环，别家到 mp3 就结束了。
- **不替你花钱**：提交前先给你看「制作卡」（歌名 / 风格 / 歌词 / 模型 / 预计费用）并等你确认，一次只提交一次。

## 凭据与安全

- Key 只从 `XIAPAN_API_KEY` 环境变量、`~/.uking/device.json` 设备文件或本次显式参数读取；
- 不写盘、不进日志、不在输出里回显（只允许显示前 8 位）；
- 本项目不收集任何用户数据，生成内容只在你本机与虾盘云 API 之间流转。

## 费用

一次出歌约 **¥2.4**（一次出 2 首完整歌）；纯音乐 BGM 约 ¥1/首；写词用文本模型，成本可忽略。**以虾盘云实际扣费为准**，请先充值再生成。

## 限制

- 只支持虾盘云 API Key（`sk-...` / `sk-xp-...` / 设备 Key）；
- 出歌依赖 Suno v6，需联网，通常 30–90 秒；
- 生成音乐的版权归你，商用前请自行确认所在平台的条款。

## 链接

- 仓库：https://github.com/dongsheng123132/xiapan-music
- 领 Key：https://api.u-claw.org.cn
- 充值：https://api.u-claw.org.cn/recharge
- 画板（做 MV）：https://tu.u-claw.org.cn/?utm_source=<market>&utm_medium=skill&utm_campaign=xiapan-music
```

### 2.4 触发词清单（写进 description/summary 的尾部，吃中文检索）

> 写歌、做音乐、生成歌曲、AI 作曲、AI 写歌、歌词生成、文字生成音乐、一句话出歌、出首歌、来首歌、做首歌、纯音乐、BGM、背景音乐、视频配乐、播客片头、游戏 BGM、生日歌、毕业歌、班级歌、表白歌、广告歌、短视频配乐、歌词谱曲、把词唱出来、查余额

英文（吃英文检索）：`music generation, AI music, text-to-music, song, lyrics, instrumental, BGM, Suno, songwriting, one-sentence song`

### 2.5 标签

| 平台 | 标签值（照抄） |
|---|---|
| ClawHub `metadata.tags` | `[AI音乐, AI写歌, 一句话出歌, 歌词生成, BGM, 纯音乐, Suno, 虾盘云]` |
| ClawHub 英文 topic（平台自动/description 影响） | `music, ai-music, text-to-music, lyrics-to-song, song, bgm, suno` |
| SkillHub 技能 `tags` | `["AI音乐","AI写歌","歌词生成","文字生成音乐","BGM","纯音乐","Suno","虾盘云"]` |
| SkillHub 插件 topics / GitHub topics | `dsh-plugin, deepseek-harness, agent-skills, ai-music, text-to-music, suno, chinese` |
| npm keywords | `dsh, dsh-plugin, deepseek-harness, agent-skills, music, suno, ai-music, text-to-music, music-generation, xiapan` |

### 2.6 安装命令（所有地方统一这三条）

```bash
# ① Agent Skill（npx skills / skills.sh）
npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y

# ② ClawHub
openclaw skills install @dongsheng123132/xiapan-music

# ③ DeepSeek Harness 插件
dsh plugin --profile web add dsh-xiapan-music
```

---

## 3. 英文文案（给英文平台/英文用户；同内容不重复写两套长文）

### 3.1 Title / Tagline

| 用途 | 文案 |
|---|---|
| Title | Xiapan Music — One Sentence, A Whole Song |
| Short (≤30 chars) | One sentence in, songs out |
| Tagline (≤160 chars) | Turn one sentence into a complete song: AI writes the lyrics, Suno v6 renders two tracks, preview and download mp3. Instrumental BGM too. BYOK Xiapan API key. |

### 3.2 Short summary (ClawHub-style English summary)

> Generate complete songs from one sentence: AI writes Chinese/English lyrics, Suno v6 renders 2 tracks as downloadable mp3. Also makes instrumental BGM, writes lyrics-only, and checks your Xiapan balance. Bring your own Xiapan API key — zero-config on Xiapan USB devices. Use when the user asks to write a song, create music, generate a song from lyrics, or make background music.

### 3.3 Long description (English, condensed for plug-in listings)

```markdown
# Xiapan Music — One Sentence, A Whole Song

Describe the song you want in one sentence. Xiapan Music writes the lyrics, has Suno v6 render two complete tracks, and hands you mp3 files you can preview and download. Then take the track to the Xiapan whiteboard to build a music video.

## What it does
- Song from one sentence (AI lyrics + Suno v6, two takes per request)
- Lyrics-to-song: keep your lyrics, get them sung
- Instrumental / BGM for videos, podcasts, games
- Balance check for your Xiapan API key
- Hand-off to Xiapan Canvas for a music video

## Quick start
1. Get a key at https://api.u-claw.org.cn (or plug in a Xiapan USB device — device key is picked up automatically).
2. Install:
   `npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y`
   or `dsh plugin --profile web add dsh-xiapan-music`
3. Ask: "write a warm city-pop song about a convenience store at midnight".

## Why this one
- **BYOK, zero config**: no account linking, no OAuth; device keys on Xiapan USB just work.
- **Chinese lyrics are first-class**: dedicated Chinese lyric model with strict JSON output.
- **Beyond mp3**: the song can go straight into Xiapan Canvas to become a music video.
- **No surprise charges**: shows a "production card" (title / style / lyrics / model / estimated cost) and asks before submitting.

## Cost
About ¥2.4 per song request (two full tracks), about ¥1 per instrumental. Actual billing follows your Xiapan account.

## Notes
- Requires a Xiapan API key.
- Songs usually take 30–90 seconds.
- Rights to generated music are yours; check the terms of your jurisdiction before commercial use.
```

### 3.4 English keywords

`music generation, ai music, text-to-music, lyrics-to-song, song generator, instrumental, BGM, Suno, songwriting, one-sentence song, agent skill, dsh-plugin`

---

## 4. 首图 / 截图规格清单

> 原则：**全部用真实界面/真实输出拍**，不合成假 UI、不 P 数据。截图里**不得出现完整 Key**（需要展示时打码成 `sk-****`）。

### 4.1 资产清单（发布前必须备齐）

| # | 文件名 | 尺寸（px） | 格式/大小 | 展示什么 | 用在哪 |
|---|---|---|---|---|---|
| 1 | `assets/hero-1200x630.png` | **1200×630**（16:9 略宽，社媒/OG 标准） | PNG，≤300KB | 左侧一句台词「写一首关于深夜便利店的城市流行歌」→ 右侧生成结果卡（歌名 + 波形/音频条 + 时长 00:47 + 下载按钮）；底部一行小字 `AI 写词 + Suno v6 · 2 首/次 · 下载 mp3` | SKILL.md 第一屏、README 首屏、ClawHub 详情页 |
| 2 | `assets/icon-180.png` | **180×180** | PNG，≤50KB | 深色圆角方块 + 白色音符/波形 + 品牌橙（`#F39C12`）点 | awesome-dsh-plugin YAML `icon`（**硬要求**，GitHub raw 托管） |
| 3 | `assets/icon-512.png` | **512×512** | PNG，≤150KB | 同 #2 高清版 | ClawHub / SkillHub 技能 icon（若可传）、npm 社交图 |
| 4 | `artifacts/publish/shot-1-result.png` | **1600×1000**（或 1440×900） | PNG，≤500KB | DSH Web「音乐」面板：输入框里一句中文 + 生成中的进度条 + 下方两条 `<audio>` 结果 + 下载按钮 | SkillHub 插件 README、GitHub README、awesome 详情 |
| 5 | `artifacts/publish/shot-2-terminal.png` | **1440×900** | PNG，≤300KB | 终端一次完整出歌：`node song.mjs --prompt "..."` → 进度 → 输出 2 个 mp3 路径 + CTA 两行（画板/充值） | README「命令行也能用」、ClawHub 详情 |
| 6 | `artifacts/publish/shot-3-canvas.png` | **1600×1000** | PNG，≤500KB | 虾盘云画板里：这首歌的封面图 + 歌词卡片 + 时间轴，证明「出歌→做 MV」链路 | README、画板导流位 |
| 7 | `artifacts/publish/demo.gif`（可选） | 宽 **≤800**，高 ≤600，≤8 秒 | GIF，**≤5MB** | 面板里输入一句话 → 进度 → 出歌 → 点下载 的连续操作 | README 顶部（GitHub 支持 GIF） |

### 4.2 拍摄方法（可执行步骤，交给 T2/Lead）

1. **#4 面板截图**：`dsh web` 起 Web GUI（或复用 T2 已验证的临时 profile）→ 打开「音乐」面板 → 填一句中文 → 生成 → 等完成 → 用系统截图工具截窗口（不要用浏览器 devtools 全页截图，避免带地址栏）。
2. **#5 终端截图**：干净临时目录跑一次真实出歌（预算内 1 次）；截 PowerShell 窗口；**Key 一律打码**（命令行里不要带 `--key`，用 env 传入，截图前确认看不到）。
3. **#6 画板截图**：把 #5 生成的封面/歌词拖进 `https://tu.u-claw.org.cn`，排一张 MV 分镜，截图时带上画板 URL 的可见标签页（增强可信度）。
4. **#1 hero**：用 #4 + #5 的真实素材在 Figma/画板里拼（左输入右结果），**不要重绘 UI 控件**；文字层只用系统字体（无渐变发光、无英文装饰）。
5. **#7 GIF**：Windows 可用 ScreenToGif 录面板操作，导出 800px、8 秒、10fps。

### 4.3 视觉红线（用户审美）
- 浅色卡片、单色强调；**不要**深色大屏、LCD 字体、英文装饰、渐变发光。
- 圆角：卡片 12px、按钮 8px；主色沿用品牌橙 `#F39C12`，强调蓝 `#5A4FCF`。
- 图里出现的数字必须与真实一致（时长、费用、首数），不 P 数据。

### 4.4 存放位置
- 进仓库（会出现在 npm 包与 GitHub README）：`assets/hero-1200x630.png`、`assets/icon-180.png`、`assets/icon-512.png`。
- 仅作发布材料的截图/GIF：`artifacts/publish/shot-*.png`、`artifacts/publish/demo.gif`（若担心仓库体积，加进 `.gitignore`，只在本机用）。
- 命名必须固定（上面的文件名就是各平台要填的路径）。

---

## 5. CTA 与 UTM 矩阵（每条 CTA 都要带，便于归因）

### 5.1 三条落地链接

| 目标 | URL |
|---|---|
| 画板（做 MV） | `https://tu.u-claw.org.cn/?utm_source=<market>&utm_medium=<skill|plugin>&utm_campaign=xiapan-music` |
| 领 Key | `https://api.u-claw.org.cn` |
| 充值 | `https://api.u-claw.org.cn/recharge?key=<KEY>`（`<KEY>` 由用户自己的 Key 动态替换，**永远不要写死真 Key**） |

> ⚠️ 域名实测（2026-10-28）：`api.u-claw.org`（不带 `.cn`）本机 **8/8 全部 ECONNRESET**，带代理也不通；`api.u-claw.org.cn` **4/4 返回 200**。→ **所有 CTA 用 `.cn`**；`.org` 只在确认恢复后作为备用回填。

### 5.2 每个市场的参数（照抄）

| 市场 | `utm_source` | `utm_medium` | 完整画板链接 |
|---|---|---|---|
| ClawHub | `clawhub` | `skill` | `https://tu.u-claw.org.cn/?utm_source=clawhub&utm_medium=skill&utm_campaign=xiapan-music` |
| SkillHub 技能 | `skillhub` | `skill` | `https://tu.u-claw.org.cn/?utm_source=skillhub&utm_medium=skill&utm_campaign=xiapan-music` |
| SkillHub 插件广场 | `skillhub` | `plugin` | `https://tu.u-claw.org.cn/?utm_source=skillhub&utm_medium=plugin&utm_campaign=xiapan-music` |
| dshmp / dshbase / awesome / dsh-market | `dsh` | `plugin` | `https://tu.u-claw.org.cn/?utm_source=dsh&utm_medium=plugin&utm_campaign=xiapan-music` |
| skills.sh / npx skills | `npxskills` | `skill` | `https://tu.u-claw.org.cn/?utm_source=npxskills&utm_medium=skill&utm_campaign=xiapan-music` |
| GitHub README | `github` | `readme` | `https://tu.u-claw.org.cn/?utm_source=github&utm_medium=readme&utm_campaign=xiapan-music` |

### 5.3 发布前自测（只读，不发任何东西）

```bash
# 六条画板链接 + 领 Key + 充值页，全部应 200
for u in \
 "https://tu.u-claw.org.cn/?utm_source=clawhub&utm_medium=skill&utm_campaign=xiapan-music" \
 "https://tu.u-claw.org.cn/?utm_source=skillhub&utm_medium=skill&utm_campaign=xiapan-music" \
 "https://tu.u-claw.org.cn/?utm_source=skillhub&utm_medium=plugin&utm_campaign=xiapan-music" \
 "https://tu.u-claw.org.cn/?utm_source=dsh&utm_medium=plugin&utm_campaign=xiapan-music" \
 "https://tu.u-claw.org.cn/?utm_source=npxskills&utm_medium=skill&utm_campaign=xiapan-music" \
 "https://tu.u-claw.org.cn/?utm_source=github&utm_medium=readme&utm_campaign=xiapan-music" \
 "https://api.u-claw.org.cn" \
 "https://api.u-claw.org.cn/recharge" ; do
  printf "%s -> " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "$u"
done
```

**T3 实测结果（2026-10-28，只读）**

| 链接 | 结果 |
|---|---|
| 画板 × 6 条（clawhub / skillhub×2 / dsh / npxskills / github，均带 UTM） | **6/6 → HTTP 200** ✅ |
| `https://api.u-claw.org.cn`（领 Key） | **200** ✅ |
| `https://api.u-claw.org.cn/recharge`（充值） | **200** ✅ |
| `https://api.u-claw.org`（不带 .cn，旧口径） | **8/8 ECONNRESET** ❌ 不可用 |

> 注意：本机 `curl.exe` 在沙箱内会报 `schannel: SEC_E_NO_CREDENTIALS`（与网络无关，是沙箱证书存储限制）。上面结果用 Node 24 `fetch` 测得；真机验证请用浏览器或 `node -e` 版本。

---

## 6. 写文案的红黑榜

**✅ 要写**
- 第一句就是结果：「一句话 → 完整歌 → 下载 mp3」。
- 三个差异只写一次、写具体：BYOK 零配置（U 盘设备 Key）/ 中文写词专门调过 / 出歌后能去画板做 MV。
- 触发词成串放在 description 尾部（吃检索，不影响阅读）。
- 费用写「约…，以实际扣费为准」。
- 安全口径写清：Key 不落盘、不回显。

**❌ 不能写**
- 「最强 / 第一 / 秒杀 / 史上最好」——awesome 明确拒收营销词，其他平台审核也会打回。
- 精确到分的价格承诺（口径未定稿时）。
- 「版权无忧 / 商用免费」——不做法律承诺。
- 竞品名字做对比（易被举报）。
- 任何真实 Key/Token（示例里用 `sk-****`）。
- 「Verified」自称（要等 dshbase 页面真的标了才写）。

---

## 7. 待补清单（发布前逐项打勾）

- [ ] `package.json` description 与 displayName 口径统一为「一句话出歌」
- [ ] 价格口径 Lead 拍板（¥1.2 还是 ¥2.4）→ 同步 README / listings / SKILL.md
- [ ] `skills/xiapan-music/SKILL.md` 就位（含 slug/version/displayName/summary/tags；T1）
- [ ] `assets/hero-1200x630.png`、`assets/icon-180.png`、`assets/icon-512.png` 产出并提交
- [ ] `artifacts/publish/shot-1..3.png` 用真实界面拍完
- [ ] 六条画板 UTM 链接 200 自测通过（§5.3）
- [ ] 英文 tagline ≤160 字符复核（§3.1）
- [ ] 所有文案里搜一遍 `sk-` / `skh_` / `gho_`，确认零真实凭据

