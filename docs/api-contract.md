# 虾盘云音乐 API 契约（实测版）

> 真机实测日期：**2026-10-28** · 实测人：T1（music-skill）· 证据目录：`artifacts/smoke/suno-20261028/`、`artifacts/smoke/suno-fullsong-20261028/`
> 本文所有请求/响应都是线上实测原文（仅删去超长冗余字段，删除处标 `…`）。金额均为「以实际扣费为准」的约数。

## 0. 基址与鉴权

- Base URL：**`https://api.u-claw.org.cn`**（本机实测：`api.u-claw.org` **8/8 ECONNRESET**，`api.u-claw.org.cn` **4/4 → 200**；凡是要给用户点的注册/充值链接也一律用 `.cn`。代码里遇到旧直链会自动改写成 `.cn`）
- 鉴权：`Authorization: Bearer <KEY>`；Key 形如 `sk-...`（new-api token / `sk-xp-...` / U 盘设备 Key 均可）
- Key 解析优先级（core `resolveKey`）：`--key` > 环境变量 `XIAPAN_API_KEY` > `~/.uking/device.json` 的 `key`
  - DSH 插件场景：插件把 Key 从 `~/.dsh/.credentials.yaml` 的 `refs` 取出，以环境变量注入子进程，脚本不解析 yaml。
- **红线**：完整 Key 不写文件、不进日志、不进 stdout/stderr、不进错误信息；只允许展示前 8 位。

## 1. 端点总览与计费

| 用途 | 方法/路径 | 计费（实测/牌价） | 说明 |
|---|---|---|---|
| 出歌（Suno，异步） | `POST /suno/submit/music` | **实测 1,200,000 token = ¥2.4/次，一次出 2 首**（合 ¥1.2/首） | 提交即扣费，**禁止自动重试** |
| 取出歌结果 | `GET /suno/fetch/{taskId}` | 免费 | 轮询，5s 间隔 |
| 写歌词（文本模型） | `POST /v1/chat/completions` | ≈¥0.01 以内 | 必须 `thinking:{type:"disabled"}` |
| 纯音乐/BGM（MiniMax） | `POST /v1/music/generations` | 牌价约 ¥1/首 | 异步 + 轮询 + content 下载 |
| BGM 查状态 | `GET /v1/music/generations/{id}` | 免费 | |
| BGM 取音频字节 | `GET /v1/music/generations/{id}/content` | 免费 | 直接回 mp3 字节 |
| 余额（订阅上限） | `GET /v1/dashboard/billing/subscription` | 免费 | `hard_limit_usd` |
| 余额（已用） | `GET /v1/dashboard/billing/usage?start_date=2020-01-01&end_date=YYYY-MM-DD` | 免费 | `total_usage`，单位美分 |

音频直链已被代理成 `https://media.u-claw.org.cn/media/x/...`，**下载无需鉴权**。

---

## 2. 出歌：`POST /suno/submit/music`

### 2.1 请求体（实测原文，含完整歌词）

```json
{
  "prompt": "[Verse 1]\n路灯把影子拉得很长\n末班车开过空空的街\n我把没说完的话\n折成一只纸船 放进夜色里\n\n[Pre-Chorus]\n风掀起衣角 也掀起旧事\n谁没有过 咬着牙的日子\n\n[Chorus]\n晚风会替我把答案吹来\n那些绕远的路 都不算白走\n晚风会替我把答案吹来\n等天亮了 我就往前再走一步\n\n[Verse 2]\n清晨的雾还没散开\n早点摊冒着白白的热气\n有人笑着打招呼\n像什么都没发生过一样\n\n[Bridge]\n如果世界太吵\n就听听心跳的声音\n它一直都在说\n别怕 别怕\n\n[Chorus]\n晚风会替我把答案吹来\n那些绕远的路 都不算白走\n晚风会替我把答案吹来\n等天亮了 我就往前再走一步\n\n[Outro]\n等天亮了\n我就往前再走一步",
  "tags": "Mandarin Chinese indie folk pop, 96 BPM, 4/4, warm male vocal with clear diction, acoustic guitar, soft live drums, warm bass, subtle strings, hopeful and gentle, storytelling verses, singable chorus, clean studio recording",
  "title": "晚风里的答案",
  "mv": "chirp-v5-5"
}
```

