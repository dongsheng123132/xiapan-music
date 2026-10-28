# 安装矩阵（谁怎么装）

| Agent / 平台 | 安装方式 | 状态 |
|---|---|---|
| **DeepSeek Harness（DSH）** | **现在就能装**：`dsh plugin --profile web add https://github.com/dongsheng123132/xiapan-music/releases/download/v0.1.1/dsh-xiapan-music-0.1.1.tgz`<br>npm 发布后：`dsh plugin --profile web add dsh-xiapan-music` | ✅ 隔离 profile 从公开 Release 资产安装成功（9.6s，bundle 已注册）；npm 发布待完成 |
| **ClawHub / OpenClaw / U-Claw** | `clawhub install xiapan-music`（审核通过后）<br>或 `clawhub search 虾盘云音乐` | ⏳ 卡在平台 pending.publication（已提 issue [#4114](https://github.com/openclaw/clawhub/issues/4114)） |
| **SkillHub（腾讯系）** | 页面点「安装到本地 Agent」，或 `skillhub install xiapan-music --namespace user_abeb50e0` | ✅ **已上架**（v0.1.0，安全报告 benign），安装实测通过 |
| **任意支持 SKILL.md 的 Agent** | `npx skills add dongsheng123132/xiapan-music --skill xiapan-music -y` | ✅ 干净环境实测通过（skills.sh 已收录） |
| **Claude Code / Codex / Cursor / Hermes / WorkBuddy …** | 把 `xiapan-music/` 整个目录拷进它的 skills 目录；或走上面的 `npx skills add` | ✅ 技能自包含（零依赖） |
| **手动 / 离线** | 下载仓库 zip → 解压 → 把 `skills/xiapan-music/` 拷到任意 skills 目录 | ✅ |

> 装 U 盘 / U-King 的电脑不用配 Key：脚本会自动读 `~/.uking/device.json` 的设备 Key。
> 其它电脑需要一把虾盘云 Key：注册 https://api.u-claw.org.cn → 充值 https://api.u-claw.org.cn/recharge。


