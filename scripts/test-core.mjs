// 虾盘云音乐核心客户端 · 单元测试（node --test，假 fetch，零网络、零扣费）
//
// 运行：node --test scripts/test-core.mjs
//    或 repo 根：node --test scripts/

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COST_HINT,
  XiapanMusicError,
  buildNextSteps,
  downloadClip,
  generateBgm,
  generateSong,
  isUsableLyrics,
  looksLikeLyrics,
  maskKey,
  normalizeClips,
  normalizeMediaUrl,
  parseLyricsJson,
  queryBalance,
  rechargeUrlWithKey,
  resolveKey,
  submitSong,
  waitSong,
  writeLyrics,
} from "../src/core/xiapan-music.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEST_KEY = "sk-test-ONLY-fake-key-1234567890abcdef";
const TMP = mkdtempSync(join(tmpdir(), "xiapan-test-"));

// ---------------------------------------------------------------------------
// fake fetch 工具
// ---------------------------------------------------------------------------

function jsonRes(status, body) {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    arrayBuffer: async () => Buffer.from(text),
  };
}

function bytesRes(buf, status = 200) {
  return { ok: status >= 200 && status < 300, status, arrayBuffer: async () => buf };
}

/**
 * @param {Array<{match:(url:string,method:string)=>boolean, respond:(url:string,method:string,init:object,n:number)=>any}>} routes
 */
function makeFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const u = String(url);
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: u, method, body, headers: init.headers || {} });
    for (const route of routes) {
      if (route.match(u, method)) return route.respond(u, method, init, calls.length);
    }
    throw new Error(`unexpected fetch ${method} ${u}`);
  };
  fn.calls = calls;
  return fn;
}

function okSubmitResponder(taskId = "task_TEST123") {
  return () => jsonRes(200, { code: "success", data: taskId });
}

const SAMPLE_CLIP = {
  clip_id: "clip-1",
  title: "测试歌",
  duration: 131.36,
  model_name: "chirp-hawk",
  major_model_version: "v6",
  audio_url: "https://media.u-claw.org.cn/media/x/abc/one.mp3",
  image_url: "https://media.u-claw.org.cn/media/x/abc/one.jpeg",
  status: "complete",
};

const SAMPLE_LYRICS = `[Verse 1]
路灯把影子拉得很长
末班车开过空空的街
我把没说完的那些话
折成一只纸船放进夜色里

[Pre-Chorus]
风掀起衣角也掀起旧事
谁没有过咬着牙的日子

[Chorus]
晚风会替我把答案吹来
那些绕远的路都不算白走
晚风会替我把答案吹来
等天亮了我就往前再走一步

[Outro]
等天亮了
我就往前再走一步`;

// ---------------------------------------------------------------------------
// 1. 小工具 / Key 解析 / CTA
// ---------------------------------------------------------------------------

test("maskKey 只暴露前 8 位", () => {
  assert.equal(maskKey("sk-1234567890"), "sk-12345…");
  assert.equal(maskKey(""), "");
  assert.equal(maskKey("short"), "sh…");
});

test("normalizeMediaUrl 把 api.u-claw.org 改成 .cn", () => {
  assert.equal(normalizeMediaUrl("https://api.u-claw.org/media/a.mp3"), "https://api.u-claw.org.cn/media/a.mp3");
  assert.equal(normalizeMediaUrl("https://media.u-claw.org.cn/x.mp3"), "https://media.u-claw.org.cn/x.mp3");
  assert.equal(normalizeMediaUrl(""), "");
});

test("buildNextSteps 带 UTM，默认不含 Key", () => {
  const steps = buildNextSteps({ source: "clawhub", key: TEST_KEY });
  assert.match(steps.board, /^https:\/\/tu\.u-claw\.org\.cn\/\?utm_source=clawhub&utm_medium=skill&utm_campaign=xiapan-music$/);
  assert.match(steps.registerKey, /utm_source=clawhub/);
  assert.match(steps.recharge, /utm_source=clawhub/);
  const serialized = JSON.stringify(steps);
  assert.ok(!serialized.includes(TEST_KEY), "默认 CTA 不得包含完整 Key");
});

