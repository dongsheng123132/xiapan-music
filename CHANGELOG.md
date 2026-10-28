# Changelog

## 0.1.1 — 2026-10-28

- ClawHub 上架补充分类与话题（categories: creative；topics: music / suno / ai-music / text-to-music / agent-skills），便于在音乐类目被发现。
- 版本号与 ClawHub 已发布 artifact 对齐（npm 首次发布即 0.1.1）。

## 0.1.0 — 2026-10-28

首个公开版本：**一仓双入口**（DeepSeek Harness 插件 + Agent Skill），把一个虾盘云 API Key 变成「一句话出歌」能力。

### 新增

- **DSH 插件 `dsh-xiapan-music`**：安装后自动注册内置「音乐」技能与 `xiapan_music` 工具（action：`song` / `instrumental` / `lyrics` / `balance` / `status`）。
- **Agent Skill `xiapan-music`**：自包含，可被 ClawHub / SkillHub / `npx skills add` / 任意支持 `SKILL.md` 的 Agent 安装。
- **一句话出歌**：AI 写词（带 `[Verse]/[Chorus]/[Bridge]` 结构标签）+ Suno V6 编曲演唱，一次提交出 2 首完整歌（实测 2:11–3:22），自动下载 mp3。
- **纯音乐 / BGM**（MiniMax music v2.6）、**已有歌词谱曲**（默认一字不改）、**余额查询**。
- **两段式制作卡**：无 `--confirm` 只出卡不扣费；同一张卡只提交一次；`--resume-task` 只续查不重提。
- 内置虾盘云画板导流 CTA（带 UTM），并把「领 Key / 充值」引导到 `api.u-claw.org.cn`。

### 已知限制

- 纯音乐当前走 MiniMax（Suno `make_instrumental` 路径未单独实测）。
- `mv` 参数当前不影响结果（上游统一落 v6 / chirp-hawk）。
- v1 为 host-only 插件；Web 面板（Key 输入 / 进度 / 内联播放）列入 v1.1 roadmap。
