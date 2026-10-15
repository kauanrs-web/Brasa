## Enviar ao GitHub e hospedar na Vercel

1. Extraia o ZIP no computador.
2. Abra a pasta extraída e envie seus arquivos e as pastas assets e scripts para a raiz do repositório. Não envie o ZIP fechado.
3. Importe o repositório na Vercel. A configuração vercel.json executa npm run build e publica a pasta dist automaticamente.
4. Se estiver atualizando um repositório existente, substitua os arquivos de mesmo nome. A pasta dist não precisa ser enviada: ela é gerada durante a hospedagem.

Este pacote contém apenas os arquivos do projeto necessários para editar, gerar e verificar o site. As cópias da pasta dist e os arquivos de produção de vídeo não entram no ZIP. A animação atual do hambúrguer continua funcionando com a imagem WebP e o JavaScript incluídos.

# Brasa Burger — revisão 5

A navegação mantém Entrada, Sobre nós, Cardápio, Localização e Contato. **Sobre nós fica na mesma página da Entrada**, logo abaixo da seção principal. O link rola até essa seção. Cardápio, Localização e Contato continuam em telas separadas. Links antigos de Sobre nós são compatíveis e abrem a seção na entrada. A estrutura contém quatro telas, com navegação por fragmentos e suporte a Voltar/Avançar.

A entrada usa duas colunas independentes no computador: texto à esquerda e imagem transparente do hambúrguer à direita. No celular, as colunas ficam empilhadas. A imagem não é um fundo atrás do texto e sua animação fica contida no próprio espaço. A altura acompanha o conteúdo para evitar cortes.

O visual usa Space Grotesk hospedada localmente, laranja, fundos creme e marrom escuro. A entrada conserva a composição com burger grande à direita. A fotografia permanece montada. A entrada usa uma aproximação inicial de 3,5% que retorna suavemente ao enquadramento normal em 4,2 segundos, uma única vez. O navegador anima a transformação diretamente, sem baixar um vídeo para a entrada. O selo acima do título e o botão de reprodução foram removidos.

HTML, CSS e JavaScript completos, fotos WebP, vídeo MP4 e sacola para WhatsApp. Não exige banco de dados ou serviços pagos. Endereço, telefone, horários e avaliações reais continuam dependendo da configuração do negócio.

## Abrir agora

Abra `index.html` na pasta do projeto. Ele contém a versão com Tailwind via CDN pedida no briefing. `styles.css` garante o visual completo mesmo sem CDN. A versão independente `brasa-burger-preview.html`, entregue fora da pasta, inclui mídia e código em um único arquivo para abrir diretamente.

## Publicar na Vercel

1. Extraia o ZIP e envie a pasta `brasa-burger` para um repositório Git.
2. Na Vercel, importe o repositório. Se a pasta estiver dentro do repositório, escolha `brasa-burger` como Root Directory.
3. Use Framework Preset **Other**. O arquivo `vercel.json` configura `npm run build` e Output Directory `dist`.
4. Publique. Node 20 ou superior; nenhuma dependência de produção para instalar.
5. Com o domínio definido, edite `site.config.json`, faça commit e publique novamente.

Alternativa: execute `npm run build` e envie o conteúdo de `dist/` para qualquer hospedagem estática.

## Configurar o negócio

Edite `site.config.json` e execute `npm run build`:

| Campo | Valor esperado |
| --- | --- |
| `url` | URL HTTPS final, por exemplo o domínio recebido na Vercel |
| `demo` | `true` para demonstração; `false` após cadastrar os dados reais |
| `whatsapp` | 55 + DDD + número, só dígitos |
| `address` | Endereço completo real, incluindo cidade e estado |
| `hours` | Dias e horários reais |
| `instagram` | URL HTTPS do perfil oficial |
| `email` | Contato do responsável por privacidade |
| `ga4Id` | ID G-… do Google Analytics, ou mantenha o placeholder para desativar |
| `clarityId` | ID real do Microsoft Clarity, ou mantenha o placeholder |
| `googleVerification` | Código fornecido pelo Search Console |
| `reviews` | Avaliações autorizadas, no formato `[{"name":"Nome autorizado","text":"Depoimento real"}]` |