test("buildNextSteps：环境变量覆盖 source/medium（DSH 插件场景）", () => {
  const steps = buildNextSteps({ env: { XIAPAN_UTM_SOURCE: "dsh", XIAPAN_UTM_MEDIUM: "plugin" } });
  assert.match(steps.board, /utm_source=dsh&utm_medium=plugin&utm_campaign=xiapan-music/);
  assert.match(steps.recharge, /utm_medium=plugin/);
  assert.deepEqual(steps.utm, { source: "dsh", medium: "plugin", campaign: "xiapan-music" });
  // 显式入参优先于 env
  const explicit = buildNextSteps({ source: "clawhub", medium: "skill", env: { XIAPAN_UTM_SOURCE: "dsh", XIAPAN_UTM_MEDIUM: "plugin" } });
  assert.match(explicit.board, /utm_source=clawhub&utm_medium=skill/);
});

test("buildNextSteps：UTM 参数清洗，Key 不会透传进链接", () => {
  const steps = buildNextSteps({ source: "sk-SECRET-abcdef//?x=1", medium: "P LUGIN!", env: {} });
  assert.equal(steps.utm.source, "sk-secret-abcdefx1");
  assert.equal(steps.utm.medium, "plugin");
  assert.ok(!steps.board.includes("sk-SECRET"), "UTM 只保留安全字符，不得原样透传");
});
test("rechargeUrlWithKey 只给用户本人的充值直达链接", () => {
  const url = rechargeUrlWithKey(TEST_KEY, "cli");
  assert.match(url, /^https:\/\/api\.u-claw\.org\.cn\/recharge\?/);
  assert.match(url, /key=sk-test-ONLY/);
  assert.match(url, /utm_campaign=xiapan-music/);
});

test("resolveKey：显式 key > env > device.json", () => {
  assert.equal(resolveKey({ key: " sk-explicit-1234567890 ", env: { XIAPAN_API_KEY: "sk-env-1234567890" } }), "sk-explicit-1234567890");
  assert.equal(resolveKey({ env: { XIAPAN_API_KEY: "sk-env-1234567890" } }), "sk-env-1234567890");
  const deviceFile = join(TMP, "device.json");
  writeFileSync(deviceFile, JSON.stringify({ key: "sk-device-1234567890" }));
  assert.equal(resolveKey({ env: {}, deviceFile }), "sk-device-1234567890");
});

test("resolveKey：都没有时抛 BAD_KEY，且提示不包含凭据", () => {
  assert.throws(
    () => resolveKey({ env: {}, deviceFile: join(TMP, "missing-device.json") }),
    (err) => err instanceof XiapanMusicError && err.code === "BAD_KEY" && /XIAPAN_API_KEY/.test(err.message),
  );
});

test("resolveKey：占位符 Key 视为未配置", () => {
  assert.throws(() => resolveKey({ env: { XIAPAN_API_KEY: "your-key-here" }, deviceFile: join(TMP, "nope.json") }), /找不到虾盘云 API Key/);
});

// ---------------------------------------------------------------------------
// 2. 歌词解析 / 判定
// ---------------------------------------------------------------------------

test("parseLyricsJson 容错：纯 JSON / 代码围栏 / 前后废话", () => {
  const obj = { title: "晚风", tags: "Mandarin folk, 96 BPM", lyrics: SAMPLE_LYRICS };
  assert.deepEqual(parseLyricsJson(JSON.stringify(obj)), obj);

  const fenced = "```json\n" + JSON.stringify(obj) + "\n```";
  assert.equal(parseLyricsJson(fenced).title, "晚风");

  const chatty = `好的，这是歌词：\n${JSON.stringify(obj)}\n希望你喜欢！`;
  assert.equal(parseLyricsJson(chatty).lyrics, SAMPLE_LYRICS);
});

