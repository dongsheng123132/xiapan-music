// T3 只读调研：第五轮——投稿审核规则、SkillHub 技能页数据、skills.sh 页面模式。
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
async function grab(name, url, max = 2000, filter) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    let t = await r.text();
    console.log(`\n===== ${name} status=${r.status} len=${t.length}`);
    if (filter) {
      const lines = t.split(/\r?\n/).filter((l) => filter.test(l));
      t = lines.join('\n');
      console.log(`[filtered lines=${lines.length}]`);
    }
    console.log(t.slice(0, max));
  } catch (e) { console.log(`\n===== ${name} ERROR: ${e.message}`); }
}

// awesome 审核规则后半段
try {
  const r = await fetch('https://raw.githubusercontent.com/awesome-dsh-plugin/awesome-dsh-plugin/main/contributing.md', { headers: { 'user-agent': UA } });
  const md = await r.text();
  const i = md.indexOf('how submissions are reviewed');
  console.log('\n===== awesome contributing: review section =====');
  console.log(md.slice(Math.max(0, i - 200), i + 2600));
} catch (e) { console.log('awesome review ERR ' + e.message); }

await grab('skillhub install doc', 'https://skillhub.cn/install/skillhub.md', 1800);
await grab('skillhub skill page beatra (grep 下载/热度/分类)', 'https://skillhub.cn/skills/@beatra-ai/music-generation-studio', 1600, /下载|热度|收藏|分类|标签|downloads|installs|stars|category/);
await grab('skills.sh vercel-labs/agent-skills page', 'https://skills.sh/vercel-labs/agent-skills', 400);
await grab('skills.sh yinchao page (check listed?)', 'https://skills.sh/yinhcao/yinchao-ai-music-skill', 400);
await grab('skills.sh badge', 'https://skills.sh/b/vercel-labs/skills', 400);