字段约束（客户端已校验）：

| 字段 | 必填 | 约束 | 说明 |
|---|---|---|---|
| `prompt` | 是 | 1–5000 字 | **完整歌词**（带 `[Verse]/[Chorus]` 等结构标签）；纯音乐时放风格描述 |
| `tags` | 否 | ≤1000 字 | **英文**风格词（曲风/BPM/人声/配器/情绪），不要放中文、不要放歌词 |
| `title` | 否 | 建议 ≤40 字 | 歌名 |
| `mv` | 否 | 默认 `chirp-v5-5` | 实测传 `chirp-v5-5` / `chirp-v6` 返回的都落到 v6，见 §2.5 |
| `make_instrumental` | 否 | bool | 纯音乐为 `true`，此时 `prompt` 只放风格描述 |

### 2.2 响应（实测原文）

```json
{
  "code": "success",
  "data": "task_04AglAxKjBF7iZzBDLW6X2isb361T5JE",
  "message": ""
}
```

- `data` 就是 taskId（字符串，形如 `task_...`），后续轮询用。
- **提交成功即扣费**：客户端对 submit 永不自动重试；「2xx 但无 taskId」按可能已扣费处理，提示人工核对账单而不是重提。

### 2.3 取结果：`GET /suno/fetch/{taskId}`（实测结构，删去 `action_config`/`albums`/`metadata` 等超长字段）

```json
{
  "code": "success",
  "data": {
    "task_id": "task_04AglAxKjBF7iZzBDLW6X2isb361T5JE",
    "status": "SUCCESS",
    "progress": "100%",
    "fail_reason": "",
    "created_at": 1793152954,
    "submit_time": "…",
    "finish_time": "…",
    "platform": "…",
    "data": [
      {
        "clip_id": "7b9b4034-f6ca-4263-aef3-98bdeaa0a765",
        "id": "7b9b4034-f6ca-4263-aef3-98bdeaa0a765",
        "title": "晚风里的答案",
        "duration": 131.36,
        "status": "complete",
        "audio_url": "https://media.u-claw.org.cn/media/x/…/7b9b4034-….mp3",
        "image_url": "https://media.u-claw.org.cn/media/x/…/image_7b9b4034-….jpeg",
        "image_large_url": "https://media.u-claw.org.cn/media/x/…",
        "model_name": "chirp-hawk",
        "major_model_version": "v6",
        "mv": "chirp-hawk",
        "tags": "Mandarin Chinese indie folk pop, 96 BPM, 4/4, warm male vocal …",
        "prompt": "[Verse 1]\n路灯把影子拉得很长\n…",
        "metadata": { "duration": 131.36, "make_instrumental": false, "prompt": "…", "tags": "…", "…": "…" }
      }
    ]
  }
}
```

状态机（轮询用）：

| status | 含义 | 客户端行为 |
|---|---|---|
| `NOT_START` / `SUBMITTED` / `PENDING` / `QUEUED` | 已受理/排队 | 继续轮询 |
| `IN_PROGRESS` / `PROCESSING` / `RUNNING` | 生成中（此时 `data` 可能已有 2 个占位 clip，但 `audio_url` 不可用） | 继续轮询 |
| `SUCCESS` / `COMPLETE` | 完成（`progress:"100%"`） | 下载 `data[].audio_url` |
| `FAILURE` / `FAILED` / `ERROR` / `CANCELLED` | 失败（`fail_reason` 给原因） | 抛 `TASK_FAILED`，不重试 |

实测时序（任务 A）：提交后 `+8s SUBMITTED 0%` → `+18s IN_PROGRESS 0% clips=2` → `+65s SUCCESS 100%` → 下载 3.0MB / 3.1MB 两个 mp3。

### 2.4 整歌 vs 30 秒 clip —— 关键对照实验（本文最重要的结论）

