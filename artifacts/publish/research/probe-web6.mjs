// T3 只读调研：第六轮——URL 模板与收录页模式验证。
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
async function probe(name, url, max = 500, mustMatch) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    const t = await r.text();
    const title = (t.match(/<title[^>]*>([^<]*)<\/title>/i) ?? [])[1] ?? '';
    let hit = '';
    if (mustMatch) {
      const m = t.match(mustMatch);
      hit = m ? ' | match=' + String(m[0]).slice(0, 160) : ' | NO_MATCH';
    }
    console.log(`${name} | status=${r.status} len=${t.length} | title=${title.slice(0, 90)}${hit}`);
    if (max) console.log('   ' + t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, max));
  } catch (e) { console.log(`${name} | ERROR ${e.message}`); }
}

// skills.sh 官方文档：收录/挂榜规则
for (const p of ['overview', 'customize']) {
  try {
    const r = await fetch(`https://skills.sh/docs/${p}`, { headers: { 'user-agent': UA } });
    const t = await r.text();
    const body = t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(`\n===== skills.sh/docs/${p} status=${r.status} len=${t.length}`);
    for (const kw of ['index', 'submit', 'listed', 'GitHub', 'publish', 'leaderboard']) {
      const idx = body.toLowerCase().indexOf(kw.toLowerCase());
      if (idx >= 0) console.log(`  [${kw}] ...${body.slice(Math.max(0, idx - 120), idx + 260)}...`);
    }
  } catch (e) { console.log(`docs/${p} ERROR ${e.message}`); }
}

console.log('\n===== URL 模板探测 =====');
await probe('dshbase directory', 'https://dshbase.com/plugins/directory/', 300, /href="\/plugins\/[^"]+"/);
await probe('dshbase plugin page guess', 'https://dshbase.com/plugins/kendu76-dsh-music-player/', 300);
await probe('dshmp plugin page guess', 'https://dshmp.com/en/plugins/dsh-music-player', 300);
await probe('skillhub plugin page guess', 'https://skillhub.cn/plugins/kendu76/dsh-music-player', 300);
await probe('skillhub plugin detail api', 'https://api.skillhub.cn/api/v1/plugins/kendu76/dsh-music-player', 300);
await probe('clawhub guide page', 'https://clawhub.ai/luduoxin/skills/skill-publish-guide', 600);
await probe('skills.sh known page', 'https://skills.sh/vercel-labs/agent-skills', 300, /<title[^>]*>([^<]*)<\/title>/);
