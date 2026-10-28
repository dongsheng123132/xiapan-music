# 上架 Runbook（Lead 执行 · T3 只准备不执行）

> 2026-10-28 · T3（market-publish）
> 本文件里所有命令都可**原样复制**。T3 只跑了只读检查（§2），**未执行任何 login / publish / push / 付费操作**。
> 配套：调研依据 `docs/market-research.md`；文案成品 `artifacts/publish/listings.md`；原始证据 `artifacts/publish/research/`。

---

## 0. 一页速查

### 0.1 固定常量（所有平台必须一致）

| 键 | 值 |
|---|---|
| slug / name | `xiapan-music` |
| displayName | `虾盘云音乐 · 一句话出歌` |
| version | `0.1.0` |
| license | `MIT` |
| npm 包名 | `dsh-xiapan-music` |
| GitHub 仓 | `dongsheng123132/xiapan-music`（公开） |
| Skill 目录 | `skills/xiapan-music/` |
| 插件根 | 仓库根（`package.json` / `index.mjs` / `cordis.patch.yml`） |
| 官网/领 Key | https://api.u-claw.org.cn （**实测主用**；`api.u-claw.org` 本机 8/8 ECONNRESET，见 §2 发现 6） |
| 充值 | https://api.u-claw.org.cn/recharge?key=`<KEY>` |
| 画板（导流） | https://tu.u-claw.org.cn/?utm_source=`<market>`&utm_medium=`<skill\|plugin>`&utm_campaign=xiapan-music |

### 0.2 八条链路总表

| # | 链路 | 动作 | 谁做 | 要登录 | 要实名 | 预计生效 | 验证 |
|---|---|---|---|---|---|---|---|
| ① | GitHub 公开仓 + topics | `gh repo create` + `gh repo edit --add-topic` | Lead | 已登录 | 否 | 立即 | `gh repo view --json visibility,repositoryTopics` |
| ② | npm `dsh-xiapan-music` | `npm publish --otp` | Lead（需用户给 OTP） | 需重登 | 否 | 立即 | `registry.npmjs.org/dsh-xiapan-music` |
| ③ | dshmp.com（DSH 目录） | 无（读 npm） | 自动 | — | — | **≤1 天** | `curl dshmp.com/api/plugins?q=xiapan` |
| ④ | dshbase.com（DSH 目录） | 无（读 npm） | 自动 | — | — | **1–2 天**（要过 L1–L4 安装测试） | `dshbase.com/plugins/<name>/` |
| ⑤ | awesome-dsh-plugin / dsh-market | **PR 一个 YAML**（不是自动） | Lead | 已登录 | 否 | 仓库满 1 天后提交，合并后次日 | `awesome-dsh-plugin.com/p/dongsheng123132/xiapan-music/` |
| ⑥ | SkillHub 技能（CLI） | `skillhub publish` | Lead | 已登录 | **可能要**（403 时） | 立即（含安全扫描） | `skillhub.cn/skills/@user_abeb50e0/xiapan-music` |
| ⑦ | ClawHub 技能 | `clawhub publish` | Lead | 已登录 | 否 | 立即 | `clawhub.ai/dongsheng123132/skills/xiapan-music` |
| ⑧ | skills.sh | 无（CLI 安装即索引） | 自动（靠人装） | 否 | 否 | 首次 `npx skills add` 后 | `skills.sh/dongsheng123132/xiapan-music` |

> **推荐顺序**：① GitHub → ② npm → ⑦ ClawHub → ⑥ SkillHub 技能 → ⑤ awesome PR（**要等仓满 1 天**）→ ③④⑧ 自然发生。
> 理由：GitHub 是 SkillHub 插件广场爬取源；npm 是 dshmp/dshbase 源；awesome PR 有 1 天仓龄门槛，先把仓建好再等一天。

### 0.3 发布前硬闸门（任一不满足就别发）

```bash
cd C:/Users/ZhuanZ/Desktop/claude/u-claw/opentu-uclaw/xiapan-music

# G1 SKILL.md 存在且 frontmatter 含 slug/version/displayName（SkillHub 硬要求）
head -30 skills/xiapan-music/SKILL.md

# G2 插件元数据齐全
node -e "const p=require('./package.json');console.log(p.name,p.version,p.license,p.dsh,p.keywords.includes('dsh-plugin'))"

# G3 无密钥、可复现
node scripts/verify.mjs && node --test

# G4 npm 打包内容不含密钥/大文件
npm pack --dry-run 2>&1 | tail -40
```

---

## 1. 前置：本机账号/凭据实测状态（2026-10-28）

