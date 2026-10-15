import fs from 'node:fs';
import path from 'node:path';
export function generateMenu(root) {
  const menu=JSON.parse(fs.readFileSync(path.join(root,'menu.json'),'utf8'));
  menu.forEach(p=>p.thumbnail=`assets/${p.image}-400.webp`);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ids=new Set();
  for(const p of menu)for(const v of p.variants){if(ids.has(v.id)||!Number.isInteger(v.price)||v.price<1)throw new Error('SKU ou preço inválido: '+v.id);ids.add(v.id);}
  const money=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const html=menu.map(p=>{
    const variant=p.variants[0];
    const select=p.variants.length>1?`<label class="variant-label" for="variant-${p.id}">Escolha a opção</label><select class="variant-select" id="variant-${p.id}" data-product="${p.id}" aria-label="Opção de ${esc(p.name)}">${p.variants.map(v=>`<option value="${v.id}">${esc(v.label)}</option>`).join('')}</select>`:`<p class="single-variant">${esc(variant.label)}</p>`;
    return `<article class="product-card reveal" data-category="${p.category}" data-product-card="${p.id}"><div class="product-visual"><picture><source srcset="assets/${p.image}-400.webp 400w, assets/${p.image}-724.webp 724w" sizes="(max-width: 639px) 90vw, (max-width: 1000px) 45vw, 30vw" type="image/webp"><img src="assets/${p.image}-724.webp" width="724" height="724" loading="lazy" decoding="async" alt="${esc(p.alt)}"></picture></div><div class="product-info"><h3>${esc(p.name)}</h3><p class="product-description">${esc(p.description)}</p><div class="product-variant">${select}</div><div class="product-bottom"><strong class="price" data-price>${money(variant.price)}</strong><button class="add-button" data-add="${variant.id}" aria-label="Adicionar ${esc(p.name)} — ${esc(variant.label)} à sacola"><span>Adicionar</span></button></div></div></article>`;
  }).join('\n');
  fs.writeFileSync(path.join(root,'menu.generated.js'),'window.BRASA_MENU = '+JSON.stringify(menu).replaceAll('<','\\u003c')+';\n');
  return html;
}
