# Security

## 凭据处理

- 本仓库**不包含任何 API Key / Token**。
- 脚本按以下顺序解析虾盘云 Key，且**永不打印完整 Key**（只展示前 8 位 + `***`）：
  1. `--key sk-...`（不推荐，Shell 历史会留痕）
  2. 环境变量 `XIAPAN_API_KEY`（DSH 插件会从 `$DSH_HOME/.credentials.yaml` 的 refs 注入）
  3. `~/.uking/device.json` 的 `key` 字段（装了虾盘 U 盘 / U-King 的电脑自动使用）
- 插件宿主侧对子进程输出做脱敏：已知 Key 值全量替换、`sk-` 前缀只留前 8 位。
- 生成的充值链接里带 `?key=` 仅返回给本人的终端/本机会话，不写入文件、不写日志。

## 付费与副作用

- Suno 出歌为**按次付费**（约 ¥2.4 / 一次，出 2 首）；脚本遵守「制作卡两段式」：不带 `--confirm` 只出卡不扣费，同一张卡只提交一次，提交失败不自动重试。
- 只有用户运行 `song.mjs --confirm` 或 DSH 里明确同意后，才会真正发起付费请求。

## 数据与网络

- 所有请求发往虾盘云官方端点 `https://api.u-claw.org.cn`；不使用第三方中转。
- 生成文件默认保存在 `~/Music/虾盘云音乐/`，不入库、不上传。
- Issue / PR 中请勿粘贴完整 Key、账单截图中的 Key、或 `~/.dsh/.credentials.yaml` 内容。

## 报告漏洞

发现安全问题请发邮件至 `38004547@qq.com`（主题注明 `[xiapan-music security]`），或在 GitHub 开一个**不含敏感信息**的 Issue 约定后续沟通方式。
