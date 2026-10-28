// T3 只读调研：第四轮——收录规则原文（awesome contributing / skills CLI README）+ ClawHub 网页发布页 + SkillHub 技能页 URL。
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
async function grab(name, url, max = 2500, filter) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    let t = await r.text();
    console.log(`\n===== ${name} (${url}) status=${r.status} len=${t.length}`);
    if (filter) {
      const lines = t.split(/\r?\n/).filter((l) => filter.test(l));
      t = lines.join('\n');
      console.log(`[filtered lines=${lines.length}]`);
    }
    console.log(t.slice(0, max));
  } catch (e) { console.log(`\n===== ${name} ERROR: ${e.message}`); }
}

await grab('awesome contributing', 'https://raw.githubusercontent.com/awesome-dsh-plugin/awesome-dsh-plugin/main/contributing.md', 3000);
await grab('skills CLI README (index/repo part)', 'https://raw.githubusercontent.com/vercel-labs/skills/main/README.md', 2500);
await grab('skillhub skill page', 'https://api.skillhub.cn/beatra-ai/music-generation-studio', 800);
await grab('skillhub skill page 2', 'https://skillhub.cn/skills/@beatra-ai/music-generation-studio', 600);
await grab('clawhub publish page', 'https://clawhub.ai/skills/publish', 1200);
await grab('clawhub skills list music', 'https://clawhub.ai/skills?q=music', 600);
await grab('clawhub skill detail yinchao', 'https://clawhub.ai/skills/yinchao-ai-music', 600);
await grab('dsh-plugin-catalog npm', 'https://registry.npmjs.org/dsh-plugin-catalog', 1200);