test("parseLyricsJson 无法解析时抛 BAD_REQUEST", () => {
  assert.throws(() => parseLyricsJson("抱歉我写不出来"), (err) => err.code === "BAD_REQUEST");
  assert.throws(() => parseLyricsJson(""), (err) => err.code === "BAD_REQUEST");
});

test("looksLikeLyrics / isUsableLyrics：一句风格描述不能当歌词", () => {
  assert.equal(looksLikeLyrics("轻快的城市流行歌曲，关于深夜便利店和温柔相遇"), false);
  assert.equal(looksLikeLyrics(SAMPLE_LYRICS), true);
  assert.equal(isUsableLyrics(SAMPLE_LYRICS), true);
  assert.equal(isUsableLyrics("轻快的城市流行歌曲"), false);
  assert.equal(isUsableLyrics(SAMPLE_LYRICS.slice(0, 60)), false);
});

// ---------------------------------------------------------------------------
// 3. 余额
// ---------------------------------------------------------------------------

test("queryBalance：按 PLAN 公式换算 token 与人民币", async () => {
  const fetchImpl = makeFetch([
    { match: (u) => u.includes("/v1/dashboard/billing/subscription"), respond: () => jsonRes(200, { hard_limit_usd: 100 }) },
    { match: (u) => u.includes("/v1/dashboard/billing/usage"), respond: () => jsonRes(200, { total_usage: 250 }) },
  ]);
  const b = await queryBalance(TEST_KEY, { fetchImpl });
  assert.equal(b.totalToken, 50_000_000);
  assert.equal(b.usedToken, 1_250_000);
  assert.equal(b.remainToken, 48_750_000);
  assert.equal(b.remainCny, 97.5);
  assert.equal(fetchImpl.calls[0].headers.Authorization, `Bearer ${TEST_KEY}`);
});

// ---------------------------------------------------------------------------
// 4. 写歌词
// ---------------------------------------------------------------------------

test("writeLyrics：请求体关闭 thinking，解析出结构化歌词", async () => {
  const content = JSON.stringify({ title: "晚风里的答案", tags: "Mandarin folk pop, 96 BPM, warm male vocal", lyrics: SAMPLE_LYRICS });
  const fetchImpl = makeFetch([
    { match: (u, m) => m === "POST" && u.endsWith("/v1/chat/completions"), respond: () => jsonRes(200, { choices: [{ message: { content }, finish_reason: "stop" }] }) },
  ]);
  const r = await writeLyrics({ theme: "深夜回家", style: "民谣", language: "zh" }, TEST_KEY, { fetchImpl });
  assert.equal(r.title, "晚风里的答案");
  assert.match(r.tags, /Mandarin/);
  assert.equal(r.lyrics, SAMPLE_LYRICS);
  const body = fetchImpl.calls[0].body;
  assert.equal(body.model, "deepseek-v4-flash");
  assert.deepEqual(body.thinking, { type: "disabled" });
  assert.match(body.messages[1].content, /深夜回家/);
});

test("writeLyrics：歌词不合格时免费重试一次（文本模型不涉及扣费）", async () => {
  let call = 0;
  const fetchImpl = makeFetch([
    {
      match: (u, m) => m === "POST" && u.endsWith("/v1/chat/completions"),
      respond: () => {
        call += 1;
        const content = call === 1
          ? JSON.stringify({ title: "短", tags: "pop", lyrics: "只有一句" })
          : JSON.stringify({ title: "长歌", tags: "Mandarin pop, 96 BPM", lyrics: SAMPLE_LYRICS });
        return jsonRes(200, { choices: [{ message: { content } }] });
      },
    },
  ]);
  const r = await writeLyrics({ theme: "测试" }, TEST_KEY, { fetchImpl });
  assert.equal(r.title, "长歌");
  assert.equal(fetchImpl.calls.length, 2);
});

