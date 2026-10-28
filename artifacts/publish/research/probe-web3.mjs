// T3 只读调研：第三轮——skills.sh 索引方式、awesome 收录入口。
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
async function show(name, url, max = 900) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/json' }, redirect: 'follow' });
    const t = await r.text();
    console.log(`\n===== ${name} status=${r.status} ct=${r.headers.get('content-type')} len=${t.length}`);
    console.log(t.slice(0, max).replace(/\s+/g, ' '));
  } catch (e) { console.log(`\n===== ${name} ERROR: ${e.message}`); }
}

// awesome 首页里的提交/收录入口链接
try {
  const r = await fetch('https://awesome-dsh-plugin.com/', { headers: { 'user-agent': UA } });
  const html = await r.text();
  const hrefs = new Set();
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{0,80}?)<\/a>/gi)) {
    if (/submit|github|npm|index\.json|about|download/i.test(m[1]) || /Submit|GitHub|npm/i.test(m[2])) hrefs.add(`${m[1]} :: ${m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)}`);
  }
  console.log('\n===== awesome-dsh-plugin links =====');
  [...hrefs].slice(0, 30).forEach((h) => console.log(h));
} catch (e) { console.log('awesome links ERROR ' + e.message); }

await show('skills.sh page yinhcao', 'https://skills.sh/yinhcao/yinchao-ai-music-skill', 600);
await show('skills.sh api search', 'https://skills.sh/api/v1/search?q=music', 600);
await show('skills.sh api skills', 'https://skills.sh/api/v1/skills?q=music', 600);
await show('skills.sh page vercel pack', 'https://skills.sh/p/vercel-labs-agent-skills', 400);
