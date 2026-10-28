# 发布回执（2026-10-28）

> 状态以各平台实际页面为准；本文件由 Lead 在每次发布后更新。

## 已完成

| 入口 | 结果 | 链接 / ID | 时间 | 备注 |
|---|---|---|---|---|
| GitHub 公开仓 | ✅ 已推送，CI 通过（12s） | https://github.com/dongsheng123132/xiapan-music | 2026-10-28 10:40+08 | 12 个 topics：dsh / dsh-plugin / deepseek-harness / agent-skills / ai-music / suno / music-generation / text-to-music / lyrics / bgm / xiapan / songwriting |
| GitHub Release | ✅ v0.1.0（代码已 bump 0.1.1，v0.1.1 release 随后） | https://github.com/dongsheng123132/xiapan-music/releases/tag/v0.1.0 | 2026-10-28 10:41+08 | v0.1.1 仅 metadata/版本对齐，无功能变更 |
| SkillHub 技能 | ✅ **已上架**（v0.1.0，category=design-media，安全报告 keen/sanbu 均 benign「安全，无风险」，downloads=4） | https://skillhub.cn/skills/user_abeb50e0/xiapan-music | 2026-10-28 10:40+08 | ✅ 实测 `skillhub install xiapan-music --namespace user_abeb50e0` 安装成功（10 文件），安装后 `balance.mjs` 可跑 |
| ClawHub 技能 | ⏳ **卡在平台 pending.publication（已确认为平台已知 bug，已提支持 issue #4114）**（0.1.0 versionId=k972v7hrpjv0ds1zwperc1yx858h43pp；0.1.1 versionId=k97b1ptq47bs8sjewf8xx73v898h4p75，attemptId=zx7284aer96fg31dge0bs406rs8h53dc） | https://github.com/openclaw/clawhub/issues/4114 | 提交 10:39/10:53+08 | moderation CLEAN（engine v2.4.26）但版本从未公开；同类 issue #4087 由维护者手动 recover 后发布；等维护者处理 |

## 待办（依赖）

| 入口 | 依赖 | 动作 | 预计 |
|---|---|---|---|
| npm `dsh-xiapan-music` | 用户 npm 重新登录 + 2FA OTP（当前 token 401） | `npm publish --registry=https://registry.npmjs.org --otp <OTP>` | 用户配合后 1 分钟 |
| ~~DSH 插件安装~~ | ✅ **已绕过 npm 发布**：Release 资产直接安装成功 | `dsh plugin --profile web add https://github.com/dongsheng123132/xiapan-music/releases/download/v0.1.1/dsh-xiapan-music-0.1.1.tgz` | 2026-10-28 实测 9.6s |
| dshbase.com 收录 | npm 发布 | 自动爬 npm（1–2 天，L1–L4 真机安装测试） | 发布后 1–2 天 |
| dshmp.com 收录 | npm 发布 | 自动爬 npm（≤1 天，无人工审核） | 发布后 ≤1 天 |
| SkillHub 插件广场 | GitHub 仓 + topics（已完成） | 自动爬 GitHub（每日） | 发布后 ~1 天 |
| awesome-dsh-plugin（dsh Discover 索引源） | 仓龄 ≥ 1 天 | 提 PR：`data/plugins/dongsheng123132__xiapan-music.yml`（模板见 docs/publishing.md） | 2026-10-29 后 |
| skills.sh | ✅ **已收录**（2026-10-28 实测 200） | https://www.skills.sh/dongsheng123132/xiapan-music | 立即 | 自动索引 GitHub 仓；`npx skills add dongsheng123132/xiapan-music --skill xiapan-music -y` 已在干净环境实测成功（安装 0.1.1，9 个文件齐全） |

## 本机安装验收命令（发布后可直接跑）

```bash
# DSH 插件（npm 发布后）
dsh plugin --profile web add dsh-xiapan-music
# 发布前也可直接从 GitHub 装：
dsh plugin --profile web add github:dongsheng123132/xiapan-music

# Agent Skill（skills.sh）
npx skills add dongsheng123132/xiapan-music --skill xiapan-music -g -y

# SkillHub 技能
skillhub install xiapan-music --namespace user_abeb50e0

# ClawHub（审核通过后）
clawhub install xiapan-music
```

## 花费记录（虾盘云 Key，真机）

| 日期 | 用途 | 金额（约） |
|---|---|---|
| 2026-10-28 | 首次 smoke（描述型 prompt，2 短 clip） | ¥1.2 |
| 2026-10-28 | T1 整歌实验（完整歌词，2 首 131s） | ¥2.4 |
| 2026-10-28 | T1 BGM 实测（1 首 113.8s） | ¥1 |
| 2026-10-28 | T1 skill e2e（2 首 200s） | ¥2.4 |
| 2026-10-28 | T2 插件真机出歌（2 首 169s/172s） | ¥2.41 |
| **合计** | | **≈ ¥9.4（项目预算 ¥10 内）** |





