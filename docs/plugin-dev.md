# dsh-xiapan-music · DSH 插件开发与验收记录

> 版本：v1（host-only，无 Web 面板）· 0.1.0 · 2026-10-28 · owner：T2 dsh-plugin
> 对外名称：**虾盘云音乐 · 一句话出歌**
> 价格口径：**约 ¥2.4/次（一次出 2 首），以实际扣费为准**

本文件是插件侧的开发/安装/验证真值，包含本机实测证据与已知限制。
市场首图/README 不写内部坑，只在本文存档。

---

## 1. 交付物结构（仓库根目录即 npm 包）

```
xiapan-music/
├── package.json            # dsh-xiapan-music@0.1.0，dsh.bundle.patch → ./cordis.patch.yml
├── index.mjs               # 插件入口：skill provider + xiapan_music 工具
├── cordis.patch.yml        # bundle patch：insert id=dsh-xiapan-music
├── dsh-plugin.naming.json  # 命名声明（plugin-write 校验用）
├── src/core/               # T1 唯一核心客户端副本（发布包自包含）
├── skills/xiapan-music/    # T1 技能包：SKILL.md + scripts/{song,bgm,lyrics,balance}.mjs + lib/
├── test/plugin.test.mjs    # 插件单测（不联网、不花钱）
├── docs/plugin-dev.md      # 本文件
└── LICENSE / README.md
```

**职责边界**：插件不实现虾盘云协议，只做四件事——注册内置技能、把 `action+argv` 转成
`node skills/xiapan-music/scripts/<脚本>.mjs ... --json` 子进程、注入 Key/UTM 环境变量、
脱敏并解析一行 JSON。协议实现唯一真相源是 `src/core/xiapan-music.mjs`（由
`node scripts/sync-core.mjs` 同步到技能包 `scripts/lib/`，sha256 校验）。

## 2. 安装

前置：本机已装 DSH（桌面版 0.2.1-rc.3 实测）。`dsh` 可能不在 PATH：

```powershell
$dsh = 'C:\Users\ZhuanZ\.scratch-dsh017\inst\resources\runtime\cli\bin\dsh.cmd'
```

`dsh plugin add` 会把插件装进 profile 的 `node_modules` **并自动把包名追加进
`dsh.profile.bundles`**（实测：只 add、不手改 package.json，`--dump-config` 里就出现
`- id: dsh-xiapan-music`）。装完重启该 profile 生效。

### 2.1 本地开发安装（已实测，推荐给开发者）

```powershell
& $dsh plugin --profile <你的profile> add <本仓绝对路径>
# 例：
& $dsh plugin --profile xiapan-music-test add C:\Users\ZhuanZ\Desktop\claude\u-claw\opentu-uclaw\xiapan-music
```

输出会提示 peerDependencies 未满足的 WARN（`@deepseek-ai/dsh-{credentials,skill-filesystem,subprocess,tools}`）——
这是正常的：这些包由 DSH 宿主自己提供（installation scope），插件把它们声明成 optional peer 只为表达依赖。

### 2.2 发布后从 npm 安装（待 npm 发布后实测）

```powershell
& $dsh plugin --profile web add dsh-xiapan-music
```

### 2.3 从 GitHub 直装（仓库建好后可用，本次未测）

```powershell
& $dsh plugin --profile web add github:dongsheng123132/xiapan-music
```

> 注意：GitHub 直装会走 pnpm 的 prepare 构建许可，若被拦按 CLI 提示在 profile 的
> `pnpm-workspace.yaml` 里加 `allowBuilds` 再重试。

### 2.4 隔离验证用的最小 profile

```powershell
$env:DSH_HOME = '<repo>\.tmp\home-desktop'     # 独立 home，绝不碰 ~/.dsh
# profile 目录：$env:DSH_HOME\profiles\<name>\package.json
#   { "private": true, "dsh": { "profile": { "bundles": [
#       "@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "<你的 profile 级插件>" ] } } }
& $dsh plugin --profile <name> add <本仓绝对路径>
& $dsh --profile <name> --no-open --port 54321   # web；换独立端口，不要占 53893
& $dsh --profile <name>-headless "调用 xiapan_music 查余额"   # headless 一次性 agent
```

## 3. 凭据配置

Key 解析顺序：**`--key` > DSH 凭据 `XIAPAN_API_KEY` > 环境变量 `XIAPAN_API_KEY` > `~/.uking/device.json` 设备 Key**。
插件自身只读 DSH 凭据服务；拿不到时交给脚本兜底。**任何情况下都不把 Key 放进 argv/日志/文件。**

推荐：合并写入 `~/.dsh/.credentials.yaml`（**先备份、只加 refs 里的一行，别整文件覆盖**）：

```yaml
refs:
  XIAPAN_API_KEY: sk-你的虾盘云Key
```

一次性验证可用继承环境变量（不落盘）：

```powershell
$env:XIAPAN_API_KEY = 'sk-...'
& $dsh --profile <name>-headless "调用 xiapan_music 查余额"
```

装了 U-King 的电脑会自动用 `~/.uking/device.json` 的设备 Key，无需配置。

