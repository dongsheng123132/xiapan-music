// T3 只读调研：第七轮——dshmp/dshbase 索引与页面 URL、dsh-plugin-catalog 来源。
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
async function j(name, url, max = 900) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
    const t = await r.text();
    console.log(`\n===== ${name} status=${r.status} len=${t.length}`);
    console.log(t.slice(0, max));
  } catch (e) { console.log(`\n===== ${name} ERROR ${e.message}`); }
}
await j('dshmp api plugins music', 'https://dshmp.com/api/plugins?q=music&limit=3', 1200);
await j('dshmp api plugins xiapan', 'https://dshmp.com/api/plugins?q=xiapan', 400);

// dshbase 目录页里的插件页 URL 模板
try {
  const r = await fetch('https://dshbase.com/plugins/directory/', { headers: { 'user-agent': UA } });
  const t = await r.text();
  const hrefs = new Set();
  for (const m of t.matchAll(/href="(\/plugins\/[^"]+)"/g)) hrefs.add(m[1]);
  console.log('\n===== dshbase plugin hrefs (first 25) =====');
  [...hrefs].slice(0, 25).forEach((h) => console.log(h));
} catch (e) { console.log('dshbase ERR ' + e.message); }

// dsh-plugin-catalog 的 readme（说明索引来源）
try {
  const r = await fetch('https://registry.npmjs.org/dsh-plugin-catalog', { headers: { 'user-agent': UA, accept: 'application/json' } });
  const p = await r.json();
  console.log('\n===== dsh-plugin-catalog readme head =====');
  console.log(String(p.readme ?? '(no readme)').slice(0, 1200));
  console.log('latest time:', p.time?.modified, '| versions:', Object.keys(p.versions ?? {}).length);
} catch (e) { console.log('catalog ERR ' + e.message); }