// ---------------------------------------------------------------------------
// 5. 提交出歌
// ---------------------------------------------------------------------------

test("submitSong：body 结构正确，返回 taskId", async () => {
  const fetchImpl = makeFetch([
    { match: (u, m) => m === "POST" && u.endsWith("/suno/submit/music"), respond: okSubmitResponder("task_ABC") },
  ]);
  const r = await submitSong({ prompt: SAMPLE_LYRICS, title: "晚风", tags: "Mandarin folk, 96 BPM", mv: "chirp-v5-5" }, TEST_KEY, { fetchImpl });
  assert.deepEqual(r, { taskId: "task_ABC", mv: "chirp-v5-5" });
  const body = fetchImpl.calls[0].body;
  assert.equal(body.prompt, SAMPLE_LYRICS);
  assert.equal(body.tags, "Mandarin folk, 96 BPM");
  assert.equal(body.title, "晚风");
  assert.equal(body.mv, "chirp-v5-5");
  assert.equal(body.make_instrumental, undefined);
});

test("submitSong：纯音乐带 make_instrumental 且 prompt 允许是风格描述", async () => {
  const fetchImpl = makeFetch([{ match: () => true, respond: okSubmitResponder() }]);
  await submitSong({ prompt: "轻快钢琴", instrumental: true }, TEST_KEY, { fetchImpl, requireLyrics: true });
  assert.equal(fetchImpl.calls[0].body.make_instrumental, true);
});

test("submitSong：requireLyrics 时拒绝一句风格描述（不发请求、不扣费）", async () => {
  const fetchImpl = makeFetch([{ match: () => true, respond: okSubmitResponder() }]);
  await assert.rejects(
    () => submitSong({ prompt: "轻快的城市流行歌曲，关于深夜便利店" }, TEST_KEY, { fetchImpl, requireLyrics: true }),
    (err) => err.code === "BAD_REQUEST" && /writeLyrics/.test(err.message),
  );
  assert.equal(fetchImpl.calls.length, 0);
});

test("submitSong：2xx 但无 task_id 报 BAD_REQUEST 且提示不要自动重试", async () => {
  const fetchImpl = makeFetch([{ match: () => true, respond: () => jsonRes(200, { code: "success", data: null }) }]);
  await assert.rejects(
    () => submitSong({ prompt: SAMPLE_LYRICS }, TEST_KEY, { fetchImpl }),
    (err) => err.code === "BAD_REQUEST" && /不要自动重试/.test(err.message),
  );
});

test("submitSong：错误分类 401/402/429/500/网络异常，且不泄漏 Key", async () => {
  const cases = [
    [401, { error: { message: "Invalid token (request id: abc)", type: "new_api_error" } }, "BAD_KEY"],
    [402, { error: { type: "insufficient_quota", message: "余额不足" } }, "NO_BALANCE"],
    [429, { error: { message: "rate limit" } }, "RATE_LIMIT"],
    [500, { error: { message: "upstream error" } }, "NETWORK"],
    [400, { error: { message: "bad request" } }, "BAD_REQUEST"],
  ];
  for (const [status, body, code] of cases) {
    const fetchImpl = makeFetch([{ match: () => true, respond: () => jsonRes(status, body) }]);
    await assert.rejects(
      () => submitSong({ prompt: SAMPLE_LYRICS }, TEST_KEY, { fetchImpl }),
      (err) => {
        assert.equal(err.code, code, `HTTP ${status} 应映射为 ${code}`);
        assert.ok(!JSON.stringify({ message: err.message, details: err.details }).includes(TEST_KEY), "错误内容不得包含完整 Key");
        return true;
      },
    );
  }
  const netFetch = async () => {
    throw new Error("ECONNRESET");
  };
  await assert.rejects(() => submitSong({ prompt: SAMPLE_LYRICS }, TEST_KEY, { fetchImpl: netFetch }), (err) => err.code === "NETWORK");
});