## 4. 一次典型使用（模型视角）

```text
用户：写一首深夜便利店的民谣
agent → xiapan_music { action: "song", argv: ["--theme","深夜便利店的民谣"] }
        ← 制作卡（ok:false + error.code=NEEDS_CONFIRMATION + card{title,tags,lyrics,costHint}）
        ← 不扣费、不提交（歌词成本≈¥0.01）
用户：可以，生成吧
agent → xiapan_music { action: "song", argv: ["--theme","深夜便利店的民谣","--confirm"] }
        ← { ok:true, taskId, title, songs:[{file,duration,title}], nextSteps, costHint }
```

- `instrumental` → `bgm.mjs`（MiniMax 纯音乐，约 ¥1/首，同样两段式 `--confirm`）
- `lyrics` → 只写词（免费/≈¥0.01）
- `balance` → 查余额（免费）
- `status` → 本地零费用自检；`["--resume-task","<taskId>"]` 续查历史任务（不重新提交）
- 产物默认 `~/Music/虾盘云音乐/`（可用 `--out-dir` 覆盖），返回绝对路径 + 时长，不回传音频二进制
- 插件强制注入 `XIAPAN_UTM_SOURCE=dsh`、`XIAPAN_UTM_MEDIUM=plugin` → nextSteps 里的画板/领 Key/充值链接带 `utm_source=dsh&utm_medium=plugin`

## 5. 本机实测验收记录（2026-10-28）

宿主：DSH 桌面版 **0.2.1-rc.3**（`runtime.json` 实测），隔离 home `<repo>\.tmp\home-desktop`，未触碰 `~/.dsh/profiles/web` 与 53893 实例。

| 验证项 | 命令/方式 | 结果 |
|---|---|---|
| 插件加载（真宿主） | `dsh --profile xiapan-music-headless --help` 起树 | 通过，无 activate 失败 |
| agent 真实调工具 | headless 单轮：`调用 xiapan_music action=status` | 通过，工具在清单中，返回插件/脚本/凭据状态 |
| 无 Key 加载 | 全新 home、不设 `XIAPAN_API_KEY` | 通过：插件正常加载、技能注册、工具可见；`status.xiapanApiKeyConfigured=false` 并提示去 `https://api.u-claw.org.cn` 领 Key |
| 缺 Key 可读报错 | harness + 假 home（无 device.json）跑 `balance` | 通过：抛 `BAD_KEY`，「找不到虾盘云 API Key…领 Key：https://api.u-claw.org.cn」 |
| 查余额（真实 API） | 插件路径 `xiapan_music balance` | 通过：`remainCny=69.57` |
| 制作卡（不扣费） | 插件路径 `song --theme …` | 通过：《凌晨两点的便利店》，tags=`Mandarin folk pop, 82 BPM…`，`mv=chirp-v5-5` |
| **真实生成 1 次** | 插件路径 `song --theme … --confirm` | 通过：**76.4s**，2 首完整歌 169.52s / 172.40s |
| 前后余额差 | 生成前 ¥69.57 → 生成后 ¥67.16 | **¥2.41**（与「约 ¥2.4/次」口径一致） |
| 单测 | `npm test` | 9 通过 / 0 失败（不联网、不花钱） |
| 命名校验 | `validate-names.mjs --manifest dsh-plugin.naming.json` | 通过（1 条 loaderIds 前缀建议 WARN，可接受） |
| 打包检查 | `npm pack --dry-run` | 见 §8，运行时文件齐全、无 Key |

生成产物（本地证据，`.tmp/` 已 gitignore）：

```
<repo>\.tmp\music\凌晨两点的便利店-20261028022651-1.mp3   3,879,966 B / 169.52s
<repo>\.tmp\music\凌晨两点的便利店-20261028022656-2.mp3   4,034,166 B / 172.40s
```

报告 JSON：`.tmp/e2e-song-confirm.json`（含 taskId、songs[]、nextSteps）。

## 6. 已知限制 / 本机环境坑（重要，写 runbook 时注意）

### 6.1 0.2.x 的 headless profile 会禁用 credentials 行

0.2.1-rc.3 的 shipped `headless` 模板在组合配置里把 `credentials` 行（`@deepseek-ai/dsh-credentials-local`）
标成 `disabled: true`。**因此插件不能把 `credentials` 放进 `inject`**——否则插件永远 `pending
(waiting for service: credentials)`，工具根本不会注册。

现实现：`inject = ['skills','subprocess','tools']`，运行时 `ctx.get('credentials')` 探测 +
`process.env.XIAPAN_API_KEY` 兜底 + 脚本设备 Key 兜底。web/desktop profile 有凭据服务，行为不变。

### 6.2 本会话沙箱导致「DSH 宿主内真生成」与「截图」不可用

当前这个 DSH 会话本身运行在沙箱里（workspace-write ACL）。实测：

- **Node 的 pipe-spawn 一律 `spawn EPERM`**（DSH 的 `ctx.subprocess` 用 pipe 收集输出）→
  沙箱内起 DSH 后 agent 调工具会 `spawn EPERM`；DSH 内 `pwsh`/`grep` 也因
  `sandbox-local windows-acl temp grant materialization failed` 失败。