| 平台 | 状态 | 结论 |
|---|---|---|
| ClawHub | `clawhub whoami` → `√ dongsheng123132` | **已登录，可直接 publish** |
| SkillHub | `skillhub auth whoami` → handle `user_abeb50e0` / role `user` | **已登录**；非企业认证（发布若 403 见 §6.5） |
| npm | `npm whoami --registry=https://registry.npmjs.org` → **E401** | **阻塞：token 失效，必须用户重新登录** |
| GitHub | `gh auth status` → `dongsheng123132`，scopes `gist, read:org, repo, workflow` | **已登录，可建公开仓** |
| openclaw | `openclaw --version` → `OpenClaw 2026.9.3 (1391f7c)` | 可用于本地安装冒烟 |
| GitHub 仓 | `gh repo view dongsheng123132/xiapan-music` → **不存在** | **待建** |
| npm 包名 | `npm view dsh-xiapan-music` → **E404** | **名字可用** |

> 敏感信息红线：任何命令输出、日志、文档里都**不得出现完整 Key/Token**。本文件所有记录已打码（`sk-****` / `skh_****` / `gho_****`）。

---

## 2. 本机 dry-run 实测记录（只读，由 T3 执行）

执行环境：Windows / PowerShell 7 / Node v24.19.0 / npm 11.17.0 / git 2.49.0.windows.1

| # | 命令 | 实测输出（已打码） | 退出码 | 判定 |
|---|---|---|---|---|
| 1 | `clawhub --cli-version` | `0.9.0` | 0 | ✅ |
| 2 | `clawhub whoami` | `- Checking token` / `√ dongsheng123132` | 0 | ✅ 已登录 |
| 3 | `skillhub --version` | `skillhub 2026.8.5` | 0 | ✅ |
| 4 | `skillhub auth whoami` | `userId : 619537` / `handle : user_abeb50e0` / `role : user` | 0 | ✅ 已登录（个人） |
| 5 | `npm ping --registry=https://registry.npmjs.org` | （无输出，npm 11 静默成功） | 0 | ✅ registry 可达 |
| 6 | `npm whoami --registry=https://registry.npmjs.org` | `npm error code E401` / `401 Unauthorized - GET https://registry.npmjs.org/-/whoami` | **1** | ❌ **token 失效** |
| 7 | `gh auth status` | `✓ Logged in to github.com account dongsheng123132 (keyring)`；`Token scopes: 'gist', 'read:org', 'repo', 'workflow'` | 0 | ✅ |
| 8 | `openclaw --version` | `OpenClaw 2026.9.3 (1391f7c)` | 0 | ✅ |
| 9 | `npm config get registry` | `https://registry.npmmirror.com` | 0 | ⚠️ **默认是淘宝镜像，发布必须显式 `--registry=https://registry.npmjs.org`** |
| 10 | `~/.npmrc` 检查（不打印值） | 存在；L1 `registry=https://registry.npmmirror.com`；L6 `//registry.npmjs.org/:_authToken=<MASKED>` | — | ⚠️ token 键存在但 401 → **已失效/被撤销** |
| 11 | `gh repo view dongsheng123132/xiapan-music` | `Could not resolve to a Repository with the name 'dongsheng123132/xiapan-music'` | 1 | ⚠️ 仓未建 |
| 12 | `npm view dsh-xiapan-music --registry=...` | `E404 Not Found` | 1 | ✅ 包名可用 |

**额外发现（会咬人，记下来）**
1. **npm 默认 registry 是 npmmirror** → 所有 npm 命令（whoami/publish/view）都要带 `--registry=https://registry.npmjs.org`，否则查到的是镜像、发布不出去。
2. **沙箱内 npm 写缓存会 EPERM**：`npm error EPERM ... C:\Users\ZhuanZ\AppData\Local\npm-cache\_cacache\tmp\***`。发布时请用正常终端（非受限沙箱），或临时 `--cache "$env:TEMP\npm-cache"`。
3. **ClawHub 网页侧被 Cloudflare 拦**（`https://clawhub.ai/skills/publish` 本机 fetch 失败），但 **CLI 完全可用** → 发布以 CLI 为准，网页路径列备用（§7.2）。
4. `clawhub inspect <slug>` 遇到重名会报 `AMBIGUOUS_SKILL_SLUG` 并列出候选 → 所有引用一律写全 `@dongsheng123132/xiapan-music`。
5. SkillHub `publish --dry-run` **只做本地校验**（解析 frontmatter + 校验 slug/version/displayName），不联网；真正的平台校验在正式 publish 时才发生。
6. **`api.u-claw.org` 当前不可达（重要，影响所有 CTA）**：本机 4/4 + 4/4 两次实测全部 `ECONNRESET`（带代理也失败）；`https://api.u-claw.org.cn/` 4/4 返回 200，`/recharge` 200。→ **CTA 里的「领 Key / 充值」一律改用 `.cn` 域名**；稳定后可再改回 `.org`（PLAN §1 也记录「`api.u-claw.org` 境外不稳」）。README 里现有的 `.org` 链接建议 Lead 一并改 `.cn`。

