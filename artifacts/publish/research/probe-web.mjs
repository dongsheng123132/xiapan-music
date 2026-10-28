// T3 只读调研：抓取外站页面（经 env 代理），抽取标题/关键信息，不回显任何凭据。
const targets = [
  ['skills.sh-home', 'https://skills.sh/'],
  ['skills.sh-docs', 'https://skills.sh/docs'],
  ['skills.sh-about', 'https://skills.sh/about'],
  ['skills.sh-publish', 'https://skills.sh/publish'],
  ['awesome-yinchao', 'https://awesome-dsh-plugin.com/p/yinhcao/yinchao-ai-music-skill/'],
  ['awesome-home', 'https://awesome-dsh-plugin.com/'],
  ['dsh-market-page', 'https://carrojer0011.github.io/dsh-plugin-hub/plugin/dsh-market.html'],
  ['dshbase-plugins', 'https://dshbase.com/plugins/'],
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
for (const [name, url] of targets) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    const t = await r.text();
    const title = (t.match(/<title[^>]*>([^<]*)<\/title>/i) ?? [])[1] ?? '';
    const desc = (t.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) ?? [])[1] ?? '';
    // 去脚本/样式后取正文
    const body = t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(`\n===== ${name} (${url}) status=${r.status} htmlLen=${t.length}`);
    console.log('title:', title.slice(0, 200));
    console.log('meta:', desc.slice(0, 300));
    console.log('body:', body.slice(0, 900));
  } catch (e) {
    console.log(`\n===== ${name} (${url}) ERROR: ${e.message}`);
  }
}