O build impede a versão comercial com domínio, WhatsApp, endereço ou horários ausentes. As avaliações ilustrativas são removidas quando `demo` é `false`. O nome da marca aparece também no texto, logo e seções: ao trocar de marca, revise o HTML e a identidade visual, além da configuração.

## Cardápio e pedidos

São nove grupos de produtos e 25 variações: três hambúrgueres; fritas tradicionais, com cheddar e bacon e rústicas; água com ou sem gás; cola, guaraná e limão, incluindo versões zero e diferentes tamanhos. Os produtos, ingredientes e preços são exemplos. Edite `menu.json` e execute `npm run build`. Os cards, preços e SKUs da sacola são gerados da mesma fonte, sem duplicar preços no HTML e no JavaScript. O subtotal exclui entrega e adicionais; o cliente recebe confirmação pelo WhatsApp. Pix/cartão/dinheiro são preferências para confirmação, não integrações de pagamento.

A sacola persiste somente itens e quantidades no navegador. Nome, endereço e observações não são salvos pelo site. Em modo demo, a finalização abre um resumo copiável, sem destinatário fictício. A sacola não é apagada automaticamente ao abrir o WhatsApp porque abrir uma conversa não confirma o pedido.

## Os oito grupos solicitados

1. Favicon ICO, PNG 16/32 e Apple touch 180 incluídos.
2. SEO, canonical, viewport, Open Graph, Twitter e verificação Search Console no `head`.
3. JSON-LD Organization com nome, descrição, URL, logo e `sameAs` preenchido somente quando existe um perfil informado. Sem avaliações estruturadas inventadas.
4. `robots.txt`, `sitemap.xml`, `llms.txt` reais, além de exemplos em comentário ao final do HTML. O sitemap lista só a página real; âncoras internas não são páginas separadas. `llms.txt` auxilia leitura, mas não garante indexação, treinamento ou inclusão em respostas de IA.
5. GA4 com `gtag.js`, ID editável e carregamento após consentimento.
6. Clarity com ID editável e mesmo controle de consentimento. Formulário marcado para mascaramento.
7. Fotos WebP com `alt`, dimensões, `loading="lazy"`, `decoding="async"`, `picture/srcset`. Pôster principal pré-carregado para evitar atraso visual. Favicons PNG/ICO e vídeos MP4 são as exceções de formato exigidas por suas funções.
8. Menu responsivo, hero animado, benefícios, cardápio, seção de avaliações, FAQ em sanfona, localização, contato e rodapé.

## Animação e resolução

A cena usa `burger-hero.webp` com transformação nativa do navegador: de escala 1,035 para 1 em 4,2 segundos, com desaceleração suave. Não há montagem, desmontagem, corte, loop, troca de imagem ou controles visíveis. Ao terminar, permanece estática. A animação respeita redução de movimento e economia de dados e é cancelada ao ocultar a aba ou mudar de tela. Sem suporte à animação, a imagem continua disponível.

Os MP4 da pasta assets são arquivos auxiliares para edição, não são carregados pelo site. Tipografia e layout escalam para diferentes telas. As mídias não são nativas em 8K.

## Canva

O arquivo `brasa-burger-canva.pptx` é uma adaptação visual com textos e imagens editáveis. Importe-o no Canva pela opção de upload de arquivos. As telas do cardápio foram separadas por categoria para facilitar a edição. Confira a fonte após importar: o Canva pode substituí-la. As fotos são elementos independentes, não ingredientes editáveis.

A importação não transfere HTML, JavaScript, sacola, filtros ou roteamento. Esses recursos pertencem ao site HTML. O pacote `brasa-burger-canva.zip` inclui PPTX, vídeo MP4 da cena, imagens PNG e instruções.

## Tailwind e produção

A versão de referência inclui `@tailwindcss/browser@4` via CDN, conforme solicitado. A documentação oficial informa que Play CDN é destinado ao desenvolvimento. O build remove esse runtime e entrega os estilos locais completos, mantendo o mesmo design sem compilar CSS no navegador. As classes utilitárias usadas têm equivalentes explícitos no CSS. Não há instalação do compilador Tailwind.