test("submitSong：付费提交永不自动重试（一次请求一次扣费）", async () => {
  const fetchImpl = makeFetch([{ match: () => true, respond: () => jsonRes(500, { error: { message: "boom" } }) }]);
  await assert.rejects(() => submitSong({ prompt: SAMPLE_LYRICS }, TEST_KEY, { fetchImpl }));
  assert.equal(fetchImpl.calls.length, 1);
});

// ---------------------------------------------------------------------------
// 6. 轮询状态机
// ---------------------------------------------------------------------------

function fetchSequence(responses) {
  let i = 0;
  return makeFetch([
    {
      match: (u) => u.includes("/suno/fetch/"),
      respond: () => responses[Math.min(i++, responses.length - 1)],
    },
  ]);
}

test("waitSong：SUBMITTED → IN_PROGRESS → SUCCESS，返回 2 首完整 clip", async () => {
  const fetchImpl = fetchSequence([
    jsonRes(200, { code: "success", data: { status: "SUBMITTED", progress: "0%", data: [] } }),
    jsonRes(200, { code: "success", data: { status: "IN_PROGRESS", progress: "40%", data: [] } }),
    jsonRes(200, { code: "success", data: { status: "SUCCESS", progress: "100%", data: [SAMPLE_CLIP, { ...SAMPLE_CLIP, clip_id: "clip-2", audio_url: "https://media.u-claw.org.cn/media/x/abc/two.mp3", duration: 131.16 }] } }),
  ]);
  const progress = [];
  const r = await waitSong("task_1", {
    key: TEST_KEY,
    fetchImpl,
    intervalMs: 5,
    minIntervalMs: 1,
    onProgress: (p) => progress.push(p.status),
  });
  assert.equal(r.status, "completed");
  assert.equal(r.clips.length, 2);
  assert.equal(r.clips[0].duration, 131.36);
  assert.equal(r.clips[0].model, "chirp-hawk");
  assert.equal(r.clips[0].mv, "v6");
  assert.equal(r.clips[1].clipId, "clip-2");
  assert.deepEqual(progress, ["SUBMITTED", "IN_PROGRESS", "SUCCESS"]);
});

test("waitSong：FAILURE 抛 TASK_FAILED", async () => {
  const fetchImpl = fetchSequence([jsonRes(200, { code: "success", data: { status: "FAILURE", fail_reason: "歌词不合法" } })]);
  await assert.rejects(
    () => waitSong("task_1", { key: TEST_KEY, fetchImpl, intervalMs: 5, minIntervalMs: 1 }),
    (err) => err.code === "TASK_FAILED" && /歌词不合法/.test(err.message),
  );
});

test("waitSong：task_not_found 宽限期内重试，之后成功", async () => {
  let n = 0;
  const fetchImpl = makeFetch([
    {
      match: (u) => u.includes("/suno/fetch/"),
      respond: () => {
        n += 1;
        if (n <= 2) return jsonRes(404, { code: "task_not_found", data: null, message: "Task not found" });
        return jsonRes(200, { code: "success", data: { status: "SUCCESS", data: [SAMPLE_CLIP] } });
      },
    },
  ]);
  const r = await waitSong("task_1", { key: TEST_KEY, fetchImpl, intervalMs: 5, minIntervalMs: 1 });
  assert.equal(r.clips.length, 1);
  assert.equal(n, 3);
});

test("waitSong：超时抛 TIMEOUT", async () => {
  const fetchImpl = fetchSequence([jsonRes(200, { code: "success", data: { status: "IN_PROGRESS", data: [] } })]);
  await assert.rejects(
    () => waitSong("task_1", { key: TEST_KEY, fetchImpl, intervalMs: 10, minIntervalMs: 5, timeoutMs: 60 }),
    (err) => err.code === "TIMEOUT" && err.details.taskId === "task_1",
  );
});

