// T3 只读调研：第二轮外站页面（经 env 代理）。
const targets = [
  ['clawhub-publish-skill', 'https://clawhub.ai/skills/publish'],
  ['openclaw-docs-clawhub-publishing', 'https://docs.openclaw.ai/clawhub/publishing'],
  ['skills-sh-docs-cli', 'https://skills.sh/docs/cli'],
  ['skills-sh-docs-faq', 'https://skills.sh/docs/faq'],
  ['skills-sh-docs-api', 'https://skills.sh/docs/api'],
  ['awesome-submit', 'https://awesome-dsh-plugin.com/submit'],
  ['skillhub-tencent-article', 'https://cloud.tencent.cn/developer/article/2646908'],
  ['skillhub-docs', 'https://skillhub.cn/docs'],
  ['skillhub-help', 'https://skillhub.cn/help'],
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) t3-research';
for (const [name, url] of targets) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    const t = await r.text();
    const title = (t.match(/<title[^>]*>([^<]*)<\/title>/i) ?? [])[1] ?? '';
    const desc = (t.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) ?? [])[1] ?? '';
    const body = t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(`\n===== ${name} (${url}) status=${r.status} htmlLen=${t.length}`);
    console.log('title:', title.slice(0, 160));
    console.log('meta:', desc.slice(0, 240));
    console.log('body:', body.slice(0, 1200));
  } catch (e) {
    console.log(`\n===== ${name} (${url}) ERROR: ${e.message}`);
  }
}