---

## 3. 链路① GitHub 公开仓 + topics（最先做）

### 3.1 前置
- `gh` 已登录（scopes 含 `repo`）、当前目录已是 git 仓（`xiapan-music/.git` 存在）。
- **必须先确认没有密钥**：`git status` + 全文搜 `sk-` 前缀（只允许出现在文档示例里且是假值）。

### 3.2 命令（Lead 执行）

```bash
cd C:/Users/ZhuanZ/Desktop/claude/u-claw/opentu-uclaw/xiapan-music

# 1) 提交（若还有未提交改动）
git add -A
git commit -m "feat: xiapan-music 0.1.0 — 一句话出歌（AI 写词 + Suno v6）+ DSH 插件 + Agent Skill" || true

# 2) 建公开仓并推送（仓不存在，实测已确认）
gh repo create dongsheng123132/xiapan-music \
  --public \
  --source=. \
  --remote=origin \
  --description "虾盘云音乐：一句话出歌（AI 写词 + Suno v6），Agent Skill + DeepSeek Harness 插件，BYOK 虾盘云 Key。" \
  --push

# 3) 打 topics（SkillHub 插件广场 / awesome 收录的硬条件之一）
gh repo edit dongsheng123132/xiapan-music \
  --add-topic dsh-plugin \
  --add-topic deepseek-harness \
  --add-topic agent-skills \
  --add-topic ai-music \
  --add-topic text-to-music \
  --add-topic suno \
  --add-topic chinese
```

### 3.3 验证

```bash
gh repo view dongsheng123132/xiapan-music --json name,visibility,url,repositoryTopics,createdAt
# 期望：visibility=PUBLIC；repositoryTopics 含 dsh-plugin
curl -s -o /dev/null -w "%{http_code}\n" https://github.com/dongsheng123132/xiapan-music
```

### 3.4 注意
- **仓龄门槛**：awesome-dsh-plugin 要求仓库创建满 **1 天** 才收 PR（CI 自动查）。→ 今天建仓，**明天**再提 §5 的 PR。
- 建仓时**不要**用 `--private`；公开仓是所有自动爬取链路的前提。
- 如果 `gh repo create` 因网络失败（GitHub 需代理）：本机 `HTTPS_PROXY=http://127.0.0.1:7897` 已设置，重试即可；仍失败就网页建仓后 `git remote add origin ... && git push -u origin main`。

### 3.5 回滚
- 误建私有仓：`gh repo edit dongsheng123132/xiapan-music --visibility public --accept-visibility-change-consequences`
- 仓要改名：`gh repo rename <new>`（会保留旧 URL 跳转）
- 整仓下架（不推荐）：`gh repo edit --visibility private`

---

## 4. 链路② npm 发布 `dsh-xiapan-music`（需用户给 OTP）

### 4.1 前置（当前阻塞点）
1. **npm 登录失效**（§2 #6 E401）。两条路：
   - A（推荐）：`npm login --registry=https://registry.npmjs.org`（浏览器跳转，用户点登录）；
   - B：去 https://www.npmjs.com/settings/hfshfg/tokens 新建 **Automation/Granular token（含 publish 权限）**，写入 `~/.npmrc`。
2. **2FA OTP**：用户需提供 6 位动态码，或用**恢复码（backup code）**当 OTP 使用（本机剩余 4 个，用一次少一个）。
3. 发布不是 `npmmirror`！每条命令都带 `--registry=https://registry.npmjs.org`。

### 4.2 命令（Lead 执行）

```bash
cd C:/Users/ZhuanZ/Desktop/claude/u-claw/opentu-uclaw/xiapan-music

# 0) 身份确认（必须显示 hfshfg）
npm whoami --registry=https://registry.npmjs.org

# 1) 本地闸门
node --check index.mjs
node --test
npm pack --dry-run 2>&1 | grep -Ei "total files|package size|unpacked size|filename"

# 2) 发布（OTP = 6 位动态码 或 恢复码）
npm publish --registry=https://registry.npmjs.org --otp <6位OTP或恢复码>
```

**预期输出**：`+ dsh-xiapan-music@0.1.0`

### 4.3 发布后验证

