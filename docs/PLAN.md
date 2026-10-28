# 虾盘云音乐（Xiapan Music）· 项目计划 v1

> 2026-10-28 · Lead 起草 · 所有 teammate 开工前必读
> 目标一句话：**给任意 AI 装上「一句话写歌」——用户说一句想写什么歌，AI 写词 + Suno v6 出歌 + 下载试听 + 一键去虾盘云画板做 MV。**
> 商业目的：**给虾盘云 API Key 带调用量 + 给虾盘云画板（https://tu.u-claw.org.cn）导流。**
> 两个入口：① Agent Skill（ClawHub / SkillHub / npx skills）② DSH 插件（npm 包 + dsh 插件广场收录）。

**仓库位置**：`C:\Users\ZhuanZ\Desktop\claude\u-claw\opentu-uclaw\xiapan-music`（独立 git 仓；外层 opentu-uclaw 已用 `.git/info/exclude` 排除，互不影响）

---

## 0. 当前状态

- [x] Suno 通道真机打通（2026-10-28 实测，证据 `artifacts/smoke/suno-20261028/`）
- [x] 画板线上地址、充值/领 Key 链路确认
- [ ] Core 客户端（T1）
- [ ] Skill 包（T1）
- [ ] DSH 插件（T2）
- [ ] 上架材料 + 市场调研（T3）
- [ ] 三个市场上架（Lead，需用户配合登录/OTP）

---

## 1. 已验证事实（2026-10-28 真机实测，直接照用，不要重新猜）

**端点**：`https://api.u-claw.org.cn`（国内外均可；`api.u-claw.org` 本机实测 8/8 ECONNRESET，已全量改 .cn）
**鉴权**：`Authorization: Bearer <KEY>`；Key 形如 `sk-...`（new-api token / `sk-xp-...` / U 盘设备 Key 均可）

### 1.1 出歌（Suno v6，异步任务）—— 2026-10-28 T1 真机修正版
```http
POST /suno/submit/music
{"prompt":"<完整歌词（带 [Verse 1]/[Chorus] 等结构标签）>","tags":"<英文风格描述>","title":"<可选>","mv":"chirp-v5-5"}
→ {"code":"success","data":"task_xxx"}          # data 是任务 ID 字符串
# 纯音乐：{"prompt":"<风格/情绪/场景描述>","tags":"<英文风格>","make_instrumental":true,"mv":"chirp-v5-5"}

GET /suno/fetch/{taskId}
→ {"code":"success","data":{"status":"NOT_START|IN_PROGRESS|SUCCESS","progress":"0%..100%",
    "data":[ { "clip_id","id","title","duration","audio_url","image_url","image_large_url",
               "model_name","major_model_version","metadata":{...} }, ... ] }}
```
- ✅ **整歌开关 = prompt 内容**：prompt 放**完整歌词**（318 字，带结构标签）→ 实测 2 首 **131.36s / 131.16s 完整歌**（≈2 分 11 秒），约 65-90 秒出结果。
- ⚠️ prompt 只放「一句风格描述」→ 模型把它当一句歌词，只出 24.68s/34.8s 短 clip。**“一句话出歌”的产品实现必须是：先让 LLM 写完整歌词（带标签），歌词进 prompt，风格进 tags。**
- `mv` 传 `chirp-v5-5` 或 `chirp-v6` 上游目前都落 v6（model_name=chirp-hawk），**mv 不是时长开关**。
- 音频直链已被代理成 `https://media.u-claw.org.cn/media/x/...`，**下载无需鉴权**。
- 💰 **计费修正**：一次提交实测扣 **1,200,000 token = ¥2.4（一次 2 首，合 ¥1.2/首）**。提交即扣费，不要自动重试提交。对外文案写「约 ¥2.4 一次（2 首）」。

### 1.2 写歌词（用同一个 Key 调文本模型，成本≈0）
```http
POST /v1/chat/completions
{"model":"deepseek-v4-flash","messages":[...],"thinking":{"type":"disabled"}}
```
- 必须带 `"thinking":{"type":"disabled"}`，否则 deepseek-v4 会只返回 reasoning_content。
- 让模型输出严格 JSON：`{"title":"...","tags":"...","lyrics":"..."}`（标签用英文逗号风格词）。

