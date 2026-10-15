import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,'IDs duplicados no HTML');
for(const match of html.matchAll(/\b(?:href|aria-controls)="#?([a-z][\w-]*)"/g)) {
  if (match[0].startsWith('href="') && !match[0].startsWith('href="#')) continue;
  assert(ids.includes(match[1]),'Âncora ou controle sem destino: '+match[1]);
}
for(const match of html.matchAll(/<(?:img|script|source|link|video)\b[^>]*>/g)) {
  const tag=match[0];
  for(const attr of ['src','href','poster','data-src']) {
    const value=tag.match(new RegExp('(?:^|\\s)'+attr+'="([^"]+)"'))?.[1];
    if(!value || /^(https?:|data:|#)/.test(value)) continue;
    assert(fs.existsSync(path.join(dist,value)),'Arquivo inexistente: '+value);
  }
  if(tag.startsWith('<img')) {
    assert(/src="[^"]+\.webp"/.test(tag),'Imagem sem WebP');
    for(const attr of ['loading="lazy"','decoding="async"','alt="','width="','height="']) assert(tag.includes(attr),'Atributo de imagem ausente: '+attr);
  }
}
const schema=JSON.parse(html.match(/<script type="application\/ld\+json" id="structured-data">([\s\S]*?)<\/script>/)[1]);
for(const prop of ['name','description','url','logo','sameAs']) assert(prop in schema,'Schema incompleto');
for(const meta of ['description','keywords','google-site-verification','og:title','og:description','og:image','og:url','og:type','og:site_name','twitter:card','twitter:title','twitter:description','twitter:image']) assert(html.includes('"'+meta+'"'),'Meta ausente: '+meta);
assert(!html.includes('<script data-tailwind-cdn'),'CDN em produção');
for(const file of ['app.js','config.js','menu.generated.js']) new vm.Script(fs.readFileSync(path.join(dist,file),'utf8'));
for(const script of html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) if(script[1].trim()) new vm.Script(script[1]);
for(const file of ['robots.txt','sitemap.xml','llms.txt','favicon.ico','favicon-32x32.png','favicon-16x16.png','apple-touch-icon.png']) assert(fs.statSync(path.join(dist,file)).size>0,'Arquivo obrigatório vazio');
const css=fs.readFileSync(path.join(dist,'styles.css'),'utf8');
assert(css.includes('prefers-reduced-motion'),'Redução de movimento ausente');
assert(css.includes('max-width:359px'),'Layout de telas pequenas ausente');
assert(!html.includes('class="signature-strip"'),'Faixa antiga ainda presente');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'menu.generated.js'),'utf8'),context);
const catalog=context.window.BRASA_MENU;
assert.equal(catalog.length,9,'Cardápio incompleto');
const variants=catalog.flatMap(p=>p.variants),skus=new Set(variants.map(v=>v.id));
assert.equal(variants.length,25,'Variações incompletas');
assert.equal(skus.size,variants.length,'SKU duplicado');
for(const p of catalog){assert(fs.existsSync(path.join(dist,p.thumbnail)),'Miniatura ausente: '+p.thumbnail);for(const v of p.variants){assert(Number.isInteger(v.price)&&v.price>0,'Preço inválido');assert(html.includes(`value="${v.id}"`)||html.includes(`data-add="${v.id}"`),'Variação ausente no HTML: '+v.id);}}
for(const m of html.matchAll(/data-add="([^"]+)"/g))assert(skus.has(m[1]),'Botão com SKU inexistente');
for(const category of ['burgers','sides','drinks'])assert(html.includes(`data-filter="${category}"`),'Filtro ausente');
for(const anchor of ['cardapio','localizacao','contato'])assert(html.includes(`href="#/${anchor}"`),'Navegação ausente');
console.log(`Verificação estática aprovada: ${ids.length} IDs únicos, âncoras, mídia, metadados, JSON-LD e sintaxe JavaScript.`);
console.log('Cardápio validado: 9 grupos, 25 SKUs únicos, preços em centavos e botões sincronizados.');

const viewNames=[...html.matchAll(/data-view="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(viewNames,['entrada','cardapio','localizacao','contato']);
const nav=html.match(/<nav class="desktop-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
assert.deepEqual([...nav.matchAll(/href="#\/([^"]+)"/g)].map(m=>m[1]),['entrada','entrada/sobre-nos','cardapio','localizacao','contato']);
for(const m of html.matchAll(/href="#\/([^"]+)"/g))assert(viewNames.includes(m[1].split('/')[0]),'Rota inexistente');
assert.equal([...html.matchAll(/class="page-view"[^>]* hidden/g)].length,3);
assert(!html.includes('burger-fluid'),'Vídeo anterior ainda referenciado');
console.log('Quatro telas, com Sobre nós na entrada, ordem da navegação e destinos validados.');

assert(!html.includes('hero-badge'),'Selo removido ainda aparece');
assert(!html.includes('replay-video'),'Controle removido ainda aparece');
assert(html.includes('id="burger-scene"'),'Cena principal ausente');
console.log('Selo e botão de reprodução removidos; cena leve e paleta quente presentes.');

assert(!html.includes('data-view="sobre-nos"'),'Sobre nós ainda isolado');
assert(html.includes('assets/burger-hero.webp'),'Foto isolada do hambúrguer ausente');