test("waitSong：轮询网络错误可重试（非付费提交）", async () => {
  let n = 0;
  const fetchImpl = makeFetch([
    {
      match: (u) => u.includes("/suno/fetch/"),
      respond: () => {
        n += 1;
        if (n === 1) throw new Error("ECONNRESET");
        return jsonRes(200, { code: "success", data: { status: "SUCCESS", data: [SAMPLE_CLIP] } });
      },
    },
  ]);
  const r = await waitSong("task_1", { key: TEST_KEY, fetchImpl, intervalMs: 5, minIntervalMs: 1 });
  assert.equal(r.clips.length, 1);
});

// ---------------------------------------------------------------------------
// 7. clip 归一化 / 下载
// ---------------------------------------------------------------------------

test("normalizeClips：过滤无 audio_url 的条目并改写域名", () => {
  const clips = normalizeClips([
    { audio_url: "https://api.u-claw.org/media/a.mp3", duration: "10.5", clip_id: "a", title: " A " },
    { audio_url: null },
    null,
    { audio_url: "https://media.u-claw.org.cn/b.mp3", clip_id: "b" },
  ]);
  assert.equal(clips.length, 2);
  assert.equal(clips[0].audioUrl, "https://api.u-claw.org.cn/media/a.mp3");
  assert.equal(clips[0].duration, 10.5);
  assert.equal(clips[1].clipId, "b");
});

test("downloadClip：落盘并返回字节数；过小视为失败", async () => {
  const buf = Buffer.alloc(4096, 7);
  const fetchImpl = makeFetch([{ match: (u) => u.endsWith(".mp3"), respond: () => bytesRes(buf) }]);
  const out = join(TMP, "nested", "dir", "clip.mp3");
  const saved = await downloadClip("https://media.u-claw.org.cn/media/x/c.mp3", out, { fetchImpl });
  assert.equal(saved.bytes, 4096);
  assert.equal(readFileSync(out).length, 4096);
  assert.ok(existsSync(saved.file));

  const tinyFetch = makeFetch([{ match: () => true, respond: () => bytesRes(Buffer.alloc(10)) }]);
  await assert.rejects(() => downloadClip("https://media.u-claw.org.cn/x.mp3", join(TMP, "tiny.mp3"), { fetchImpl: tinyFetch }), (err) => err.code === "NETWORK");
});

// ---------------------------------------------------------------------------
// 8. 高层编排：generateSong / generateBgm
// ---------------------------------------------------------------------------

test("generateSong：先写词再提交，prompt 必须是完整歌词；产物落盘", async () => {
  const outDir = join(TMP, "songs");
  const content = JSON.stringify({ title: "晚风里的答案", tags: "Mandarin folk pop, 96 BPM", lyrics: SAMPLE_LYRICS });
  let submittedBody = null;
  const fetchImpl = makeFetch([
    { match: (u, m) => m === "POST" && u.endsWith("/v1/chat/completions"), respond: () => jsonRes(200, { choices: [{ message: { content } }] }) },
    {
      match: (u, m) => m === "POST" && u.endsWith("/suno/submit/music"),
      respond: (u, m, init) => {
        submittedBody = JSON.parse(init.body);
        return jsonRes(200, { code: "success", data: "task_GEN" });
      },
    },
    { match: (u) => u.includes("/suno/fetch/"), respond: () => jsonRes(200, { code: "success", data: { status: "SUCCESS", data: [SAMPLE_CLIP] } }) },
    { match: (u) => u.includes("media.u-claw.org.cn"), respond: () => bytesRes(Buffer.alloc(2048, 1)) },
  ]);
  const r = await generateSong({ theme: "深夜回家", outDir, source: "github" }, TEST_KEY, { fetchImpl, intervalMs: 5, minIntervalMs: 1 });
  assert.equal(r.ok, true);
  assert.equal(submittedBody.prompt, SAMPLE_LYRICS, "提交的 prompt 必须是生成的完整歌词，不是一句描述");
  assert.equal(submittedBody.tags, "Mandarin folk pop, 96 BPM");
  assert.equal(submittedBody.title, "晚风里的答案");
  assert.equal(r.songs.length, 1);
  assert.ok(existsSync(r.songs[0].file));
  assert.equal(r.songs[0].duration, 131.36);
  assert.match(r.costHint, /¥2\.4/);
  assert.match(r.nextSteps.board, /utm_source=github/);
  assert.equal(r.provider.taskId, "task_GEN");
});