### 1.3 纯音乐 / BGM（pay-server）
```http
POST /v1/music/generations  {"model":"minimax-music-v2.6","prompt":"...","idempotency_key":"..."}
GET  /v1/music/generations/{id}          # 轮询 status，SUCCESS/COMPLETE
GET  /v1/music/generations/{id}/content  # 直接回音频字节，落盘即得
```
- minimax-music-v2.6 ¥1/首；完整可用样例照抄 `C:\Users\ZhuanZ\Desktop\claude\u-claw\uking-aigc-skill-repo\skills\uking-aigc\scripts\gen-bgm.mjs`（零依赖 + 系统 curl）。

### 1.4 余额
```http
GET /v1/dashboard/billing/subscription   → {"hard_limit_usd":..}
GET /v1/dashboard/billing/usage?start_date=2020-01-01&end_date=YYYY-MM-DD → {"total_usage":..}  # 单位：美分
token 余额 = (hard_limit_usd - total_usage/100) × 500000   # ¥1 = 500000 token
```

### 1.5 导流落点
- 画板：`https://tu.u-claw.org.cn`（线上已验证 200）
- 领 Key / 充值：注册 `https://api.u-claw.org.cn`（令牌管理创建 Key）→ 充值 `https://api.u-claw.org.cn/recharge`
- 充值页支持 `?key=sk-...` 自动填入，可做「生成完→一键充值」链接（注：对外一律用 .cn，`api.u-claw.org` 本机实测 8/8 ECONNRESET）
- UTM 约定：`utm_source=clawhub|skillhub|npxskills|dsh|github`、`utm_medium=skill|plugin|readme`、`utm_campaign=xiapan-music`

---

## 2. 仓库结构

