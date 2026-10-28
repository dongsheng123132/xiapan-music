# 发布回执（2026-10-28）

> 状态以各平台实际页面为准；本文件由 Lead 在每次发布后更新。

## 已完成

| 入口 | 结果 | 链接 / ID | 时间 | 备注 |
|---|---|---|---|---|
| GitHub 公开仓 | ✅ 已推送，CI 通过（12s） | https://github.com/dongsheng123132/xiapan-music | 2026-10-28 10:40+08 | 12 个 topics：dsh / dsh-plugin / deepseek-harness / agent-skills / ai-music / suno / music-generation / text-to-music / lyrics / bgm / xiapan / songwriting |
| GitHub Release | ✅ v0.1.0（代码已 bump 0.1.1，v0.1.1 release 随后） | https://github.com/dongsheng123132/xiapan-music/releases/tag/v0.1.0 | 2026-10-28 10:41+08 | v0.1.1 仅 metadata/版本对齐，无功能变更 |
| SkillHub 技能 | ⏳ 已提交，**审核中**（skillId=297799，页面 200，下载接口暂 404 待审核） | https://skillhub.cn/skills/user_abeb50e0/xiapan-music | 2026-10-28 10:40+08 | 审核通过后 `skillhub install xiapan-music --namespace user_abeb50e0` 才可用 |
| ClawHub 技能 | ⏳ **0.1.1 已提交，待安全发布**（0.1.0 id=k972v7hrpjv0ds1zwperc1yx858h43pp；0.1.1 versionId=k97b1ptq47bs8sjewf8xx73v898h4p75，attemptId=zx7284aer96fg31dge0bs406rs8h53dc） | 预期 https://clawhub.ai/dongsheng123132/skills/xiapan-music | 0.1.0: 10:39+08 / 0.1.1: 10:53+08 | `inspect` 显示 Moderate **CLEAN**、Reason `pending.publication`（自动检查已过，等待发布）；已补 `--categories creative` + topics music/suno/ai-music/text-to-music/agent-skills |

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



