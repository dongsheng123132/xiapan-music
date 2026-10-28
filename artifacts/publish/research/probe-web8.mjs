// T3 只读调研：第八轮——awesome 目录构建逻辑（是否自动爬 npm/topic）。
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
async function grepRaw(name, url, pattern, maxLines = 40) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    const t = await r.text();
    console.log(`\n===== ${name} status=${r.status} len=${t.length}`);
    const lines = t.split(/\r?\n/);
    let n = 0;
    lines.forEach((l, i) => {
      if (n < maxLines && pattern.test(l)) { console.log(`L${i + 1}: ${l.trim().slice(0, 200)}`); n++; }
    });
    if (n === 0) console.log('(no line matched; head) ' + t.slice(0, 600));
  } catch (e) { console.log(`\n===== ${name} ERROR ${e.message}`); }
}
await grepRaw('awesome build-site.mjs', 'https://raw.githubusercontent.com/awesome-dsh-plugin/awesome-dsh-plugin/main/scripts/build-site.mjs', /npm|topic|dsh-plugin|search|crawl|discover/i, 30);
await grepRaw('awesome workflows list guess', 'https://raw.githubusercontent.com/awesome-dsh-plugin/awesome-dsh-plugin/main/.github/workflows/build.yml', /schedule|cron|npm|node /i, 20);
try {
  const r = await fetch('https://dshmp.com/api/plugins?q=music&limit=3', { headers: { 'user-agent': UA, accept: 'application/json' } });
  const t = await r.text();
  console.log(`\n===== dshmp api retry status=${r.status} len=${t.length}`);
  console.log(t.slice(0, 800));
} catch (e) { console.log('\n===== dshmp api retry ERROR ' + e.message); }
try {
  const r = await fetch('https://clawhub.ai/skills?category=creative', { headers: { 'user-agent': UA } });
  const t = await r.text();
  console.log(`\n===== clawhub creative category status=${r.status} len=${t.length}`);
  const m = t.match(/<title[^>]*>([^<]*)<\/title>/i);
  console.log('title=' + (m ? m[1] : ''));
} catch (e) { console.log('\n===== clawhub creative ERROR ' + e.message); }