---

## 当前状态总览（2026-10-28 11:25 +08）

**已可验证 / 已上线**
- GitHub 公开仓（12 topics）、CI 全绿、Release v0.1.1 + 可安装 tarball 资产
- DSH 插件：`dsh plugin --profile web add https://github.com/dongsheng123132/xiapan-music/releases/download/v0.1.1/dsh-xiapan-music-0.1.1.tgz`（隔离 profile 实测 9.6s 安装成功，bundle 自动注册）
- Agent Skill：`npx skills add dongsheng123132/xiapan-music --skill xiapan-music -y`（干净 Node 22 环境实测 9 文件全部安装）
- skills.sh 详情页 200：https://www.skills.sh/dongsheng123132/xiapan-music
- SkillHub 技能页 200（versions=1，安全扫描 keen/sanbu 排队中）
- ClawHub 已提交 0.1.1（自动扫描 CLEAN，`pending.publication` 等待发布）

**待外部条件（平台队列，非我方动作）**
- ClawHub 发布：`pending.publication`（Moderate CLEAN）
- SkillHub 审核：`keen=queued` / `sanbu=queued`（平台安全扫描队列）
- SkillHub 插件广场：每日爬 GitHub（仓库条件已满足，等下一轮抓取）
- awesome-dsh-plugin：仓龄需 ≥ 1 天 → 2026-10-29 10:39+ 后提 PR（条目已备：`artifacts/publish/awesome-entry.yml`）
- dshbase / dshmp：依赖 npm 发布后自动收录（各 1–2 天）

**唯一需要用户做的硬前置**
1. **npm 凭据**：token 已失效（401）。二选一：① 在 npm tokens 页建 Automation token 发给 Lead（发完可删）；② 本机 `npm login --registry=https://registry.npmjs.org` 后给一个恢复码当 OTP。
2. （可选，SkillHub 审核通过后）在 SkillHub 控制台给技能补分类/图标；ClawHub 已带 creative 分类与 topics，无需操作。

**npm 发布后 Lead 自动收尾**
- `npm publish --registry=https://registry.npmjs.org --otp <OTP>` → 验证 `registry.npmjs.org/dsh-xiapan-music`
- 把 README/INSTALL-MATRIX 安装命令切回 `dsh plugin add dsh-xiapan-music`
- 等 dshbase/dshmp 自动收录并回填本回执
- 全天后再提 awesome-dsh-plugin PR、复查 SkillHub 插件广场收录


## awesome-dsh-plugin PR 预置（2026-10-28 16:5x +08）

- 仓库已有旧 fork：`dongsheng123132/awesome-dsh-plugin`（公开 fork）
- 已建分支 `add-xiapan-music`，并在其中新增 `data/plugins/dongsheng123132__xiapan-music.yml`（commit 895c309，内容按真实 schema：`category: skill` + `description.en/zh` + `icon` 指向 `assets/icon-180.png`）
- 只等仓龄满 1 天（建仓 2026-10-28 10:39 +08）后开 PR（一条 API 调用）：
  `gh api repos/awesome-dsh-plugin/awesome-dsh-plugin/pulls -X POST -f title="Add dongsheng123132/xiapan-music" -f head="dongsheng123132:add-xiapan-music" -f base="main" -f body="..."`
- 定时任务已设在 2026-10-29 10:45 +08 自动执行 PR + 复查收录。

## 链接 QA（2026-10-28 16:42 +08，全部实测）

| 链接 | 结果 |
|---|---|
| https://tu.u-claw.org.cn/?utm_source=github&utm_medium=readme&utm_campaign=xiapan-music | 200（UTM 保留） |
| https://api.u-claw.org.cn/recharge?utm_source=clawhub&utm_medium=skill&utm_campaign=xiapan-music | 200 |
| https://api.u-claw.org.cn/（领 Key/控制台） | 200 |
| https://skillhub.cn/skills/user_abeb50e0/xiapan-music | 200 |
| https://api.skillhub.cn/api/v1/download?slug=xiapan-music&namespace=user_abeb50e0 | 200（38KB zip，可安装） |
| https://github.com/dongsheng123132/xiapan-music | 200 |
| https://github.com/dongsheng123132/xiapan-music/releases/download/v0.1.1/dsh-xiapan-music-0.1.1.tgz | 200（53,375B，可直接 dsh plugin add） |
| https://www.skills.sh/dongsheng123132/xiapan-music | 200 |
| raw icon-180 / README | 200 / 200 |
| npm registry `dsh-xiapan-music` | 404（待发布） |
| SkillHub 插件广场搜索 xiapan | 0 条（待每日爬取） |