```bash
npm view dsh-xiapan-music version --registry=https://registry.npmjs.org          # 0.1.0
npm view dsh-xiapan-music keywords --registry=https://registry.npmjs.org          # 含 dsh-plugin
npm view dsh-xiapan-music dist.tarball --registry=https://registry.npmjs.org      # tgz URL
curl -s https://registry.npmjs.org/dsh-xiapan-music | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('latest=',j['dist-tags'].latest,'| dsh=',JSON.stringify(j.versions[j['dist-tags'].latest].dsh))})"
# 页面：https://www.npmjs.com/package/dsh-xiapan-music
```

### 4.4 审核注意
- npm 无人工审核，但**包内容会被扫描**：不得含真实 Key、不得含密钥文件；`files` 白名单已限定（`index.mjs / cordis.patch.yml / src/core / skills/xiapan-music / README.md / LICENSE`）。
- 包名必须与 `package.json` 的 `name` 完全一致（`dsh-xiapan-music`），否则 E403。
- `dsh` 字段必须保留 `bundle.patch`（dshmp/dshbase/awesome 全靠它）。

### 4.5 回滚
| 场景 | 做法 |
|---|---|
| 发错版本（还没人装） | `npm unpublish dsh-xiapan-music@0.1.0 --force --registry=https://registry.npmjs.org --otp <OTP>`（**24h 内**且不推荐，会留记录） |
| 已有人装 / 只想止损 | `npm deprecate dsh-xiapan-music@0.1.0 "0.1.0 请勿使用，请升级 0.1.1" --registry=... --otp <OTP>`（推荐） |
| 修问题 | 改代码 → `npm version patch` → 发 0.1.1（**主流做法**） |

---

## 5. 链路⑤ awesome-dsh-plugin PR（通往 dsh-market / dsh Discover）

> 这是**唯一要人工 PR 的目录**；npm 发布不会自动进 awesome，而 dsh-market 与 dsh 0.2.1+ 的 Discover 索引都读它的 `dsh-plugin-catalog`。

### 5.1 前置
- 仓库已公开且**创建满 1 天**（CI 自动检查，早提必被拒）。
- 根 `package.json` 声明 `dsh.bundle`（我们已有：`{"bundle":{"patch":"./cordis.patch.yml"}}`）。
- 根有 `cordis.patch.yml`（已有）。
- 仓库 topics 含 `dsh-plugin`（§3 已加）。
- 准备一张 **180×180** 的 icon（GitHub 托管的位图，见 `listings.md` §4），存到仓库 `assets/icon-180.png`。

### 5.2 要提交的文件内容

`data/plugins/dongsheng123132__xiapan-music.yml`：

```yaml
url: https://github.com/dongsheng123132/xiapan-music
name: dongsheng123132/xiapan-music
category: skill
description:
  en: 'Xiapan Music turns one sentence into a full song: AI writes Chinese or English lyrics, Suno v6 renders two tracks, and the mp3 can be downloaded. It also generates instrumental BGM, checks the Xiapan API balance, and runs on a bring-your-own Xiapan key with zero config on Xiapan USB devices.'
  zh: '虾盘云音乐：一句话生成完整歌曲（AI 写词 + Suno v6 出 2 首，可下载 mp3），也能生成纯音乐 BGM、查询虾盘云余额；BYOK，装了虾盘 U 盘免配置。'
icon: https://raw.githubusercontent.com/dongsheng123132/xiapan-music/main/assets/icon-180.png
```

> 规则提醒：`description.en` 必填；**描述含 `: ` 必须加引号**（已加）；**不许营销词**（最强/第一/秒杀），不许夸大能力（「必须是代码里真实存在的」）。

### 5.3 提交命令（Lead 执行，属 push 范畴，需用户/Lead 授权）

```bash
# 方案 A：有 fork 权限时
gh repo fork awesome-dsh-plugin/awesome-dsh-plugin --clone=false
gh repo clone <你的fork>/awesome-dsh-plugin /tmp/awesome-dsh
# 写文件 data/plugins/dongsheng123132__xiapan-music.yml 后：
cd /tmp/awesome-dsh && git checkout -b add-dongsheng123132-xiapan-music
git add data/plugins/dongsheng123132__xiapan-music.yml && git commit -m "Add dongsheng123132/xiapan-music"
git push -u origin add-dongsheng123132-xiapan-music
gh pr create --repo awesome-dsh-plugin/awesome-dsh-plugin \
  --title "Add dongsheng123132/xiapan-music" \
  --body "Adds Xiapan Music: one-sentence song generation (AI lyrics + Suno v6), BYOK Xiapan key, DSH plugin + bundled agent skill."
```

### 5.4 验证
- PR 被 CI 检查（仓龄/`dsh.bundle`/`dsh-plugin` topic/描述真实性）。
- 合并后：`https://awesome-dsh-plugin.com/p/dongsheng123132/xiapan-music/` → 200
- 次日看 catalog：`curl -s https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json | grep -c xiapan`
- dsh-market 内搜索 `xiapan` → 能装。