- **Edge/Chromium 起不来**：`FATAL mojo platform_channel: 拒绝访问`（named pipe 被沙箱拦）→ 无法截图。

替代证据（本次采用）：`.tmp/harness/e2e.mjs` —— 用**真实的插件代码**（apply 注册、argv 组装、
脱敏、JSON 解析、制作卡处理）+ **真实 T1 脚本** + **真实 API**，只把 `ctx.subprocess` 换成
「stdio 用文件句柄重定向」的替身，绕开 pipe 限制。§5 的 balance / 制作卡 / 真实生成都走这条路径。
DSH 宿主内的插件加载与工具注册则用 0.2.1-rc.3 headless 真机验证。

> 换到**非沙箱环境**（用户正常双击 DSH / 普通终端）时，`ctx.subprocess` 是正常实现，
> 宿主内真生成与截图都没有这个问题。

### 6.3 v1 不做 Web 面板

竞品（yinchao 等）同为 host-only；DSH 广场 Verified 也只看「无 Key 也能装、能加载、工具可用」。
Web 面板进 roadmap（见 §9），v1 不交付、不占发布风险。

### 6.4 其它

- 插件**未内置任何协议逻辑**：T1 脚本不存在时，工具会返回「插件包缺少 skills/…/scripts/，请重装」的可读错误。
- 付费提交**不自动重试**；同一张制作卡重复 `--confirm` 会被脚本拦为 `NEEDS_CONFIRMATION`（防重复扣费）。
- `status` 的续查用 `song.mjs --resume-task`，只轮询+下载，绝不重新提交。
- `npm test` 需要宿主包 `@deepseek-ai/dsh-tools` 等可解析（本机 dev 用仓内 `node_modules` 转发 shim，
  该目录已 gitignore、不进包；**不是依赖安装**——peerDeps 仍全部 optional，由 host 提供）。
  解析不到时测试自动跳过并打印原因，`node --test` 仍绿。
- **沙箱/受限环境跑测试要加 `--test-isolation=none`**：`node --test` 默认给每个测试文件开子进程
  （pipe spawn 在沙箱里 EPERM）。`npm test` 已内置该参数；普通终端直接 `node --test` 也可以。
- 测试本身**不 spawn 子进程、不出网、不花钱**：`ctx.subprocess.spawn`/`ctx.credentials` 都是替身，
  只断言 argv/env/脱敏/JSON 解析/制作卡透传。

## 7. 开发/自检命令

```powershell
node --check index.mjs                                  # 语法
npm test                                                # 插件单测（9 项，离线）
node scripts/sync-core.mjs --check                      # core → 技能包副本 sha256 一致
node <plugin-write skill>/scripts/validate-names.mjs --manifest .\dsh-plugin.naming.json
npm pack --dry-run                                      # 产物清单（发布前必跑）
node .tmp/harness/e2e.mjs status|balance|lyrics|song-card|song-confirm   # dev 联调 harness（付费场景慎跑）
```

## 8. npm 产物（`npm pack --dry-run` 实测）

`files` 白名单：`index.mjs`、`cordis.patch.yml`、`src/core`、`skills/xiapan-music`、`README.md`、`LICENSE`。
`dsh-plugin.naming.json`、`test/`、`.tmp/`、`node_modules/` 不进包；包内无任何 Key/凭据。

## 9. Roadmap（v1.1+，Web 客户端面板）

v1 不交付，方案留档（已验证 DSH Web 客户端插件写法，见 `dsh-workspace-terminal` 范式）：

1. `dsh.client` 声明 + esbuild 把 `client.jsx` 打成 `client.js`（`window.__ModuleLoader__.load` banner）；
2. `ctx.slots.register` 挂到 `sidebar.footer.action` / `shell.overlay`，面板内：粘贴 Key（本地保存、脱敏显示、
   「测试连接」）→ 一句话描述/可选歌词/标题/风格 → 进度 → 内联 `<audio>` 试听 → 下载 mp3 →
   底部 CTA「去虾盘云画板做 MV」(`https://tu.u-claw.org.cn/?utm_source=dsh&utm_medium=plugin&utm_campaign=xiapan-music`)
   与「充值 / 领 Key」(`https://api.u-claw.org.cn`)；
3. 视觉：浅色卡片、单蓝强调、圆角 8/12px，禁渐变发光/英文装饰，全中文文案；
4. 服务端补 `webServer.register` 路由（Key 校验 / 生成 / 进度轮询），Key 只存 `$DSH_HOME` 本地。

## 10. 发布相关（Lead 执行，本文件只记录事实）

- npm 包名 `dsh-xiapan-music`，MIT，keywords 含 `dsh`/`dsh-plugin`/`music`/`suno`/`ai-music`。
- DSH 广场 Discover 依赖 awesome-dsh-plugin catalog（Lead 提 PR），要求：根 `package.json` 声明
  `dsh.bundle`、topics 含 `dsh-plugin`、描述真实。
- **本文件不代表授权发布**；发布动作见 `docs/publishing.md`（T3）与 Lead 的发布回执。