| 实验 | prompt 内容 | tags | mv | 返回 2 首时长 | 证据 |
|---|---|---|---|---|---|
| 旧（`suno-20261028/`） | **一句中文描述**："轻快的城市流行歌曲，关于深夜便利店和温柔相遇，明亮鼓点，朗朗上口" | `city pop, upbeat, warm` | `chirp-v6` | **34.8s / 24.68s** | `fetch-response.json`（clip.metadata.prompt 回显的就是那句描述） |
| 新 A（`suno-fullsong-20261028/`） | **完整中文歌词 318 字**（`[Verse]/[Pre-Chorus]/[Chorus]/[Bridge]/[Outro]` 结构） | `Mandarin Chinese indie folk pop, 96 BPM…`（223 字） | `chirp-v5-5` | **131.36s / 131.16s（≈2:11 完整歌）** | `request-A-v55-lyrics.json`、`fetch-A-v55-lyrics.json`、`summary-A-v55-lyrics.json`、`clip-A-v55-lyrics-1/2.mp3` |
| 新 B（skill 包 e2e） | **完整中文歌词（15 段、约 430 字，由 `lyrics.mjs` 生成）** | `Chinese folk pop, warm male vocal…` | `chirp-v5-5` | **200.8s / 202.4s（3:21 / 3:22 完整歌）** | `e2e-summary.json`、`e2e-song-stdout.json`、`e2e-song-0/1.mp3`（taskId `task_IGp1Xry30Q06uleU45CENy0sJNiTNXN5`） |

**结论**：

1. **决定时长的是 `prompt` 是不是完整歌词**，不是 `mv`。把一句风格描述当 prompt，模型把它当一句歌词唱，只出 24–35 秒；换完整歌词后同一上游出 2–3.5 分钟整歌。
2. `mv` 传 `chirp-v5-5` 或 `chirp-v6`，返回的 `model_name` 都是 `chirp-hawk`、`major_model_version` 都是 `v6` —— 当前上游实际统一落 v6，`mv` 不是时长开关（默认值仍写 `chirp-v5-5`，与生产验证过的调用保持一致）。
3. **歌词长度与时长正相关（经验值）**：318 字 → ≈2:11；约 430 字 → ≈3:21。想要 3–4 分钟就写 20–32 行、约 400–700 字。
4. 客户端已把这条**写死成硬规则**：`generateSong`/`song.mjs` 在没有完整歌词时先调写词接口，`submitSong({requireLyrics:true})` 会拒绝「一句描述」；纯音乐必须显式 `make_instrumental:true`（prompt 才允许是描述）。

### 2.5 二次真机验证：skill 包自包含 e2e（¥2.4）

把 `skills/xiapan-music/` 整目录拷到系统临时目录（不带仓库任何依赖），执行：

```bash
node <tmp>/xiapan-music/scripts/song.mjs --lyrics-json <card.json> --confirm --out-dir <tmp>/out --json --source github
```

- 退出码 **0**，taskId `task_IGp1Xry30Q06uleU45CENy0sJNiTNXN5`；返回 2 首 **200.8s / 202.4s**，mp3 **4,833,318 B / 4,837,710 B**（`e2e-song-0.mp3` / `e2e-song-1.mp3`）。
- stdout JSON **不含任何完整 Key**（已扫描 `sk-` 前缀）；`nextSteps.board` 带 `utm_source=github&utm_medium=skill&utm_campaign=xiapan-music`。
- 同一命令先不带 `--confirm` 跑一次：exit `2` + `{ok:false, error:{code:"NEEDS_CONFIRMATION"}, card:{…}}`，**不提交、不扣费**（两段式验证通过）。
- **`--help` 在 Windows 退出码 0、无 libuv 断言**；错误路径（无 Key）exit `2` + `error.code=BAD_KEY`，同样干净退出。

### 2.6 成本（实测）

一次提交（出 2 首）实测扣 **1,200,000 token = ¥2.4**。测算证据（任务 A 提交前后 74 秒内查询余额）：

| 时点 | hard_limit_usd | total_usage（美分） | 按 PLAN 公式换算 remainToken | ≈¥ |
|---|---|---|---|---|
| 提交前 | 77.206124 | 322.282 | 36,991,652 | 73.98 |
| 提交后 | 76.006124 | 442.282 | 35,791,652 | 71.58 |

