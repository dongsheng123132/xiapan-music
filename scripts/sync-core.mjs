#!/usr/bin/env node
// 把唯一核心客户端 src/core/xiapan-music.mjs 同步到 skill 自包含目录：
//   skills/xiapan-music/scripts/lib/xiapan-music.mjs
// 目标文件头部写入源文件 sha256 + 生成时间；--check 只校验不写盘。
//
// 用法：
//   node scripts/sync-core.mjs           # 同步（写盘）
//   node scripts/sync-core.mjs --check   # 校验（不一致 exit 1）
//   node scripts/sync-core.mjs --json    # 机器可读输出
//
// 退出码：0 = 一致/同步成功；1 = 不一致（--check）；2 = 用法/IO 错误。

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "src", "core", "xiapan-music.mjs");
const TARGET = join(ROOT, "skills", "xiapan-music", "scripts", "lib", "xiapan-music.mjs");
const HASH_LINE = /^\/\/ @generated sha256: ([0-9a-f]{64})$/m;
const HEADER_END = "// @generated end\n\n";
const EXPECTED_EXPORTS = [
  "API_BASE",
  "DEFAULT_MV",
  "DEFAULT_TEXT_MODEL",
  "DEFAULT_BGM_MODEL",
  "DEFAULT_TAGS",
  "COST_HINT",
  "CTA",
  "XiapanMusicError",
  "maskKey",
  "normalizeMediaUrl",
  "resolveKey",
  "queryBalance",
  "writeLyrics",
  "parseLyricsJson",
  "submitSong",
  "normalizeClips",
  "waitSong",
  "downloadClip",
  "generateSong",
  "generateBgm",
  "buildNextSteps",
  "rechargeUrlWithKey",
  "defaultSongOutDir",
  "looksLikeLyrics",
  "isUsableLyrics",
  "SUNO_TASK_STATUS",
  "fileSize",
];

function fail(message, code = 2) {
  process.stderr.write(`sync-core: ${message}\n`);
  process.exit(code);
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function renderGenerated(sourceText, hash) {
  const header = [
    "// AUTO-GENERATED FILE — 不要手改这个文件。",
    "// 源文件：src/core/xiapan-music.mjs（唯一真相源）",
    `// @generated sha256: ${hash}`,
    `// @generated at: ${new Date().toISOString()}`,
    "// 同步命令：node scripts/sync-core.mjs（校验：node scripts/sync-core.mjs --check）",
    "// @generated end",
    "",
    "",
  ].join("\n");
  return header + sourceText;
}

async function assertExports(file) {
  const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  const missing = EXPECTED_EXPORTS.filter((name) => !(name in mod));
  if (missing.length) {
    throw new Error(`导出缺失：${missing.join(", ")}`);
  }
  return mod;
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const json = args.includes("--json");

  if (!existsSync(SOURCE)) fail(`源文件不存在：${SOURCE}`);
  const sourceText = readFileSync(SOURCE, "utf8");
  const hash = sha256(sourceText);
  const rendered = renderGenerated(sourceText, hash);

  if (check) {
    if (!existsSync(TARGET)) {
      report({ ok: false, check: true, reason: "target_missing", target: relative(ROOT, TARGET) }, json);
      process.exit(1);
    }
    const targetText = readFileSync(TARGET, "utf8");
    const m = targetText.match(HASH_LINE);
    const recorded = m ? m[1] : null;
    const idx = targetText.indexOf(HEADER_END);
    const body = idx >= 0 ? targetText.slice(idx + HEADER_END.length) : targetText;
    let same = recorded === hash && sha256(body) === hash;
    try {
      await assertExports(TARGET);
    } catch (err) {
      same = false;
      report({ ok: false, check: true, reason: `exports_invalid: ${err.message}`, target: relative(ROOT, TARGET) }, json);
      process.exit(1);
    }
    if (!same) {
      report({ ok: false, check: true, reason: "out_of_sync", sourceHash: hash, recordedHash: recorded, source: relative(ROOT, SOURCE), target: relative(ROOT, TARGET) }, json);
      process.exit(1);
    }
    report({ ok: true, check: true, sourceHash: hash, source: relative(ROOT, SOURCE), target: relative(ROOT, TARGET) }, json);
    return;
  }

  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, rendered, "utf8");
  try {
    await assertExports(TARGET);
  } catch (err) {
    fail(`同步后自检失败：${err.message}`, 1);
  }
  report({ ok: true, check: false, sourceHash: hash, source: relative(ROOT, SOURCE), target: relative(ROOT, TARGET), exports: EXPECTED_EXPORTS.length }, json);
}

function report(obj, json) {
  if (json) {
    process.stdout.write(JSON.stringify(obj) + "\n");
  } else if (obj.ok) {
    process.stdout.write(`sync-core: OK ${obj.check ? "(check)" : "synced"} ${obj.target} sha256=${obj.sourceHash}\n`);
  } else {
    process.stderr.write(`sync-core: FAIL ${JSON.stringify(obj)}\n`);
  }
}

main().catch((err) => fail(err && err.stack ? err.stack : String(err), 2));