### 5.5 回滚
- 撤销 PR：`gh pr close <n> --repo awesome-dsh-plugin/awesome-dsh-plugin`
- 合并后要下架：删 YAML 再提一个 PR（`category` 改为 `fun` 并不能下架，必须删文件）；仓库 deprecate 时目录会标记 archived（但 awesome 是人工数据，需 PR 删）。

---

## 6. 链路⑥ SkillHub 技能（CLI + 实名/Token 前置）

### 6.1 前置（区分「首次」与「更新」）

| | 首次发布 | 更新版本 |
|---|---|---|
| 登录 | `skillhub auth whoami` 必须命中（当前 ✅ handle `user_abeb50e0`） | 同左 |
| Token | 已存在本地（`~/.skillhub/credentials.json`）；失效时重新 `skillhub login --key skh_****` | 同左 |
| 实名 | **待验证**：角色显示 `user` 非企业。若 publish 返回 403，去 https://skillhub.cn 控制台完成手机号+实名认证 | 无需重做 |
| SKILL.md | 必须有 `slug` / `version` / `displayName` 三项 frontmatter（**当前仓库还没有 SKILL.md，等 T1 交付**） | 改 `version` 再发 |
| 变更日志 | 必填（中文一句话） | 必填 |

> SkillHub publish 的真实校验（读 CLI 源码确认）：目录里必须有 `SKILL.md`（大小写不敏感），首行 `---` 起 frontmatter，`slug` 必须 kebab-case 3–128 位、`version` 必须合法 SemVer、`displayName` 非空。**这三项缺一个就本地 die**。

### 6.2 首次发布命令（Lead 执行）

```bash
cd C:/Users/ZhuanZ/Desktop/claude/u-claw/opentu-uclaw/xiapan-music

# 1) 本地预检（不联网、不上传）
skillhub publish skills/xiapan-music --dry-run
# 期望：✓ Dry-run passed: xiapan-music@0.1.0

# 2) 正式发布
skillhub publish skills/xiapan-music \
  --changelog "首个公开版本：一句话出歌（AI 写词 + Suno v6，一次 2 首）、纯音乐 BGM、余额查询、BYOK 虾盘云 Key。"
```

**预期输出**：`✓ Published: skillId=<id> status=<status>` + `url: <publicUrl>`
**把回执填进 §11 模板**（skillId / status / publicUrl / 时间）。

### 6.3 更新版本命令

```bash
# 1) 先升 SKILL.md 里的 version（如 0.1.1），并同步 package.json
# 2) 再发布（--version 可覆盖 SKILL.md 版本）
skillhub publish skills/xiapan-music --version 0.1.1 \
  --changelog "修复：歌词 JSON 解析容错；新增：BGM 模型可选。"
```

### 6.4 发布后验证

```bash
skillhub auth whoami                                   # 仍是 user_abeb50e0
skillhub search xiapan                                 # 能搜到自己的 skill
skillhub install xiapan-music --dir /tmp/skillhub-test  # 装到临时目录（不要装进真实 skills 目录）
skillhub verify xiapan-music --json                    # 平台签名校验（应 pass）
curl -s "https://api.skillhub.cn/api/v1/skills/xiapan-music?namespace=@user_abeb50e0"
# 页面：https://skillhub.cn/skills/@user_abeb50e0/xiapan-music
```

### 6.5 审核注意 / 常见失败
- **自动安全扫描**：平台会生成 `keen`（腾讯 tix）与 `sanbu` 报告并公示（竞品实测两条都 `benign`）。→ 我们的脚本**不要**做可疑外联、不要读全盘、不要混淆代码，扫描更容易过。
- **`requires_api_key` 标签**：我们是 BYOK，预期会被标 `true`，正常。
- 401 → `skillhub login --key skh_****`（Token 在网页控制台创建）
- 403 → 权限/实名问题（待验证是否要实名；先去控制台看提示）
- 409 → slug 冲突（`xiapan-music` 目前未被占，见调研；冲突就换 `xiapan-music-skill` 并同步所有平台）
- 429 → 限流，等返回体里的 `rule` 提示时长

### 6.6 回滚
- **推荐**：发一个更高版本修复（平台按版本管理，旧版本自然被顶掉）。
- 紧急下架：技能页控制台「下架/隐藏」→ **待验证**（CLI 无 unpublish 子命令；若控制台无入口，联系 SkillHub 客服）。
- 版本回退：CLI 没有 delete 子命令，回退等于「重新发旧版本号」——会被拒（版本已存在），所以**只能发新版本**。

---

## 7. 链路⑦ ClawHub 技能（CLI 主线 + 网页备用）