- 换算公式：`remainToken = (hard_limit_usd − total_usage/100) × 500000`；`¥1 = 500000 token`。
- 即「**一次提交约 ¥2.4（2 首，合 ¥1.2/首）**」。PLAN 早期写的「¥1.2/次」应理解为每首 ¥1.2。
- ⚠️ 该账户多人共用，后续 BGM/歌词的余额变化会被并发消费污染；**只有任务 A 的这一枪是干净隔离测量**。BGM 牌价约 ¥1/首，未做隔离测量，文档中只写「约」。
- **T1 本次真机总花费 ≈¥5.8**：出歌 A ¥2.4 + skill e2e 出歌 ¥2.4 + BGM 1 首 ≈¥1 + 写词若干（≈¥0.01），在 ≤¥6 预算内。

---

## 3. 写歌词：`POST /v1/chat/completions`

```json
{
  "model": "deepseek-v4-flash",
  "messages": [
    { "role": "system", "content": "你是一位专业作词人…只输出一个 JSON 对象 {\"title\":…,\"tags\":…,\"lyrics\":…}…" },
    { "role": "user", "content": "主题/需求：写给深夜加班后独自走回家的人，温暖治愈的民谣\n希望的音乐风格：中文民谣流行，温暖男声，木吉他\n歌词语言：简体中文" }
  ],
  "thinking": { "type": "disabled" },
  "temperature": 0.9,
  "max_tokens": 3000
}
```