```
【2026-10-28 结构调整 v2 · 官方范式】仓库形态改为「**一个 GitHub 仓 = DSH 插件 npm 包（根目录）+ 自带 Agent Skill（skills/）**」。
依据：同品类真实样板 `yinhcao/yinchao-ai-music-skill`（19★，SkillHub 插件广场已验证收录）——它的仓库根就是可安装 DSH 插件，内置 `skills/yinchao-ai-music/` 技能；同一个仓同时进入 SkillHub 插件广场（爬 GitHub topics）、npm、skills.sh、awesome-dsh-plugin、ClawHub 技能。参考文件快照在 `artifacts/reference/`（只读，学结构不抄代码）。

```
xiapan-music/                      # 仓根 = npm 包 dsh-xiapan-music（可 dsh plugin add）
├── package.json                   # T2：name dsh-xiapan-music / dsh.bundle.patch / peerDeps
├── index.mjs                      # T2：inject credentials,skills,subprocess,tools；注册技能+工具
├── cordis.patch.yml               # T2
├── src/core/
│   └── xiapan-music.mjs           # T1：唯一核心客户端（零依赖 ESM）
├── src/server/**                  # T2：服务端辅助代码（如需）
├── scripts/
│   ├── sync-core.mjs              # T1：src/core → skills/.../scripts/lib（sha256）
│   └── verify.mjs                 # T1/Lead：闸门（语法/一致性/无密钥）
├── skills/xiapan-music/           # T1：自包含技能（ClawHub/SkillHub/skills.sh 发布单元，也被插件注册）
│   ├── SKILL.md / README.md
│   ├── scripts/{song,lyrics,bgm,balance}.mjs + scripts/lib/xiapan-music.mjs
│   └── references/music.md
├── media/                         # T2：截图/首图素材（如有）
├── docs/                          # PLAN/api-contract/market-research/publishing/plugin-dev
├── artifacts/
│   ├── reference/                 # Lead：竞品快照（yinchao/kendu）
│   ├── smoke/suno-20261028/       # T1：实测 mp3 + 原始响应
│   └── publish/                   # T3：各市场文案/截图/发布回执
├── README.md / LICENSE / .gitignore  # Lead
```

**写作用域（互不重叠）**
- T1：`src/core/**`、`scripts/**`、`skills/**`、`docs/api-contract.md`、`artifacts/smoke/**`
- T2：根 `package.json`、`index.mjs`、`cordis.patch.yml`、`src/server/**`、`media/**`、`docs/plugin-dev.md`
- T3：`docs/market-research.md`、`docs/publishing.md`、`artifacts/publish/**`
- Lead：`README.md`、`LICENSE`、`.gitignore`、`docs/PLAN.md`、`artifacts/reference/**`、发布动作、最终验收

---

## 3. Core 模块契约（T1 交付，T2/T3 按此对接）

`src/core/xiapan-music.mjs`，**纯 ESM、零 npm 依赖、Node ≥ 18（本机 v24）**，允许注入 `fetch` 以便测试。

```js
export function resolveKey({ key, env = process.env, deviceFile } = {}): string
// 顺序：显式 key > env.XIAPAN_API_KEY（DSH 插件会注入）> ~/.uking/device.json 的 key；都没有抛 BAD_KEY

export async function queryBalance(key)
// -> { totalToken, usedToken, remainToken, remainCny }

export async function writeLyrics({ theme, style, language = "zh", title }, key)
// -> { title, tags, lyrics }   // /v1/chat/completions，thinking 关闭，严格 JSON 解析+容错

export async function submitSong({ prompt, title, tags, mv = "chirp-v6" }, key)
// -> { taskId }   // 只提交一次，禁止自动重试

export async function waitSong(taskId, { key, intervalMs = 5000, timeoutMs = 600000, onProgress })
// -> { status: "completed", clips: [{ audioUrl, imageUrl, clipId, title, duration, model, mv }] }

export async function downloadClip(url, outFile)  // -> { file, bytes }

export async function generateSong(opts, key)
// 高层编排：有 lyrics 直接用；没有就 writeLyrics；submit+wait+下载
// -> { ok:true, songs:[{file,title,lyrics?,duration,clipId,imageUrl}], elapsedMs, provider:{taskId,model,mv}, costHint }

export async function generateBgm({ prompt, model, outFile }, key)  // -> { ok:true, file, taskId }

export class XiapanMusicError extends Error { code; details }
// code ∈ BAD_KEY | NO_BALANCE | RATE_LIMIT | BAD_REQUEST | TASK_FAILED | TIMEOUT | NETWORK
```

**红线**
- 任何日志/输出/报错都不得包含完整 Key（只允许前 8 位）。
- 付费请求（submit）不自动重试；轮询可重试网络错误。
- 金额文案只用「以实际扣费为准 / 约 ¥2.4 一次（2 首）」，不编造。

---

## 4. Skill 包要求（T1）

- **自包含**：把 `skills/xiapan-music/` 整个目录拷给任何 Agent 即可用；`scripts/lib/xiapan-music.mjs` 由 `scripts/sync-core.mjs` 从 core 复制（sha256 头注释校验）。
- `SKILL.md` frontmatter 同时满足 ClawHub 与 SkillHub：
  ```yaml
  name: xiapan-music
  slug: xiapan-music
  displayName: 虾盘云音乐 · 一句话出歌
  version: 0.1.0
  summary: 一句话生成完整歌曲（AI 写词 + Suno v6），下载 mp3；也能出纯音乐 BGM、查余额。BYOK，虾盘云 Key。
  description: 同上，写清触发词（写歌/做音乐/生成歌曲/BGM/歌词）
  license: MIT
  tags: [music, suno, song, lyrics, bgm, ai-music, xiapan]
  ```
- 脚本：`song.mjs`（主入口）、`lyrics.mjs`、`bgm.mjs`、`balance.mjs`；统一 `--key --json --out`，退出码 0/1/2，进度走 stderr、结果走 stdout。
- SKILL.md 必须写清：**扣费前先给用户看「制作卡」（歌名/风格/歌词/模型/约 ¥2.4 一次出 2 首）并等确认，一次只提交一次**（照抄 tokenfish 的硬规则）。
- 生成成功后固定 CTA（终端 + JSON 字段 `nextSteps`）：
  - 去画板做 MV/继续创作：`https://tu.u-claw.org.cn/?utm_source=<src>&utm_medium=skill&utm_campaign=xiapan-music`
  - 没 Key/余额：`https://api.u-claw.org.cn`（注册建 Key）、`https://api.u-claw.org.cn/recharge?key=<KEY>`（充值）
- `references/music.md`：中文写词/风格标签方法论（从 `songwriting-and-ai-music` skill 提炼，不要整编 308 行）。
- README：3 行安装（ClawHub / SkillHub / `npx skills add dongsheng123132/xiapan-music`）+ 手动拷贝 + 示例输出。

---

## 5. DSH 插件要求（T2）—— v1 host-only，官方范式

- 根 `package.json`：`name: dsh-xiapan-music`、`version 0.1.0`、`type: module`、`main: ./index.mjs`、`exports {".":"./index.mjs","./cordis.patch.yml":"./cordis.patch.yml","./package.json":"./package.json"}`、`files: ["index.mjs","cordis.patch.yml","src/core","skills/xiapan-music","README.md","LICENSE"]`、`keywords` 含 `dsh-plugin/deepseek-harness/agent-skills/ai-music/text-to-music/music-generation/suno/xiapan`、`engines.node >=22`、`dsh.bundle.patch: ./cordis.patch.yml`、`peerDependencies` 参考 yinchao：`@deepseek-ai/dsh-credentials`、`dsh-skill-filesystem`、`dsh-subprocess`、`dsh-tools`（`^0.1.0-rc.6 || ^0.1.1-rc.1` 起步，按本机实测调整）。
- 根 `index.mjs`：`export const name='dsh-xiapan-music'`、`inject=['credentials','skills','subprocess','tools']`；`apply(ctx)`：
  - `ctx.skills.registerProvider(control => new FileSystemSkillProvider(ctx, control, { providerName:'xiapan-music', includeDefaultRoots:false, bundledSkillDir:'<repo>/skills' }))`
  - `ctx.tools.register(defineTool({ name:'xiapan_music', parameters:{ action:{enum:['song','instrumental','lyrics','balance','status']}, argv:{type:'array'} }, execute }))`
  - execute：`ctx.credentials.resolve(credentialRef('XIAPAN_API_KEY'))`（取不到不阻断，脚本 fallback 设备 Key）→ `ctx.subprocess.spawn({argv:[node, skills/xiapan-music/scripts/<…>.mjs, action, ...argv, '--json'], env:{XIAPAN_API_KEY}})` → 密钥脱敏 → `JSON.parse(stdout)` 返回；`timeoutMs: 660000`。
- 根 `cordis.patch.yml`：`- insert: - id: dsh-xiapan-music  name: dsh-xiapan-music`。
- **v1 不做 Web UI 面板**（竞品 yinchao 同款做法，降低风险）；Web 面板写进 `docs/plugin-dev.md` roadmap（v1.1：Key 输入、进度、内联播放、画板 CTA）。
- 必读 skill：`plugin-write`（命名/manifest/校验）、`plugin-test`（测试层级）、`plugin-workflow`（生命周期收口）；`plugin-release` 只读（**不发布**）。
- **测试隔离**：不要动 `~/.dsh/profiles/web` 与 53893 会话；新建隔离 profile 验证：`dsh plugin --profile <test> add <本仓路径或 github:owner/repo>` → 起独立端口 → agent 调 `xiapan_music` 真生成 1 首（≤¥2）→ 日志/截图留档 → `npm pack` 检查。
- 产物：`docs/plugin-dev.md`（安装/凭据配置/验证步骤/roadmap/已知限制）。不得硬编码 Key。

---

## 6. 上架（T3 准备，Lead 执行，需用户点头）

**范式证据**：竞品 `yinhcao/yinchao-ai-music-skill` 一个仓挂 6 个入口（GitHub / SkillHub 插件广场 / SkillHub 技能 / ClawHub / skills.sh / awesome-dsh-plugin），SkillHub 插件广场是爬 GitHub 仓库（API 字段 `topics` + `manifest`=仓库根 package.json + `installability:"verified"`）。

| # | 入口 | 机制 | 自动化 | 用户配合 | 生效延迟 |
|---|---|---|---|---|---|
| 1 | GitHub `dongsheng123132/xiapan-music` | 公开仓 + topics `dsh/dsh-plugin/agent-skills/ai-music/text-to-music/suno/xiapan/...` | 手动 push（需批准） | 确认公开 + gh 登录 | 立即 |
| 2 | SkillHub 插件广场 `skillhub.cn/plugins` | 爬 GitHub 仓（manifest + topics 校验） | ✅ 自动 | 无（实名可能影响展示） | ~1 天 |
| 3 | npm `dsh-xiapan-music` → dshbase.com / dshmp.com 收录 | `npm publish --registry=https://registry.npmjs.org --otp …` + `dsh-plugin` 关键字 | ✅ 目录自动 | npm OTP（恢复码） | ~1 天 |
| 4 | awesome-dsh-plugin.com `/p/<owner>/<repo>/` | 爬 GitHub 仓 | ✅ 自动 | 无 | ~1 天 |
| 5 | SkillHub 技能（中国技能市场） | `skillhub login --host https://api.skillhub.cn --key skh_…` → `skillhub publish skills/xiapan-music --dry-run` → 正式 | ❌ 手动 | 手机号+实名+API Token | 审核后 |
| 6 | ClawHub 技能 | `clawhub login` → `clawhub publish skills/xiapan-music --slug xiapan-music --name "虾盘云音乐 · 一句话出歌" --version 0.1.0 --changelog …` | ❌ 手动 | 浏览器登录（可微信/邮箱） | 立即（有审计） |
| 7 | skills.sh | `npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y`（仓库结构对即被索引） | ✅ 自动 | 无 | ~1 天 |
| 8 | GitHub 本体 / README | 仓即落地页 | 手动 push | 同 #1 | 立即 |

**顺序**：GitHub（#1）→ npm（#3）→ SkillHub 插件广场/awesome/skills.sh 等自动收录（#2 #4 #7）→ SkillHub 技能（#5）→ ClawHub（#6）→ 各详情页互链补图。
**注意**：ClawHub 页面 handle 是发布者账号（竞品挂在 `joeydqyuan` 名下）；SkillHub 技能 slug 全网唯一，冲突就加 `-xp` 后缀；所有入口文案必须含画板 CTA + UTM。

T3 交付：
- `docs/market-research.md`：上表各入口真实案例（≥5）、收录条件、categoryKey/topics 选择、首图/README 结构、SEO 关键词、我们的差异点。
- `docs/publishing.md`：上表逐条可复制 runbook（前置/命令/字段/验证 URL/回滚/常见错误/审核注意）。
- `artifacts/publish/`：中英文列表文案、首图/截图规格与文件、发布记录模板。
- 本机 dry-run 只读检查：`clawhub --cli-version/whoami`、`skillhub --version/auth whoami`、`npm ping --registry=https://registry.npmjs.org`、`gh auth status`、`openclaw --version`；输出「需要用户做什么」checklist。

---

## 7. 预算与纪律

- 真实生成预算：**全项目 ≤ ¥10**（Suno ¥2.4/次出 2 首、BGM ¥1/首、歌词 ≈¥0.01）。每次生成前说明目的；不得批量刷。
- 密钥只从 `~/.uking/device.json` / 环境变量读；禁止写入任何文件、禁止进 git、禁止进日志。
- 不改 `opentu-uclaw` 本仓与虾盘云线上代码；只在 `xiapan-music/` 里做事。
- 提交前：`git status` 无密钥、无大文件（mp3 只放 `artifacts/` 且已 gitignore）。
- 未经 Lead 明确批准，**任何人不得 publish / push 公网 / 改线上站**。

---

## 8. 任务板（Lead 创建）

- **T1 core+skill**（owner：music-skill）：§3 + §4 + `docs/api-contract.md` + smoke 证据。关键未知：带歌词是否出整歌、纯音乐参数、失败形态。
- **T2 dsh-plugin**（owner：dsh-plugin）：§5 v1 host-only。先用 yinchao 范式搭根包，等 T1 核心落地后接线联调。
- **T3 market+publish prep**（owner：market-publish）：§6 调研+文案+dry-run+checklist。
- **Lead**：根 README/LICENSE/.gitignore、PLAN、竞品快照、发布动作、用户配合清单、最终 e2e 验收。

## 9. 验收（Lead 最终跑）

1. 干净临时目录里：`node skills/xiapan-music/scripts/song.mjs --theme "…" --json` 只出制作卡（exit 2，不扣费）；加 `--confirm` 才真出歌（exit 0，2 首 mp3，约 ¥2.4）。两步都验（自包含 + 两段式硬规则）。
2. `npm pack` 产物在干净目录 `dsh plugin --profile <隔离> add <tgz>` 成功；DSH 会话里 agent 调 `xiapan_music` 真生成 1 首、文件可播放。
3. `clawhub inspect xiapan-music`、SkillHub 技能详情页 200、SkillHub 插件广场出现本仓、npm 包页 200、dshbase/dshmp 收录、awesome-dsh-plugin 页存在（自动收录允许 1 天延迟，逐项记 URL）。
4. 所有 CTA 链接带 UTM 且 200；README 无失效链接。
5. `git status` 干净、无密钥、无超 5MB 二进制（artifacts 除外）。