### 7.1 CLI 路径（推荐，已登录可直接发）

```bash
cd C:/Users/ZhuanZ/Desktop/claude/u-claw/opentu-uclaw/xiapan-music

# 0) 只读预检（可选）：扫本地会传什么，不写
clawhub sync --root skills --dry-run

# 1) 正式发布
clawhub publish skills/xiapan-music \
  --slug xiapan-music \
  --name "虾盘云音乐 · 一句话出歌" \
  --version 0.1.0 \
  --changelog "首个公开版本：一句话出歌（AI 写词 + Suno v6 出 2 首）、纯音乐 BGM、余额查询、BYOK 虾盘云 Key；出歌后可去虾盘云画板做 MV。" \
  --tags latest
```

> `--tags` 是**版本标签**（默认 `latest`），不是类目 topic；类目/topic 由平台归类（见调研 §2.3）。

### 7.2 网页路径（备用；本机 CLI 抓页面被 CF 拦，标注**待验证**）

1. 浏览器打开 https://clawhub.ai 并登录（GitHub OAuth，账号 `dongsheng123132`）。
2. 进 **Publish Skill**（页脚 Publish 区，`/skills/publish`）→ 允许上传 skill 目录/zip 或粘贴 SKILL.md。
3. 字段与 CLI 等价：slug=`xiapan-music`、name=`虾盘云音乐 · 一句话出歌`、version=`0.1.0`、changelog 同 §7.1。
4. 发布后到详情页补：分类（`creative`）、描述摘要、如有 icon/截图位则上传（**待验证**有无）。

### 7.3 发布后验证

```bash
clawhub inspect @dongsheng123132/xiapan-music --json
# 关注：stats.downloads / stats.installs / latestVersion.version / topics / owner.handle
clawhub search "xiapan"
curl -s -o /dev/null -w "%{http_code}\n" https://clawhub.ai/dongsheng123132/skills/xiapan-music
clawhub install xiapan-music --dir /tmp/clawhub-test   # 装到临时目录冒烟（别污染真实 skills）
```

页面 URL 模板：`https://clawhub.ai/<owner>/skills/<slug>` → `https://clawhub.ai/dongsheng123132/skills/xiapan-music`

### 7.4 更新
```bash
clawhub publish skills/xiapan-music --slug xiapan-music --name "虾盘云音乐 · 一句话出歌" \
  --version 0.1.1 --changelog "..." --tags latest
```

### 7.5 回滚
| 场景 | 命令 |
|---|---|
| 先隐藏（可恢复） | `clawhub hide @dongsheng123132/xiapan-music` |
| 恢复 | `clawhub unhide @dongsheng123132/xiapan-music` |
| 软删除（可恢复） | `clawhub delete @dongsheng123132/xiapan-music` |
| 撤销删除 | `clawhub undelete @dongsheng123132/xiapan-music` |
| 改名/合并 | `clawhub skill rename <slug> <new-slug>` / `clawhub skill merge <src> <dst>`（旧 slug 保留跳转） |

> 删/隐藏只影响 ClawHub 展示，不影响 GitHub 与 npm。

---

## 8. 链路③④⑧ 自动收录（无需动作，只要验证）

### 8.1 dshmp.com（读 npm，≤1 天）

```bash
curl -s "https://dshmp.com/api/plugins?q=xiapan"            # 期望 total>=1，取 slug
# 页面：https://dshmp.com/en/plugins/dsh-xiapan-music   （slug 以 API 返 回为准）
```
- 不出现的排查：`package.json` 是否声明 `dsh.bundle`、`keywords` 是否含 `dsh-plugin`、npm 是否真的发上去了；用官方自检页 `https://dshmp.com/en/guides/publish/check`（跑索引器同一条规则）。

