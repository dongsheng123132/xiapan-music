#!/usr/bin/env node
// T1 真机实验：整歌 vs 30s clip。一次性提交 + 轮询 + 落盘证据。零依赖。
// 用法：node exp.mjs --label A --mv chirp-v5-5 [--instrumental] [--prompt-file file] [--tags "..."]
// Key 只从 ~/.uking/device.json 读取，绝不打印完整 Key（只打印前 8 位）。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://api.u-claw.org.cn";
const HERE = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      out[k] = i + 1 < argv.length && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return out;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function readKey() {
  const j = JSON.parse(readFileSync(join(homedir(), ".uking", "device.json"), "utf8"));
  if (!j || !j.key) throw new Error("device.json 无 key");
  return j.key;
}

async function balance(key) {
  const h = { Authorization: `Bearer ${key}` };
  const [s, u] = await Promise.all([
    fetch(`${BASE}/v1/dashboard/billing/subscription`, { headers: h }).then((r) => r.json()),
    fetch(`${BASE}/v1/dashboard/billing/usage?start_date=2020-01-01&end_date=2026-10-29`, { headers: h }).then((r) => r.json()),
  ]);
  const remainToken = (s.hard_limit_usd - u.total_usage / 100) * 500000;
  return { hard_limit_usd: s.hard_limit_usd, total_usage: u.total_usage, remainToken: Math.round(remainToken) };
}

// 中文歌词：原创，带结构标签，长度接近一首 2-3 分钟歌
const LYRICS = `[Verse 1]
路灯把影子拉得很长
末班车开过空空的街
我把没说完的话
折成一只纸船 放进夜色里

[Pre-Chorus]
风掀起衣角 也掀起旧事
谁没有过 咬着牙的日子

[Chorus]
晚风会替我把答案吹来
那些绕远的路 都不算白走
晚风会替我把答案吹来
等天亮了 我就往前再走一步

[Verse 2]
清晨的雾还没散开
早点摊冒着白白的热气
有人笑着打招呼
像什么都没发生过一样

[Bridge]
如果世界太吵
就听听心跳的声音
它一直都在说
别怕 别怕

[Chorus]
晚风会替我把答案吹来
那些绕远的路 都不算白走
晚风会替我把答案吹来
等天亮了 我就往前再走一步

[Outro]
等天亮了
我就往前再走一步`;

const STYLE = "Mandarin Chinese indie folk pop, 96 BPM, 4/4, warm male vocal with clear diction, acoustic guitar, soft live drums, warm bass, subtle strings, hopeful and gentle, storytelling verses, singable chorus, clean studio recording";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const label = String(args.label || "A");
  const mv = String(args.mv || "chirp-v5-5");
  const instrumental = args.instrumental === true;
  const tags = String(args.tags || STYLE);
  const title = String(args.title || "晚风里的答案");
  const promptFile = args["prompt-file"] ? resolve(String(args["prompt-file"])) : null;
  const prompt = promptFile ? readFileSync(promptFile, "utf8").trim() : LYRICS;

  mkdirSync(HERE, { recursive: true });
  const key = readKey();
  console.error(`[key] ${key.slice(0, 8)}…`);
  const before = await balance(key);
  console.error(`[balance before] remainToken=${before.remainToken} (~¥${(before.remainToken / 500000).toFixed(2)})`);

  const payload = { prompt, tags, title, mv };
  if (instrumental) payload.make_instrumental = true;
  writeFileSync(join(HERE, `request-${label}.json`), JSON.stringify({ endpoint: "POST /suno/submit/music", body: payload }, null, 2));
  console.error(`[submit ${label}] mv=${mv} instrumental=${instrumental} lyricsChars=${prompt.length} tagsChars=${tags.length}`);

  const t0 = Date.now();
  const subRes = await fetch(`${BASE}/suno/submit/music`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const subText = await subRes.text();
  let sub;
  try { sub = JSON.parse(subText); } catch { sub = { raw: subText }; }
  writeFileSync(join(HERE, `submit-${label}.json`), JSON.stringify({ status: subRes.status, body: sub }, null, 2));
  console.error(`[submit ${label}] HTTP ${subRes.status} code=${sub.code} data=${String(sub.data).slice(0, 60)}`);
  if (sub.code !== "success" || !sub.data) {
    console.error("[abort] submit 未拿到 task_id，不再重试（防重复扣费）");
    writeFileSync(join(HERE, `summary-${label}.json`), JSON.stringify({ label, ok: false, submit: sub, status: subRes.status }, null, 2));
    process.exit(1);
  }
  const taskId = String(sub.data);

  // 轮询
  let last = null;
  const deadline = Date.now() + 12 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(5000);
    let res, text;
    try {
      res = await fetch(`${BASE}/suno/fetch/${taskId}`, { headers: { Authorization: `Bearer ${key}` } });
      text = await res.text();
    } catch (e) {
      console.error(`[poll] 网络错误，继续：${e.message}`);
      continue;
    }
    let body;
    try { body = JSON.parse(text); } catch { console.error(`[poll] 非 JSON HTTP ${res.status}`); continue; }
    last = { status: res.status, body };
    const d = body.data || {};
    const status = d.status;
    console.error(`[poll +${Math.round((Date.now() - t0) / 1000)}s] HTTP ${res.status} status=${status} progress=${d.progress ?? "?"} clips=${Array.isArray(d.data) ? d.data.length : 0}`);
    if (status === "SUCCESS" || status === "FAILURE" || status === "ERROR") break;
  }

  writeFileSync(join(HERE, `fetch-${label}.json`), JSON.stringify(last, null, 2));
  const data = last?.body?.data ?? {};
  const clips = (data.data || []).map((c) => ({
    clip_id: c.clip_id || c.id,
    title: c.title,
    duration: c.duration,
    model_name: c.model_name,
    major_model_version: c.major_model_version,
    audio_url: c.audio_url,
    status: c.status,
  }));
  // 只下载音频（证据），不带 key
  let i = 0;
  for (const c of clips) {
    i += 1;
    try {
      const r = await fetch(c.audio_url);
      const buf = Buffer.from(await r.arrayBuffer());
      const file = join(HERE, `clip-${label}-${i}.mp3`);
      writeFileSync(file, buf);
      c.file = file;
      c.bytes = buf.length;
    } catch (e) {
      c.downloadError = e.message;
    }
  }
  const after = await balance(key);
  const costToken = before.remainToken - after.remainToken;
  const summary = {
    label, taskId, mv, instrumental, elapsedMs: Date.now() - t0,
    finalStatus: data.status, progress: data.progress,
    clips,
    balance: { before, after, costToken, costCnyApprox: +(costToken / 500000).toFixed(4) },
  };
  writeFileSync(join(HERE, `summary-${label}.json`), JSON.stringify(summary, null, 2));
  console.error("\n==== SUMMARY " + label + " ====");
  console.error(JSON.stringify({ finalStatus: data.status, clips: clips.map((c) => ({ duration: c.duration, model: c.model_name, mv: c.major_model_version, bytes: c.bytes, title: c.title })), costToken, costCnyApprox: summary.balance.costCnyApprox }, null, 2));
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
