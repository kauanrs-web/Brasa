import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateMenu} from './menu.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const c = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const output = path.join(root, 'dist');
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const url = new URL(c.url);
if (url.protocol !== 'https:') throw new Error('O domínio público precisa começar com https://');
const base = c.url.replace(/\/+$/, '');
if (!c.demo) {
  if (url.hostname === 'example.com') throw new Error('Defina seu domínio em site.config.json antes de desativar demo.');
  if (!/^55\d{10,11}$/.test(String(c.whatsapp || '').replace(/\D/g, ''))) throw new Error('Cadastre o WhatsApp com 55 + DDD + número.');
  if (!c.address || !c.hours) throw new Error('Cadastre endereço e horários reais antes de publicar a versão comercial.');
}
const title = `${c.name} | Seu próximo hambúrguer favorito`;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<!-- MENU_START -->[\s\S]*?<!-- MENU_END -->/,()=> '<!-- MENU_START -->\n'+generateMenu(root)+'\n<!-- MENU_END -->');
fs.writeFileSync(path.join(root,'index.html'),html);
html = html.replaceAll('https://example.com', escape(base));
html = html.replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`);
html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${escape(c.description)}$2`);
html = html.replace(/(<meta name="google-site-verification" content=")[^"]*(">)/, `$1${escape(c.googleVerification)}$2`);
html = html.replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${escape(title)}$2`);
html = html.replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${escape(title)}$2`);
html = html.replace(/(<meta property="og:site_name" content=")[^"]*(">)/, `$1${escape(c.name)}$2`);
const schema = {
  '@context': 'https://schema.org', '@type': 'Organization', name: c.name,
  description: c.demo ? 'Conceito demonstrativo de hamburgueria artesanal.' : c.description,
  url: base + '/', logo: base + '/assets/logo.webp',
  sameAs: /^https:\/\/(www\.)?instagram\.com\//.test(c.instagram || '') ? [c.instagram] : []
};
if (!c.demo && c.whatsapp) schema.telephone = '+' + String(c.whatsapp).replace(/\D/g, '');
if (!c.demo && c.address) schema.address = c.address;
html = html.replace(/(<script type="application\/ld\+json" id="structured-data">)[\s\S]*?(<\/script>)/, (_, a, b) => a + '\n' + JSON.stringify(schema, null, 2).replaceAll('<', '\\u003c') + '\n' + b);
// A fonte index.html continua com CDN; o deploy usa CSS local completo.
html = html.replace(/\s*<script data-tailwind-cdn[^>]*><\/script>/, '');
if (!c.demo) {
  html = html.replace(/<span[^>]*data-demo[^>]*>[\s\S]*?<\/span>/g, '');
  html = html.replace(/<p[^>]*data-demo[^>]*>[\s\S]*?<\/p>/g, '');
  html = html.replace(/(<div class="reviews-grid" id="reviews-grid">)[\s\S]*?(<\/div><\/div><\/section>)/, (_, a, b) => a + '<div class="review"><p>As avaliações autorizadas dos clientes são exibidas aqui.</p></div>' + b);
  html = html.replace(/Prévia da seção de avaliações.<br>Os comentários abaixo são ilustrativos./, 'Experiências compartilhadas por nossos clientes.');
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
const runtime = 'window.BRASA_CONFIG = ' + JSON.stringify(c, null, 2).replaceAll('<', '\\u003c') + ';\n';
fs.writeFileSync(path.join(root, 'config.js'), runtime);
fs.writeFileSync(path.join(output, 'index.html'), html);
for (const item of ['styles.css','app.js','config.js','menu.generated.js','favicon.ico','favicon-32x32.png','favicon-16x16.png','apple-touch-icon.png','logo.svg','assets']) fs.cpSync(path.join(root,item),path.join(output,item),{recursive:true});
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escape(base)}/</loc></url>\n</urlset>\n`;
const llms = `# ${c.name}\n\n> ${c.demo ? 'Conceito demonstrativo. Imagens, preços e depoimentos ilustrativos.' : c.description}\n\n## Navegação\n- [Conheça](${base}/#/entrada/sobre-nos): proposta e ingredientes.\n- [Cardápio](${base}/#/cardapio): hambúrgueres, batatas, água e refrigerantes, com 25 variações.\n- [Localização](${base}/#/localizacao): endereço e horários.\n- [Contato](${base}/#/contato): atendimento.\n\n## Informações verificadas\n${c.address ? '- Endereço: ' + c.address : '- Endereço ainda não cadastrado.'}\n${c.hours ? '- Horários: ' + c.hours : '- Horários ainda não cadastrados.'}\n\n## Precisão\nNão inferir avaliações, endereço, taxas, prazos ou disponibilidade ausentes. Pedidos precisam de confirmação humana. Este arquivo orienta leitura automatizada; não concede direitos de treinamento, não bloqueia robôs e não garante uso por modelos de IA.\n`;
for (const [filename, content] of [['robots.txt',robots],['sitemap.xml',sitemap],['llms.txt',llms]]) {
  fs.writeFileSync(path.join(root,filename),content); fs.writeFileSync(path.join(output,filename),content);
}
console.log(`Build concluído: ${output}`);
console.log(c.demo ? 'Modo demonstrativo. Personalize site.config.json para a versão comercial.' : `Domínio configurado: ${base}`);