### 8.2 dshbase.com（读 npm + 真实安装测试，1–2 天）

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://dshbase.com/plugins/dsh-xiapan-music/   # 待验证 slug
# 目录搜索：https://dshbase.com/plugins/directory/
```
- Verified 要求 L1 安装→L2 加载→L3 无头问答→L4 Web CDP 全过。**风险**：插件无 Key 时若加载报错会卡 L2/L3 → 必须保证「无 Key 也能正常加载并提示」。
- 拿不到 Verified 不代表不能列（有 `listed` 未测档），宣传时**不要**自称 Verified，直到看到页面标记。

### 8.3 skills.sh（靠 `npx skills add` 装机量，无投稿）

```bash
# 自测（第一装即建立索引信号）
npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y
npx skills list | grep -i xiapan
# 页面（待验证）：https://skills.sh/dongsheng123132/xiapan-music
# 徽章：https://skills.sh/b/dongsheng123132/xiapan-music
```
- 索引来自 CLI 匿名遥测（默认开启，`DISABLE_TELEMETRY=1` 关闭）→ **每多一个真实安装就多一次排名信号**，所以 README 里这条命令要放最显眼处。
- 暂无「提交」入口；不要去找表单（没有）。

### 8.4 dsh-market / dsh 0.2.1+ Discover（依赖 §5 的 PR）
合并后次日验证：
```bash
curl -s https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const hit=(j.plugins||[]).filter(p=>JSON.stringify(p).includes('xiapan'));console.log('hits=',hit.length,hit[0]||'')})"
```

---

## 9. 发布后总验收（Lead 最终跑）

| # | 检查 | 命令/URL | 通过标准 |
|---|---|---|---|
| 1 | GitHub 公开 | `gh repo view ... --json visibility` | PUBLIC |
| 2 | npm 包 | `npm view dsh-xiapan-music version --registry=https://registry.npmjs.org` | 0.1.0 |
| 3 | dshmp | `curl -s "https://dshmp.com/api/plugins?q=xiapan"` | total≥1 |
| 4 | dshbase | 目录页搜 xiapan | 出现条目 |
| 5 | awesome | `https://awesome-dsh-plugin.com/p/dongsheng123132/xiapan-music/` | 200 |
| 6 | SkillHub 技能 | `https://skillhub.cn/skills/@user_abeb50e0/xiapan-music` | 200 且信息完整 |
| 7 | ClawHub | `https://clawhub.ai/dongsheng123132/skills/xiapan-music` | 200 且 install 命令可见 |
| 8 | skills.sh | `https://skills.sh/dongsheng123132/xiapan-music` | 200（可能延迟） |
| 9 | 安装命令实测 | `npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y` | 装完 SKILL.md 可读 |
| 10 | CTA 全 200 | 画板/领 Key/充值 三条（带 UTM） | HTTP 200，UTM 参数在 |
| 11 | 无密钥 | `git grep -nE "sk-[A-Za-z0-9]{16,}"` | 0 命中（示例除外） |

---

## 10. 常见错误速查

| 报错 | 平台 | 原因 | 处理 |
|---|---|---|---|
| `E401 Unauthorized`（whoami/publish） | npm | token 失效 | `npm login --registry=https://registry.npmjs.org` 或新建 token |
| `E403 Forbidden` / `403 权限不足` | npm / SkillHub | 包名被占 / 角色不够 | 换名 / 实名认证 |
| `E409 slug 冲突` | SkillHub | slug 已被占 | 换 `xiapan-music-skill` 并全平台同步 |
| `429` + `rule` | SkillHub | 限流 | 按提示等待 |
| `EPERM ... npm-cache` | npm | 沙箱禁写 | 正常终端执行，或 `--cache "$env:TEMP\npm-cache"` |
| `AMBIGUOUS_SKILL_SLUG` | ClawHub | 有同名 slug | 用 `@dongsheng123132/xiapan-music` 全名 |
| `Skill not found (reset in Ns)` | ClawHub | 上一条错误后的冷却 | 等 N 秒重试，别连点 |
| `SKILL.md 缺少 slug/version/displayName` | SkillHub | frontmatter 不全 | 补 frontmatter 再 `--dry-run` |
| 目录站一直不出现 | dshmp/dshbase | 缺 `dsh.bundle` / `dsh-plugin` keyword / npm 未发 | 用 dshmp 自检页逐项对比 |
| awesome PR 被 CI 拒 | awesome | 仓库不足 1 天 / 只声明 dsh.client / 描述与代码不符 | 等满 1 天、补 `dsh.bundle`、改描述 |

---

## 11. 发布回执模板（Lead 每发一条填一行）

```markdown
| 平台 | 时间(UTC+8) | 版本 | 回执（URL / ID / 输出摘要） | 验证结果 |
|---|---|---|---|---|
| GitHub | 2026-10-__ __:__ | — | https://github.com/dongsheng123132/xiapan-music | PUBLIC ✅ |
| npm | | 0.1.0 | + dsh-xiapan-music@0.1.0 | view 0.1.0 ✅ |
| ClawHub | | 0.1.0 | https://clawhub.ai/dongsheng123132/skills/xiapan-music | inspect ✅ |
| SkillHub 技能 | | 0.1.0 | skillId=____ status=____ publicUrl=____ | 页面 200 ✅ |
| awesome PR | | — | PR #____ | 合并 ✅ |
| dshmp | | — | https://dshmp.com/en/plugins/____ | 自动 ✅ |
| dshbase | | — | https://dshbase.com/plugins/____/ | 自动 ✅ |
| skills.sh | | — | https://skills.sh/dongsheng123132/xiapan-music | ✅ |
```

---

