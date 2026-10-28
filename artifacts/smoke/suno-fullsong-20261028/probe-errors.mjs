// 免费探测错误形态（不提交付费任务）：坏 Key / bogus task / 无 Key。
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const B = "https://api.u-claw.org.cn";
const good = JSON.parse(readFileSync(join(homedir(), ".uking", "device.json"), "utf8")).key;
const bogus = "sk-invalid-" + "0".repeat(64);

async function show(tag, p) {
  try {
    const r = await p;
    const tx = await r.text();
    console.log(tag, "HTTP", r.status, tx.slice(0, 400));
  } catch (e) {
    console.log(tag, "ERR", e.message);
  }
}

await show("badkey /suno/fetch/task_bogus", fetch(`${B}/suno/fetch/task_bogus`, { headers: { Authorization: `Bearer ${bogus}` } }));
await show("badkey /v1/dashboard/billing/subscription", fetch(`${B}/v1/dashboard/billing/subscription`, { headers: { Authorization: `Bearer ${bogus}` } }));
await show("badkey POST /suno/submit/music", fetch(`${B}/suno/submit/music`, {
  method: "POST",
  headers: { Authorization: `Bearer ${bogus}`, "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "x", tags: "y", mv: "chirp-v5-5", title: "t" }),
}));
await show("goodkey /suno/fetch/task_bogus", fetch(`${B}/suno/fetch/task_bogus`, { headers: { Authorization: `Bearer ${good}` } }));
await show("goodkey POST /suno/fetch (empty body)", fetch(`${B}/suno/fetch`, { method: "POST", headers: { Authorization: `Bearer ${good}`, "Content-Type": "application/json" }, body: "{}" }));
await show("nokey /suno/fetch/task_bogus", fetch(`${B}/suno/fetch/task_bogus`));
await show("goodkey /v1/models? no", fetch(`${B}/v1/models`, { headers: { Authorization: `Bearer ${good}` } }));
