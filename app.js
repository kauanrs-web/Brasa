/* Brasa Burger — interação progressiva, sem bibliotecas de animação. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const config = window.BRASA_CONFIG || {};
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const menu = window.BRASA_MENU || [];
  const products = Object.fromEntries(menu.flatMap(product => product.variants.map(variant => [variant.id, {
    name: product.name + (product.variants.length > 1 ? ' — ' + variant.label : ''),
    price: variant.price, image: product.thumbnail, variant: variant.label
  }])));
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Navegação privada: funciona em memória. */ } }
  };
  let cart = {};
  try {
    const saved = JSON.parse(storage.get('brasa-cart-v1') || '{}');
    for (const id of Object.keys(products)) if (Number.isInteger(saved[id]) && saved[id] > 0) cart[id] = Math.min(50, saved[id]);
  } catch { cart = {}; }
  const phone = String(config.whatsapp || '').replace(/\D/g, '');
  const canOrder = !config.demo && /^55\d{10,11}$/.test(phone);
  const track = (event, params = {}) => { if (window.gtag && storage.get('brasa-consent') === 'granted') window.gtag('event', event, params); };
  let toastTimer;
  function toast(text) {
    $('#toast').textContent = text;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200);
  }
  async function animate(el, frames, duration = 300) {
    if (!el.animate || motion.matches || document.documentElement.classList.contains('motion-paused')) return;
    try { await el.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' }).finished; } catch { /* Cancelamento de uma transição. */ }
  }

  // Menu móvel: os links fechados não entram na navegação por teclado.
  const menuButton = $('#menu-toggle'), mobileNav = $('#mobile-nav');
  const updateHeader=()=>$('.site-header').classList.toggle('is-scrolled',scrollY>40);
  addEventListener('scroll',updateHeader,{passive:true});updateHeader();
  function setMenu(open) {
    mobileNav.classList.toggle('open', open);
    mobileNav.inert = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuButton.textContent = open ? 'Fechar' : 'Menu';
    requestAnimationFrame(positionNavIndicator);
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  matchMedia('(min-width:1000px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  if ('IntersectionObserver' in window) {
    if (!motion.matches) {
      document.documentElement.classList.add('motion-ready');
      const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('pending'); reveal.unobserve(entry.target); }
      }), { threshold: .08, rootMargin: '0px 0px 30px 0px' });
      $$('.reveal').forEach(el => { el.classList.add('pending'); reveal.observe(el); });
    }
  }

  // Um único hambúrguer inteiro: ciclo contínuo sem cortes nem remontagem.
  const scene = $('#burger-scene');
  const motionButton = $('#motion-toggle');
  let sceneAnimation = null, sceneVisible = true;
  let pausedByUser = storage.get('brasa-motion-paused') === 'true';
  function stopScene() { sceneAnimation?.pause(); }
  function playScene() {
    if (motion.matches || pausedByUser || navigator.connection?.saveData || !sceneVisible || $('#view-entrada').hidden || document.hidden) { stopScene(); return; }
    if (!scene.complete || !scene.naturalWidth || !scene.animate) return;
    if (!sceneAnimation) sceneAnimation = scene.animate([
      {transform:'translate3d(0,4px,0) rotate(-1deg) scale(.97)'},
      {transform:'translate3d(0,-12px,0) rotate(1deg) scale(.99)'},
      {transform:'translate3d(0,4px,0) rotate(-1deg) scale(.97)'}
    ], {duration:7400,iterations:Infinity,easing:'ease-in-out'});
    else sceneAnimation.play();
  }
  function syncMotion() {
    const reduced = motion.matches || pausedByUser;
    document.documentElement.classList.toggle('motion-paused',reduced);
    motionButton.textContent = reduced ? 'Ativar animações' : 'Pausar animações';
    motionButton.setAttribute('aria-pressed',String(reduced));
    motionButton.disabled = motion.matches;
    if (reduced) { sceneAnimation?.cancel(); sceneAnimation = null; }
    $$('.reveal.pending').forEach(el => { if(reduced) el.classList.remove('pending'); });
    playScene();
  }
  motionButton.addEventListener('click', () => { pausedByUser = !pausedByUser; storage.set('brasa-motion-paused',String(pausedByUser)); syncMotion(); });
  scene.addEventListener('load',playScene);
  document.addEventListener('visibilitychange',playScene);
  motion.addEventListener('change',syncMotion);
  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver(entries => {
      sceneVisible = entries[0].isIntersecting; playScene();
    }, {threshold:0.05});
    sceneObserver.observe(scene);
  }
  syncMotion();

  // Rotas internas: apenas uma tela fica visível e acessível por vez.
  // Hashes funcionam também no HTML independente e não exigem servidor/rewrite.
  const routes = {'entrada':'Entrada','cardapio':'Cardápio','localizacao':'Localização','contato':'Contato'};
  const aliases = {'sobre-nos':'entrada',conhecimentos:'entrada',avaliacoes:'entrada'};
  const getSection = () => {
    const hash = location.hash.replace(/^#\/?/, '');
    if (hash === 'avaliacoes') return 'avaliacoes';
    return ['entrada/sobre-nos','sobre-nos','conhecimentos'].includes(hash) ? 'conhecimentos' : null;
  };
  const getRoute = () => {
    const name = location.hash.replace(/^#\/?/, '').split('/')[0];
    return Object.hasOwn(routes,name) ? name : aliases[name] || 'entrada';
  };
  let currentRoute = '', changingRoute = false;
  // Um único indicador desliza entre os links e acompanha a leitura da Entrada.
  const trackedNavs = $$('.desktop-nav, #mobile-nav > div');
  trackedNavs.forEach(nav => {
    const bar = document.createElement('span');
    bar.className = 'nav-indicator'; bar.setAttribute('aria-hidden','true');
    nav.append(bar);
  });
  function positionNavIndicator() {
    trackedNavs.forEach(nav => {
      const active = $('a.active',nav), bar = $('.nav-indicator',nav);
      if (!active) { bar.style.opacity = '0'; return; }
      const box = active.getBoundingClientRect(), parent = nav.getBoundingClientRect();
      const mobile = nav.parentElement.id === 'mobile-nav';
      bar.style.opacity = '1';
      bar.style.width = (mobile ? 3 : box.width) + 'px';
      bar.style.height = (mobile ? box.height : 3) + 'px';
      bar.style.transform = `translate3d(${mobile ? 10 : box.left-parent.left}px,${mobile ? box.top-parent.top : box.bottom-parent.top-3}px,0)`;
    });
  }
  function selectNav(hash) {
    $$('nav a').forEach(link => {
      const selected = link.hash === hash;
      link.classList.toggle('active',selected);
      if (selected) link.setAttribute('aria-current',hash.includes('sobre-nos')?'location':'page');
      else link.removeAttribute('aria-current');
    });
    positionNavIndicator();
  }
  let navFrame = 0;
  function syncNavToScroll() {
    if (navFrame) return;
    navFrame = requestAnimationFrame(() => {
      navFrame = 0;
      if (currentRoute !== 'entrada' || changingRoute) return;
      const about = $('#conhecimentos').getBoundingClientRect();
      selectNav(about.top <= Math.max(140,innerHeight*.35) ? '#/entrada/sobre-nos' : '#/entrada');
    });
  }
  addEventListener('scroll',syncNavToScroll,{passive:true});
  addEventListener('resize',positionNavIndicator,{passive:true});
  document.fonts?.ready.then(positionNavIndicator);
  if ('ResizeObserver' in window) {
    const navResize = new ResizeObserver(positionNavIndicator);
    trackedNavs.forEach(nav => navResize.observe(nav));
  }
  function showRoute(route, focus = true) {
    $$('.page-view').forEach(view => { view.hidden = view.dataset.view !== route; view.inert = view.hidden; });
    currentRoute = route;
    document.documentElement.dataset.route = route;
    const section = route === 'entrada' ? getSection() : null;
    const label = section ? 'Sobre nós' : routes[route];
    document.title = `${label} | ${config.name || 'Brasa Burger'}`;
    selectNav(section ? '#/entrada/sobre-nos' : '#/' + route);
    if (route !== 'entrada') stopScene();
    else playScene();
    if (focus) {
      if (section) $('#' + section).scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
      else scrollTo({top:0,behavior:route==='entrada'&&!changingRoute&&!motion.matches?'smooth':'instant'});
      const heading = section ? $('#about-title') : $(`[data-view="${route}"] h1`);
      heading?.focus({preventScroll:true});
      $('#route-status').textContent = label;
      track('page_view',{page_title:document.title,page_location:location.href});
    }
  }
  async function changeRoute() {
    if (changingRoute) return;
    if (getRoute() === currentRoute) { setMenu(false); showRoute(currentRoute); return; }
    changingRoute = true;
    setMenu(false);
    const main = $('#conteudo');
    try {
      while (getRoute() !== currentRoute) {
        main.setAttribute('aria-busy','true');
        main.inert = true;
        await animate(main,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],160);
        main.inert = false;
        showRoute(getRoute());
        await animate(main,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],380);
      }
    } finally { main.inert = false; main.removeAttribute('aria-busy'); changingRoute = false; }
  }
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#conteudo').focus({preventScroll:true}); scrollTo({top:0,behavior:motion.matches?'instant':'smooth'}); });
  addEventListener('hashchange',changeRoute);
  showRoute(getRoute(),false);
  if (getSection()) requestAnimationFrame(() => $('#' + getSection())?.scrollIntoView({behavior:'instant',block:'start'}));
  $$('a[href^="#/"]').forEach(link => link.addEventListener('click',event => {
    if (link.hash === location.hash) { event.preventDefault(); setMenu(false); showRoute(currentRoute); }
  }));

  // Abas da história e filtros do cardápio com transições de saída e entrada.
  const tabs = $$('.story-tabs [role=tab]');
  let switchingTab = false;
  async function chooseTab(tab) {
    if (switchingTab || tab.getAttribute('aria-selected') === 'true') return;
    switchingTab = true;
    const container = $('.story-panels');
    await animate(container, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(7px)' }], 150);
    tabs.forEach(t => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !selected;
    });
    await animate(container, [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }]);
    switchingTab = false;
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => chooseTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); chooseTab(tabs[next]);
    });
  });
  let filtering = false;
  $$('.filter').forEach(button => button.addEventListener('click', async () => {
    if (filtering || button.classList.contains('active')) return;
    filtering = true;
    const grid = $('#product-grid');
    const oldHeight = grid.offsetHeight;
    await animate(grid, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], 160);
    $$('.filter').forEach(filter => { filter.classList.toggle('active', filter === button); filter.setAttribute('aria-pressed', String(filter === button)); });
    $$('.product-card').forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; card.classList.remove('pending'); });
    const newHeight = grid.offsetHeight;
    await animate(grid, [{ opacity: 0, height: oldHeight + 'px', transform: 'translateY(12px)' }, { opacity: 1, height: newHeight + 'px', transform: 'translateY(0)' }], 360);
    filtering = false;
    track('filter_menu', { category: button.dataset.filter });
  }));
  $$('.faq-item button').forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    $('.faq-state',button).textContent = open ? 'Fechar' : 'Abrir';
    const panel = $('#' + button.getAttribute('aria-controls'));
    panel.classList.toggle('open', open); panel.inert = !open;
  }));

  // Dialog nativo mantém foco dentro da janela e permite Escape.
  function openDialog(dialog) {
    dialog.classList.remove('is-closing');
    dialog.showModal(); document.body.classList.add('modal-open');
  }
  async function closeDialog(dialog) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    if (!motion.matches) await new Promise(resolve => setTimeout(resolve, 240));
    dialog.close(); dialog.classList.remove('is-closing');
    if (!$('dialog[open]')) document.body.classList.remove('modal-open');
  }
  $$('dialog').forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
  });
  function info(title, text, summary = '') {
    $('#info-title').textContent = title; $('#info-text').textContent = text;
    $('#order-summary').hidden = !summary; $('#copy-summary').hidden = !summary;
    $('#order-summary').value = summary;
    openDialog($('#info-dialog'));
  }
  $('#copy-summary').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#order-summary').value); $('#copy-summary').textContent = 'Resumo copiado'; }
    catch { $('#order-summary').select(); $('#info-text').textContent = 'Selecione e copie o resumo abaixo (Ctrl+C no computador).'; }
  });
  function updateCart() {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    $$('.cart-count').forEach(el => el.textContent = count);
    $$('.cart-trigger').forEach(button => button.setAttribute('aria-label', `Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}`));
    storage.set('brasa-cart-v1', JSON.stringify(cart));
    const container = $('#cart-items');
    container.replaceChildren();
    if (!count) {
      container.innerHTML = '<div class="cart-empty"><p>Sua próxima mordida começa no cardápio.</p><button class="button" id="empty-menu">Escolher meu burger</button></div>';
      $('#empty-menu').addEventListener('click', async () => { await closeDialog($('#cart-dialog')); location.hash = '/cardapio'; });
    }
    for (const [id, quantity] of Object.entries(cart)) {
      const product = products[id];
      const row = document.createElement('div'); row.className = 'cart-item';
      row.innerHTML = `<img src="${product.image}" alt="${product.name} na sacola" width="64" height="64" loading="lazy" decoding="async"><div><h3>${product.name}</h3><p>${money(product.price * quantity)}</p></div><div class="quantity"><button type="button" data-change="-1" data-id="${id}" aria-label="Diminuir quantidade de ${product.name}">Menos</button><span>${quantity}</span><button type="button" data-change="1" data-id="${id}" aria-label="Aumentar quantidade de ${product.name}">Mais</button></div>`;
      container.append(row);
    }
    $('#cart-total').textContent = money(Object.entries(cart).reduce((total, [id, q]) => total + products[id].price * q, 0));
    $('#checkout-form').hidden = !count;
    $('#checkout-button').disabled = !count;
  }
  $('#cart-items').addEventListener('click', event => {
    const button = event.target.closest('[data-change]'); if (!button) return;
    const { id, change } = button.dataset;
    cart[id] = Math.min(50, (cart[id] || 0) + Number(change));
    if (cart[id] <= 0) delete cart[id];
    updateCart();
    $(`[data-id="${id}"][data-change="${change}"]`, $('#cart-items'))?.focus();
  });
  $$('.variant-select').forEach(select => select.addEventListener('change', () => {
    const card=select.closest('.product-card'),product=products[select.value];
    if(!product)return;
    const price=$('[data-price]',card),button=$('[data-add]',card);
    price.textContent=money(product.price);
    button.dataset.add=select.value;
    button.setAttribute('aria-label','Adicionar '+product.name+' à sacola');
    animate(price,[{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],220);
  }));
  $$('[data-add]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.add;
    if ((cart[id] || 0) >= 50) return toast('Limite de 50 unidades deste item.');
    cart[id] = (cart[id] || 0) + 1; updateCart(); toast(products[id].name + ' adicionado à sacola.');
    animate(button, [{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], 260);
    track('add_to_cart', { currency: 'BRL', value: products[id].price / 100, items: [{ item_id: id, item_name: products[id].name, quantity: 1 }] });
  }));
  $$('.cart-trigger').forEach(button => button.addEventListener('click', () => { updateCart(); openDialog($('#cart-dialog')); }));
  $$('[name=fulfillment]').forEach(radio => radio.addEventListener('change', () => {
    const delivery = $('[name=fulfillment]:checked').value === 'Entrega';
    $('#address-field').hidden = !delivery; $('[name=address]').required = delivery;
  }));
  if (!canOrder) $('#checkout-button span').textContent = 'Ver resumo do pedido';
  $('#checkout-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!Object.keys(cart).length) return;
    const data = new FormData(event.currentTarget);
    const subtotal = Object.entries(cart).reduce((total, [id, q]) => total + products[id].price * q, 0);
    const lines = [config.demo ? 'SIMULAÇÃO DE PEDIDO — BRASA BURGER' : `PEDIDO — ${config.name || 'Brasa Burger'}`, '', ...Object.entries(cart).map(([id, q]) => `${q} × ${products[id].name} — ${money(products[id].price * q)}`), '', `Subtotal: ${money(subtotal)}`, 'Entrega e adicionais: a confirmar', '', `Nome: ${String(data.get('name')).trim()}`, `Modalidade: ${data.get('fulfillment')}`];
    if (data.get('fulfillment') === 'Entrega') lines.push(`Endereço: ${String(data.get('address')).trim()}`);
    lines.push(`Pagamento: ${data.get('payment')}`, `Observações: ${String(data.get('notes')).trim() || 'Nenhuma'}`, '', 'Aguardando confirmação de disponibilidade, valor final e prazo.');
    const summary = lines.join('\n');
    if (canOrder) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(summary)}`, '_blank', 'noopener,noreferrer');
      track('begin_checkout', { currency: 'BRL', value: subtotal / 100 });
    } else {
      $('#copy-summary').innerHTML = 'Copiar resumo';
      info('Seu pedido, organizado.', config.demo ? 'Esta é uma demonstração. Confira ou copie o resumo; nenhum pedido será enviado.' : 'O canal de pedidos ainda não está disponível. Você pode copiar o resumo abaixo.', summary);
    }
  });
  updateCart();

  // Informações comerciais: nenhum destino fictício é apresentado como real.
  if (!config.demo) $$('[data-demo]').forEach(el => el.hidden = true);
  if (config.address) { $('#location-address').textContent = config.address; $('#map-caption').textContent = config.address; $('#directions-button').firstChild.textContent = 'Traçar minha rota '; }
  if (config.hours) $('#location-hours').textContent = config.hours;
  $('#directions-button').addEventListener('click', () => {
    if (config.address && !config.demo) window.open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(config.address), '_blank', 'noopener,noreferrer');
    else info('Nosso ponto de encontro.', 'O endereço da hamburgueria ainda não foi divulgado. Assim que estiver disponível, você poderá abrir a rota por aqui.');
  });
  $$('[data-contact]').forEach(button => button.addEventListener('click', () => {
    if (canOrder) window.open(`https://wa.me/${phone}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a Brasa Burger.')}`, '_blank', 'noopener,noreferrer');
    else info('Vamos conversar.', 'O WhatsApp de atendimento ainda não está disponível nesta demonstração. Você já pode explorar o cardápio e montar sua sacola.');
  }));
  if (/^https:\/\/(www\.)?instagram\.com\//.test(config.instagram || '')) {
    const link = $('#instagram-link'); link.href = config.instagram; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.hidden = false;
  }
  if (Array.isArray(config.reviews) && config.reviews.length) {
    const list = $('#reviews-grid'); list.replaceChildren();
    $('#avaliacoes').hidden = !config.reviews.some(review => review.name && review.text);
    $('[data-review-note]').textContent = 'Experiências compartilhadas por nossos clientes.';
    config.reviews.slice(0, 6).forEach(review => {
      if (!review.name || !review.text) return;
      const figure = document.createElement('figure'); figure.className = 'review';
      const quote = document.createElement('blockquote'); quote.textContent = review.text;
      const author = document.createElement('figcaption'); author.textContent = review.name;
      figure.append(quote, author); list.append(figure);
    });
  } else if (!config.demo) {
    $('[data-review-note]').textContent = 'Sua experiência também pode fazer parte desta história.';
    $('#reviews-grid').innerHTML = '<div class="review"><p>As primeiras avaliações serão publicadas aqui, com autorização dos clientes.</p></div>';
  }
  $('#year').textContent = new Date().getFullYear();
  $('#privacy-button').addEventListener('click', () => info('Privacidade', 'A sacola usa armazenamento local para lembrar apenas itens e quantidades. Seu nome, endereço e observações não são salvos por este site.\n\nAo abrir o WhatsApp, o resumo do pedido passa a ser tratado por esse serviço. Nenhum pagamento é processado aqui.\n\nGoogle Analytics e Microsoft Clarity só são carregados quando configurados e após sua escolha de permitir análise. Campos do formulário são marcados para mascaramento no Clarity. Você pode rever essa escolha em Cookies.' + (config.email ? '\n\nContato: ' + config.email : '')));
  const validGA = /^G-[A-Z0-9]+$/.test(config.ga4Id || '') && config.ga4Id !== 'G-XXXXXXXXXX';
  const validClarity = /^[a-z0-9]+$/i.test(config.clarityId || '') && config.clarityId !== 'SEU_CLARITY_ID';
  const hasAnalytics = validGA || validClarity;
  const consent = storage.get('brasa-consent');
  if (hasAnalytics && consent === 'granted') window.startAnalytics();
  if (hasAnalytics && !consent) $('#cookie-banner').hidden = false;
  $('#cookies-button').addEventListener('click', () => { $('#cookie-banner').hidden = false; });
  $$('[data-consent]').forEach(button => button.addEventListener('click', async () => {
    storage.set('brasa-consent', button.dataset.consent);
    await animate($('#cookie-banner'), [{ opacity: 1 }, { opacity: 0, transform: 'translateY(15px)' }], 200);
    $('#cookie-banner').hidden = true;
    if (button.dataset.consent === 'granted' && hasAnalytics) window.startAnalytics();
    if (button.dataset.consent === 'denied' && window.analyticsStarted) location.reload();
    else toast('Preferências de cookies atualizadas.');
  }));
})();