## 12. 需要用户做什么（Lead 转交用户 · 逐条耗时/兜底）

> 原则：用户只做「浏览器登录 + 给一次 OTP + 点头」，其余全部由 Lead 执行。

| # | 事项 | 出现在哪一步 | 大概耗时 | 操作要点 | 失败了怎么办（兜底） |
|---|---|---|---|---|---|
| 1 | **确认公开 GitHub 仓** | §3 链路①（第一步） | 1–2 分钟（若 Lead 用 `gh` 建仓则用户只需点头） | 同意把 `xiapan-music` 推到 `dongsheng123132/xiapan-music` 公开仓 | A. 用户网页手动建空仓 → Lead 只 push；B. 若担心曝光，可先私有仓验证，ClawHub/SkillHub 技能线照发（它们不依赖 GitHub），插件广场线延后 |
| 2 | **npm 重新登录** | §4 链路② 第 0 步（当前 401） | 3–5 分钟 | 浏览器打开 npm 登录页，登 `hfshfg` 账号（或建 Automation Token） | A. 用现有失效 token 重生成（Settings → Tokens → Regenerate）；B. 仍不行 → 走 `npm login` 的「通过邮箱验证」通道；C. 极端情况换备用账号（需先确认包名归属） |
| 3 | **给 npm 2FA OTP / 恢复码** | §4 链路② 第 2 步 `npm publish --otp` | 10 秒（每次 publish 一次） | 6 位动态码；或**恢复码**当 OTP（本机剩 4 个，用一次少一个，最好先把恢复码抄出来） | A. OTP 输错别连试（3 次会锁 10 分钟）；B. 恢复码用完去 npm 账户备份码页重新生成一组（需密码）；C. 没有 2FA 设备 → npm 支持邮件恢复流程（较慢） |
| 4 | **ClawHub 登录（如需）** | §7 链路⑦ | 已登录 ✅ 无需操作；若过期 1 分钟 | `clawhub login` 会开浏览器，选 GitHub 授权 `dongsheng123132` | A. 无浏览器：`clawhub login --token <token> --no-browser`；B. 授权页报错就先 `clawhub logout` 再登录 |
| 5 | **SkillHub 实名/企业认证（可能）** | §6 链路⑥ 首次 publish 若返回 403 | 10–20 分钟 + 审核 1–2 个工作日 | 到 skillhub.cn 控制台用手机号登录 → 实名认证（身份证）→ 创建/确认 `skh_` 社区 Token | A. 来不及就先跳过技能线，**SkillHub 插件广场是自动爬 GitHub 的，不受影响**；B. 个人实名即可（竞品有企业认证但个人也能发）；C. Token 找不到：控制台「API Token」页新建一个 |
| 6 | **确认可花钱的余额** | 发布后验收（实测装一次出歌） | 1 分钟 | 虾盘云账户余额 ≥ ¥5（一两次出歌的预算） | A. 余额不足就走只读验收（不真出歌）；B. 使用现有测试 Key，不新充值 |
| 7 | **拍板费用口径** | 发布文案前（**阻塞文案**） | 1 分钟 | PLAN 写 ¥1.2/次、README 写 ¥2.4/次，请统一（见 market-research §8 风险1） | 不确定就统一写「约 ¥2.4/次（一次 2 首），以实际扣费为准」——只承诺「约」，不承诺精确 |
| 8 | **确认上架文案终稿** | 发布前最后一步 | 5 分钟 | 过一遍 `artifacts/publish/listings.md` 的中英文案与 CTA 链接 | 来不及就先用「短版」一句话上架，详情页后补 |

**用户完全不用做的事（明确列出，避免打扰）**
- 不用给密码/Key；不用手动上传文件；不用改服务器；不用实名 ClawHub/GitHub（都已登录）；不用向目录站投稿（除 awesome 由 Lead 提 PR）。
- 用户唯一接触凭据的时刻是 npm 2FA OTP（动态码/恢复码），**不需要把密码或 token 文本发给任何人**。

---

## 13. 红线（任何人不得违反）

1. 不执行 `npm login` / `npm publish` / `clawhub publish` / `skillhub publish` / `git push` / `gh pr create`，除非 Lead 明确批准（T3 一个都没执行）。
2. 不花钱：不发起真实出歌、不充值、不买任何服务。
3. 不打印/不写入 Key、Token、OTP、恢复码（含 CLI 输出里的敏感串必须打码）。
4. 不改 `opentu-uclaw` 外层仓、不改虾盘云线上代码。
5. 发布前必须过 §0.3 与 §9 #11（无密钥检查）。
6. 不虚假宣传：未拿到 Verified 不写 Verified；不承诺版权/商用；不写「最强/第一」。