- **必须带 `"thinking":{"type":"disabled"}`**，否则 deepseek-v4 可能只返回 `reasoning_content`。
- 响应走 OpenAI 兼容格式：`json.choices[0].message.content` 是一段**字符串**，客户端容错解析：容忍 ` ```json ` 围栏、前后废话、字段级正则兜底。
- 模型输出约定（实测可用）：

```json
{
  "title": "路灯下的归途",
  "tags": "Chinese folk pop, warm male vocal, acoustic guitar, 88 BPM, gentle, healing, night city",
  "lyrics": "[Verse 1]\n写字楼的灯一盏一盏关\n最后一班地铁开往终点站\n…\n[Outro]\n门开了 有人轻轻唤你回来\n今夜好好睡 别怕明天"
}
```

- 客户端会校验：`lyrics` 含结构标签、≥8 行、120–5000 字；不合格**免费重试一次**（文本模型，不涉及付费提交）。
- 成本≈¥0.01 以内；实测一次写词后余额低 4 位小数无可见变化。

---

## 4. 纯音乐 / BGM（MiniMax，经 pay-server）

### 4.1 提交

```http
POST /v1/music/generations
{"model":"minimax-music-v2.6","prompt":"轻快温馨的钢琴曲，适合短视频结尾，明亮、治愈、不抢人声","idempotency_key":"xiapan-bgm-1759...-ab12cd34"}
```

实测返回任务 id 形如 `music_95a1263017690602e9c150e415afc15c`（handler 兼容 `id` / `task_id` / `taskId` / `data.id`）。

### 4.2 轮询 + 下载

```http
GET /v1/music/generations/{id}            → status: QUEUED/RUNNING/… → COMPLETED/SUCCESS/…
GET /v1/music/generations/{id}/content    → 直接返回 mp3 字节（需鉴权头）
```

实测一次成功样本：轮询 5s/次，总耗时 **113.8s**，content 落盘 **703,519 字节** 的 mp3（`artifacts/smoke/suno-fullsong-20261028/bgm-e2e.mp3`）。牌价约 ¥1/首。

### 4.3 错误形态

- 余额不足：HTTP **402** `{"error":{"type":"insufficient_quota","message":"…"}}`（pay-server 路径）。
- 注意（内部记录）：欠费时 new-api 路径（`/suno/*`、`/v1/models`）会统一回 **401 "Invalid token"**，与「Key 无效」同形 → 客户端对 401 的提示写「可能是 Key 无效，或账户余额不足后网关统一返回 401；先查余额再换 Key」，不做自动重试。

---

## 5. 余额

```http
GET /v1/dashboard/billing/subscription
→ {"hard_limit_usd":77.206124,"soft_limit_usd":…,"system_hard_limit_usd":…,"has_payment_method":true,"object":"billing_subscription","access_until":0}

GET /v1/dashboard/billing/usage?start_date=2020-01-01&end_date=2026-10-28
→ {"object":"list","total_usage":322.282}
```

换算（PLAN §1.4，实测自洽）：

```js
totalToken  = hard_limit_usd * 500000
usedToken   = total_usage / 100 * 500000
remainToken = max(0, totalToken - usedToken)
remainCny   = remainToken / 500000
```

> 实测注意：每次扣费后 `hard_limit_usd` 与 `total_usage` **会同时变化**，别用单一字段算余额，按上面的差值公式算。

---

## 6. 错误形态与客户端错误码映射

| HTTP / 现象 | 实际响应（实测原文） | 客户端 code | 建议 |
|---|---|---|---|
| 401 | `{"error":{"code":"","message":"Invalid token (request id: 202610280213018034938408268d9d6cqAjRKE4)","type":"new_api_error"}}` | `BAD_KEY` | 先查余额；余额正常则换 Key |
| 402 | `{"error":{"type":"insufficient_quota","message":"…"}}` | `NO_BALANCE` | 提示充值，不自动重试 |
| 403 | `no access to model suno_music`（白名单未放行时） | `BAD_KEY`（消息里说明是权限） | 在令牌设置里放行 suno_music / suno_lyrics |
| 429 | rate limit 类错误 | `RATE_LIMIT` | 稍后再试 |
| 5xx | upstream error | `NETWORK` | 可重试查询，**不要重提付费任务** |
| 任务不存在 | HTTP 404 `{"code":"task_not_found","data":null,"message":"Task not found"}` | `BAD_REQUEST` | 提交后前几次轮询出现属正常，客户端有宽限期 |
| 任务失败 | `data.status = "FAILURE"`，`data.fail_reason` 给原因 | `TASK_FAILED` | 转述原因，重新出卡 |
| 轮询超时 | — | `TIMEOUT` | 用 `--resume-task <taskId>` 续查，不重新提交 |
| 网络错误 | fetch throw / ECONNRESET | `NETWORK` | 轮询重试有限次；submit 不重试 |

统一错误对象：`XiapanMusicError { code, message, details }`；`message` 可直接给用户看（已脱敏）。

---

## 7. 导流 CTA 与 UTM 归因

- 画板：`https://tu.u-claw.org.cn`
- 领 Key / 注册：`https://api.u-claw.org.cn`
- 充值：`https://api.u-claw.org.cn/recharge`（支持 `?key=sk-...` 自动填入；直达链接只给用户本人看，不写文件/日志）

归因规则（`buildNextSteps`）：

- `utm_campaign` 固定 `xiapan-music`
- `utm_source`：显式入参 > `XIAPAN_UTM_SOURCE` > `cli`；取值 `clawhub | skillhub | npxskills | dsh | github | cli`
- `utm_medium`：显式入参 > `XIAPAN_UTM_MEDIUM` > `skill`；**DSH 插件场景注入 `XIAPAN_UTM_MEDIUM=plugin`**
- `utm_source` / `utm_medium` 只保留 `[a-z0-9_-]`（≤40 字符），防止把 Key 等敏感串透传进 URL。

---

## 8. 复现方式

```bash
# 1) 单元测试（假 fetch，零网络零扣费，33 例）
node --test scripts/test-core.mjs     # 或 node --test --test-isolation=none scripts/test-core.mjs（受限沙箱）

# 2) 免费：查余额 / 只出制作卡（不提交）
node scripts/balance.mjs --json
node skills/xiapan-music/scripts/song.mjs --theme "…" --json

# 3) 付费（一次提交约 ¥2.4，出 2 首）：只在用户确认制作卡后执行
node skills/xiapan-music/scripts/song.mjs --theme "…" --confirm --json

# 4) 真机实验留证（本次用的脚本）：artifacts/smoke/suno-fullsong-20261028/exp.mjs
```