## Arquivos

- `index.html`: conteúdo e versão com CDN.
- `styles.css`: identidade, responsividade, transições e redução de movimento.
- `app.js`: rotas, menu, vídeo, filtros, abas, FAQ, sacola, diálogos e cookies.
- `site.config.json`: dados editáveis; `config.js` é gerado pelo build.
- `assets/`: fotos, logo WebP, pôsteres da cena única e vídeos.
- `menu.json`: cadastro único dos produtos e suas variações.
- `menu.generated.js`: catálogo gerado para a sacola.
- `scripts/menu.mjs`: geração dos cards e do catálogo.
- `video-source/`: camadas e filtros da composição do vídeo.
- `scripts/build.mjs`: geração de `dist/` e arquivos de indexação.
- `scripts/check.mjs`: validação estática, executada com `npm run check`.
- `scripts/media-v3.mjs`: exportação dos vídeos atuais a partir de uma fotografia; usa FFmpeg apenas para regenerar mídia, não na Vercel.
- `scripts/media-v2.cjs` e `video-source/`: fontes históricas da composição anterior; não executadas pelo build.
- `assets/FONT-LICENSE.txt`: licença SIL Open Font License da Space Grotesk.
- `vercel.json`: build, diretório publicado, cache e cabeçalhos.

## Verificação e limites

Build e verificações estáticas checam sintaxe JavaScript, JSON-LD, IDs únicos, destinos internos, arquivos de mídia, metadados, quatro rotas e a seção Sobre nós e ordem da navegação. Testes de DOM com jsdom exercitaram troca de telas, acesso à seção Sobre nós, estado ativo, Voltar, cliques rápidos, menu móvel, filtros, variações, sacola, resumo de pedido e FAQ. Foram simuladas as condições de viewport de 390 e 1440 px, mais 320 px com redução de movimento. Esses testes validam lógica e DOM; jsdom não renderiza CSS e não comprova encaixe visual. Foram inspecionados os frames do vídeo e os assets. A prévia de navegador foi tentada, mas o ambiente não conseguiu iniciar o processo isolado de prévia (restrição de montagem de `/proc`). A validação visual/interativa em navegador, a conferência em dispositivo físico e a medição Lighthouse continuam pendentes. As regras responsivas foram revisadas para 320, 360, 390, 768, 1000, 1200, 1440 e 1920 px; essa revisão de código não substitui um teste renderizado. Não há promessa de nota de desempenho, ranking ou reprodução automática em todos os navegadores.

Antes do lançamento comercial, confira os textos, preços, autorização das avaliações, dados reais e política de privacidade; valide no celular e computador e faça um pedido completo de teste. Analytics e compartilhamento social dependem de IDs, domínio público e configuração reais.

## Referências técnicas

- https://tailwindcss.com/docs/installation/play-cdn
- https://developers.google.com/tag-platform/gtagjs
- https://learn.microsoft.com/clarity/setup-and-installation/clarity-setup
- https://vercel.com/docs/project-configuration

## Origem das imagens

Imagens do cardápio e atlas de ingredientes gerados com a ferramenta integrada de imagens; não representam produtos reais fotografados. Prompts usados: atlas transparente com seis camadas isoladas (pão superior, vegetais, alface, queijo com bacon, carne e pão inferior), inspirado na primeira referência; tríptico fotográfico de burger clássico, duplo bacon e vegetariano sobre fundo escuro. O atlas foi convertido em camadas para animação; as fotos foram exportadas em WebP responsivo.


## Atualização de movimento e interface

O hambúrguer da Entrada usa uma imagem WebP inteira com movimento contínuo via Web Animations, sem cortes ou remontagem. A animação pausa fora da tela, com a aba oculta ou pela preferência de movimento reduzido. O rodapé permite pausar as animações. Entrada e Sobre nós compartilham a página, com transição de cor e rolagem suave. Os controles visíveis usam texto, sem ícones ou emojis. Avaliações aparecem apenas quando cadastradas.