test("generateSong：传入的 lyrics 是风格描述时拒绝付费提交", async () => {
  const fetchImpl = makeFetch([{ match: () => true, respond: okSubmitResponder() }]);
  await assert.rejects(
    () => generateSong({ lyrics: "轻快的城市流行歌" }, TEST_KEY, { fetchImpl }),
    (err) => err.code === "BAD_REQUEST" && fetchImpl.calls.length === 0,
  );
});

test("generateBgm：提交 → 轮询 → content 落盘", async () => {
  const outFile = join(TMP, "bgm", "bgm-test.mp3");
  let submitted = null;
  let polled = 0;
  const fetchImpl = makeFetch([
    {
      match: (u, m) => m === "POST" && u.endsWith("/v1/music/generations"),
      respond: (u, m, init) => {
        submitted = JSON.parse(init.body);
        return jsonRes(200, { id: "music_1", status: "QUEUED" });
      },
    },
    {
      match: (u) => u.endsWith("/v1/music/generations/music_1"),
      respond: () => {
        polled += 1;
        return jsonRes(200, polled === 1 ? { status: "RUNNING" } : { status: "COMPLETED" });
      },
    },
    { match: (u) => u.endsWith("/v1/music/generations/music_1/content"), respond: () => bytesRes(Buffer.alloc(3000, 2)) },
  ]);
  const r = await generateBgm({ prompt: "轻快钢琴", outFile, idempotencyKey: "idem-1" }, TEST_KEY, { fetchImpl, intervalMs: 5, minIntervalMs: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.taskId, "music_1");
  assert.equal(r.model, "minimax-music-v2.6");
  assert.equal(submitted.idempotency_key, "idem-1");
  assert.ok(existsSync(r.file));
  assert.equal(r.bytes, 3000);
  assert.match(r.costHint, /¥1/);
});

test("COST_HINT 与真机实测一致（¥2.4/次，2 首）", () => {
  assert.match(COST_HINT.song, /¥2\.4/);
  assert.match(COST_HINT.song, /2 首/);
});

// ---------------------------------------------------------------------------
// 9. skill 自包含拷贝与源文件一致（等价于 sync-core --check）
// ---------------------------------------------------------------------------

test("skill 里的 core 拷贝与源文件 sha256 一致（自包含不被手改）", () => {
  const sourceFile = join(ROOT, "src", "core", "xiapan-music.mjs");
  const targetFile = join(ROOT, "skills", "xiapan-music", "scripts", "lib", "xiapan-music.mjs");
  const sourceText = readFileSync(sourceFile, "utf8");
  const targetText = readFileSync(targetFile, "utf8");
  const hash = createHash("sha256").update(sourceText, "utf8").digest("hex");
  assert.match(targetText, new RegExp(`@generated sha256: ${hash}`), "拷贝头部 sha256 应与源文件一致（不一致请跑 node scripts/sync-core.mjs）");
  const marker = "// @generated end\n\n";
  const idx = targetText.indexOf(marker);
  assert.ok(idx >= 0, "拷贝缺少 @generated end 标记");
  const body = targetText.slice(idx + marker.length);
  assert.equal(createHash("sha256").update(body, "utf8").digest("hex"), hash, "拷贝正文必须与源文件逐字一致");
});
