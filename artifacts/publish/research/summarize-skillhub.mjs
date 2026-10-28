// T3 只读调研：解析 SkillHub 插件 API 原始数据并补拉关键仓库详情。
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('./skillhub-plugins-raw.json', import.meta.url), 'utf8'));
console.log('keys:', Object.keys(raw).join(' | '));
const musicKey = Object.keys(raw).find((k) => k.includes('q_music_page_1'));
const music = raw[musicKey];
const items = music?.json?.items ?? [];
console.log(`\n=== q=music total=${music?.json?.total} items=${items.length}`);
if (items.length) console.log('fields:', Object.keys(items[0]).join(','));

const slim = items.map((it) => ({
  fullName: it.fullName,
  stars: it.stars,
  categoryKey: it.categoryKey,
  installability: it.installability,
  audit: it.contentAuditStatus,
  license: it.license,
  homepage: it.homepage,
  topics: it.topics,
  description: it.description,
  manifestName: it.manifest?.name,
  manifestVersion: it.manifest?.version,
  hasDshBundle: Boolean(it.manifest?.dsh?.bundle),
  hasWebClient: Boolean(it.manifest?.dsh?.client),
}));
slim.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
console.log('\n=== top by stars ===');
for (const it of slim.slice(0, 25)) {
  console.log(`${it.fullName} | stars=${it.stars} | cat=${it.categoryKey} | inst=${it.installability} | audit=${it.audit} | manifest=${it.manifestName}@${it.manifestVersion} | dsh.bundle=${it.hasDshBundle} | web=${it.hasWebClient}`);
  console.log(`    ${String(it.description ?? '').slice(0, 160)}`);
}
console.log('\n=== categoryKey distribution (q=music) ===');
const dist = {};
for (const it of slim) dist[it.categoryKey] = (dist[it.categoryKey] ?? 0) + 1;
console.log(JSON.stringify(dist));

console.log('\n=== suno plugins ===');
const sunoKey = Object.keys(raw).find((k) => k.includes('q_suno'));
for (const it of raw[sunoKey]?.json?.items ?? []) {
  console.log(`${it.fullName} | stars=${it.stars} | cat=${it.categoryKey} | inst=${it.installability} | ${it.description}`);
  console.log(`    homepage=${it.homepage} topics=${JSON.stringify(it.topics)}`);
}

const yin = raw[Object.keys(raw).find((k) => k.includes('plugins_yinhcao'))]?.json;
if (yin) {
  console.log('\n=== yinchao detail ===');
  console.log(JSON.stringify({ fullName: yin.fullName, stars: yin.stars, forks: yin.forks, topics: yin.topics, license: yin.license, categoryKey: yin.categoryKey, installability: yin.installability, audit: yin.contentAuditStatus, homepage: yin.homepage, defaultBranch: yin.defaultBranch, lastSyncedAt: yin.lastSyncedAt, manifestName: yin.manifest?.name, manifestVersion: yin.manifest?.version, keywords: yin.manifest?.keywords, dsh: yin.manifest?.dsh }, null, 2));
  console.log('--- readme head ---\n' + String(yin.readme ?? '').slice(0, 900));
}

// 补拉两个竞品详情
const details = {};
for (const repo of ['kendu76/dsh-music-player', 'yinhcao/yinchao-ai-music-skill']) {
  try {
    const r = await fetch(`https://api.skillhub.cn/api/v1/plugins/${repo}`, { headers: { 'user-agent': 'Mozilla/5.0 research' } });
    const j = await r.json();
    details[repo] = { status: r.status, name: j.manifest?.name, version: j.manifest?.version, stars: j.stars, categoryKey: j.categoryKey, installability: j.installability, audit: j.contentAuditStatus, topics: j.topics, homepage: j.homepage, keywords: j.manifest?.keywords, readmeHead: String(j.readme ?? '').slice(0, 400) };
  } catch (e) { details[repo] = { error: String(e) }; }
}
console.log('\n=== competitor details ===');
console.log(JSON.stringify(details, null, 2));

writeFileSync(new URL('./skillhub-plugins-digest.json', import.meta.url), JSON.stringify({ totalMusic: music?.json?.total, slim, details }, null, 2), 'utf8');
console.log('\nsaved skillhub-plugins-digest.json');
