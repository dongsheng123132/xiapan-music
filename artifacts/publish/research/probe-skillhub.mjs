// T3 只读调研探针：SkillHub 公开 API（免登录）。不写任何凭据，不发布。
// 用法：node probe-skillhub.mjs
import { writeFileSync } from 'node:fs';

const BASE = 'https://api.skillhub.cn';
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) xiapan-music-research', accept: 'application/json' };

async function getJson(url) {
  const r = await fetch(url, { headers: UA });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { url, status: r.status, len: text.length, json, text };
}

const out = {};
const targets = [];
for (const q of ['music', 'song', 'audio', '音乐', '写歌', 'suno']) {
  targets.push(`/api/v1/plugins?q=${encodeURIComponent(q)}&page=1&page_size=50`);
}
targets.push('/api/v1/plugins?q=music&page=2&page_size=50');
// 可能存在的技能搜索 / 详情端点（探测用）
targets.push('/api/v1/search?q=music&limit=5');
targets.push('/api/v1/skills?q=music&page=1&page_size=5');
targets.push('/api/v1/plugins/yinhcao/yinchao-ai-music-skill');

for (const p of targets) {
  const res = await getJson(BASE + p);
  const key = p.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 80);
  out[key] = { status: res.status, len: res.len, json: res.json, snippet: res.json ? undefined : res.text.slice(0, 300) };
  const j = res.json;
  let extra = '';
  if (j) {
    const items = j.items ?? j.data?.items ?? j.data ?? j.results;
    if (Array.isArray(items)) extra = ` items=${items.length} total=${j.total ?? j.data?.total ?? '?'}`;
    else if (j) extra = ' keys=' + Object.keys(j).join(',');
  }
  console.log(`${p} -> status=${res.status} len=${res.len}${extra}`);
  await new Promise((r) => setTimeout(r, 400));
}

writeFileSync(new URL('./skillhub-plugins-raw.json', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
console.log('saved skillhub-plugins-raw.json');

// 摘要：按 stars 排序打印音乐类插件
const first = out.api_v1_plugins_q_music_page_1_page_size_50_?.json;
const items = first?.items ?? first?.data?.items ?? first?.data ?? [];
if (Array.isArray(items) && items.length) {
  console.log('\n=== q=music items summary ===');
  console.log('fields:', Object.keys(items[0]).join(','));
  const sorted = [...items].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  for (const it of sorted.slice(0, 20)) {
    console.log([it.fullName, 'stars=' + (it.stars ?? '?'), 'cat=' + (it.categoryKey ?? '?'), 'install=' + (it.installability ?? '?'), 'audit=' + (it.contentAuditStatus ?? '?'), 'desc=' + String(it.description ?? '').slice(0, 80)].join(' | '));
  }
} else {
  console.log('\nq=music items not array; inspect raw json');
}
