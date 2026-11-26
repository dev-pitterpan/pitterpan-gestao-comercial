# Gestão Comercial Pitter Pan Festas

Mapa funcional e técnico do painel da Floresta, América e Iririú.

## 1. Ambientes e fontes

| Componente                                                       | Responsabilidade                                                                                                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Gestão Comercial](https://pitterpangestaocomercial.vercel.app/) | Painel autenticado. Next.js App Router, React, TypeScript e PostgreSQL.                                                                                                                                   |
| [Catálogo digital](https://catalogopitterpanfesta.vercel.app/)   | Aplicação pública com endereço e deploy próprios. A gestão oferece uma prévia autenticada das coleções e atalhos para o catálogo público.                                                                 |
| Shopify Admin                                                    | Fonte dos pedidos online e do cadastro publicado no catálogo. Integrações de catálogo e vendas usam configurações distintas.                                                                              |
| PostgreSQL                                                       | Guarda snapshots do catálogo, pedidos sincronizados, fila de eventos, configurações, usuários, agenda e eventos administrativos.                                                                          |
| WinThor                                                          | ERP das lojas físicas. Vendas Loja, estoque por filial e transferências aguardam conexão com os dados do ERP.                                                                                             |
| GitHub e Vercel                                                  | O repositório versiona o código. A Vercel hospeda a produção a partir de `main`. O GitHub Actions verifica a documentação, formatação, tipos, testes, build e dependências com alertas altos ou críticos. |

Escolha ou troque a foto pelo avatar da barra lateral, em Configurações ou em Minha conta para perfis sem acesso administrativo. As iniciais aparecem quando a conta está sem foto. O navegador ajusta imagens de até 25 MB ao formato quadrado de 256 × 256 px, e o servidor armazena a foto privada em WebP no PostgreSQL. Em instalações existentes, execute `npm run db:migrate` antes de habilitar o recurso.

## 2. Mapa das telas

A barra global identifica a rotina e agrupa seus filtros logo ao lado. Em Pedidos, Pagamento, Atendimento, Entrega e Categoria do produto abrem seus próprios menus. As opções internas ficam à esquerda da faixa de navegação e o período fica à direita. Limpar os critérios mantém o período. Produtos, Ofertas e Estoque usam os grupos Categoria, Marca e Estoque e mantêm a busca por nome ou SKU na lista. Ofertas acrescenta Ordenação. Mapa de entregas e Imagens do catálogo também expõem seus critérios por categoria. Os menus sobrepõem o conteúdo e os campos GET mantêm vínculo com o formulário, a paginação e a exportação. O ícone de sair permanece na base da barra azul.

A Visão geral reúne os indicadores da Shopify, o gráfico financeiro em granularidade diária ou semanal, a composição de recebimentos, os cinco produtos mais vendidos por unidades e o calendário de recebimentos. A comparação diária com o período anterior aparece quando a sincronização fornece cobertura suficiente para o intervalo. A composição exibe proporções quando o líquido e o reembolsado formam uma divisão válida do valor recebido. O calendário apresenta valores por data do pedido. A metodologia de Recebimentos e Reembolsos continua em “Como os valores são calculados”.

| Menu ou tela           | Rota                                                               | O que faz e de onde vêm os dados                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login e recuperação    | `/login/`, `/recuperar-senha/`                                     | Entrada da equipe e solicitação de recuperação. O master usa credenciais configuradas. As contas da equipe ficam no banco.                                                                                           |
| Visão geral            | `/gestor/`                                                         | Indicadores, evolução de vendas e ranking por data. A fila Atenção agora considera as pendências do histórico importado. Também reúne categorias, estoque e mudanças de catálogo.                                    |
| Resumo Shopify         | `/gestor/vendas/resumo/`                                           | Indicadores e situação dos pedidos. Os cartões abrem o detalhe no período selecionado.                                                                                                                               |
| Vendas Shopify         | `/gestor/vendas/`                                                  | Lista de pedidos recentes com filtros, pagamento, entrega e itens. Exibe oito pedidos por página em uma tabela com rolagem interna. A conferência tem rolagem vertical na janela e horizontal na tabela de produtos. |
| Atendimento de pedidos | `/gestor/vendas/atendimento/`                                      | Fila de preparo e retirada, com detalhes do atendimento.                                                                                                                                                             |
| Recebimentos           | `/gestor/vendas/recebimentos/`                                     | Evolução diária do recebido e do líquido, com total em destaque, leitura por dia e consulta dos pedidos que compõem o resultado.                                                                                     |
| Estornos e reembolsos  | `/gestor/vendas/reembolsos/`                                       | Evolução e pedidos com reembolso total ou parcial, incluindo cancelados quando houver valor devolvido.                                                                                                               |
| Produtos mais vendidos | `/gestor/produtos-vendidos/`                                       | Ranking e consulta paginada de produtos e variantes vendidos, com busca e filtros.                                                                                                                                   |
| Mapa de entregas       | `/gestor/mapa/`                                                    | Agrupa destinos dos pedidos online por município e UF quando identificados.                                                                                                                                          |
| Vendas Loja            | `/gestor/winthor/balcao/`                                          | Área reservada para vendas de caixa por filial. A integração está pendente.                                                                                                                                          |
| Todos os produtos      | `/gestor/produtos/`                                                | Pesquisa, filtros e indicadores das variantes do catálogo publicado. A tabela tem rolagem interna e paginação com intervalo, total e botões Anterior e Próxima, também usados em Estoque e Ofertas.                  |
| Ofertas                | `/gestor/ofertas/`                                                 | Variantes em que o preço de comparação supera o preço atual.                                                                                                                                                         |
| Catálogos              | `/gestor/catalogos/`, `/gestor/[slug]/`                            | Coleções em cartões compactos, com ícones por categoria e ações para abrir, copiar ou compartilhar.                                                                                                                  |
| Alterações na Shopify  | `/gestor/alteracoes/`                                              | Compara publicações sucessivas. Exibe inclusão, ausência e campos modificados. Filtra pela detecção na sincronização e mostra a data Shopify quando disponível.                                                      |
| Estoque da Shopify     | `/gestor/estoque/`                                                 | Saldo agregado da última publicação. Classifica estoque baixo, sem estoque e indisponível conforme dados e limites configurados.                                                                                     |
| Estoque por loja       | `/gestor/winthor/estoque-por-loja/`                                | Área reservada para saldo por filial no WinThor. A integração está pendente.                                                                                                                                         |
| Transferências         | `/gestor/winthor/transferencias/`                                  | Área reservada para histórico de movimentações WinThor. A etapa inicial é mapear a fonte e uma amostra real.                                                                                                         |
| Agenda e fornecedores  | `/gestor/agenda/`, `/gestor/calendario/`, `/gestor/reunioes/[id]/` | Fornecedores, compromissos, calendário e reuniões. Permite importar uma exportação HTML de fornecedores do WinThor. Videochamada depende da configuração do Jitsi.                                                   |
| Análises Shopify       | `/gestor/analises/`, `/gestor/analises/checkouts/`                 | Submenu expansível na barra lateral com visão geral, vendas, checkouts, relatórios, atribuição e clientes, conforme as permissões e a disponibilidade na Shopify.                                                    |
| Relatórios             | `/gestor/relatorios/`                                              | Entrada para relatórios disponíveis ao perfil autenticado.                                                                                                                                                           |
| Sincronizações         | `/gestor/sincronizacoes/`                                          | Acompanha importação, validação e publicação do catálogo.                                                                                                                                                            |
| Minha conta            | `/gestor/minha-conta/`                                             | Informações da sessão e ações disponíveis para a própria conta.                                                                                                                                                      |
| Equipe                 | `/gestor/usuarios/`                                                | Gestão das contas da equipe e perfis. Acesso Admin.                                                                                                                                                                  |
| Configurações          | `/gestor/configuracoes/`                                           | Limites de estoque e informações de acesso e integração. Acesso Admin.                                                                                                                                               |

### Identidade e gráficos financeiros

A interface administrativa usa superfícies claras, azul-cobalto para navegação e ações, coral e amarelo da marca em destaques e cores semânticas com rótulos nos estados operacionais. A paleta da interface fica em `src/shared/styles/admin/brand.css` e as cores de gráficos legados e do mapa ficam em `src/shared/lib/admin/brand-colors.ts`.

A evolução financeira da Visão geral e do Resumo Shopify usa ECharts com renderizador SVG e os módulos de barras, linha, eixos e tooltip. O modo diário usa colunas arredondadas, e o semanal usa uma curva suave que passa pelos valores observados. Os dias sem dados permanecem sem valor. Na Visão geral, o período anterior pode ser exibido na leitura diária quando há cobertura. O gráfico oferece leitura por ponteiro e teclado. As animações decorativas continuam ajustáveis no rodapé. As APIs, as permissões e a agregação no servidor seguem as regras descritas abaixo.

## 3. Acesso e responsabilidades

- **Admin** pode acessar os módulos de operação, gerenciar Equipe e Configurações.
- **Gestor e Gerente de Compras** compartilham as permissões operacionais. Incluem vendas, análises, agenda e sincronização de catálogo. Os atalhos de administração são exclusivos do Admin.
- **Atendimento** tem acesso às telas liberadas para seu perfil, sem acesso aos indicadores financeiros e módulos WinThor. A proteção é validada nas rotas e no servidor.
- Os eventos de equipe e configuração registram ação, responsável e horário no banco. Esses registros ficam restritos aos fluxos administrativos; a antiga tela de versões foi removida. Credenciais não fazem parte dos registros de atividade.

## 4. Como os dados circulam

### Catálogo

1. A integração consulta produtos, variantes e coleções Shopify. A normalização preserva identificadores de produto e variante, SKU, preço, imagem, tipo, marca e saldo quando informado.
2. O importador prepara uma versão candidata e valida a carga. Na publicação, o ponteiro do catálogo ativo muda para a nova versão.
3. As telas do painel consultam o snapshot publicado. A comparação de alterações usa pares de versões da mesma loja.
4. No modo local sem banco, o painel pode usar os JSON de catálogo como referência. O estado da tela indica quando a fonte está indisponível ou quando o histórico depende de importação.

### Vendas Shopify

As telas de vendas abrem com um período móvel de 30 dias por padrão. O calendário permite escolher um dia ou intervalo e voltar à janela padrão.

Pedidos, visão geral, análises, destinos e histórico de alterações usam o mesmo seletor de período. As datas podem ser digitadas em DD/MM/AAAA ou escolhidas no calendário do painel. Os seletores de data única da agenda usam o mesmo padrão de popover e grade. O calendário mensal da agenda é uma visualização de compromissos.

1. A integração recebe os eventos de vendas e mantém uma fila persistente com tentativas. A rota de webhook valida assinatura e loja antes de registrar.
2. O processamento consulta a Shopify, atualiza pedidos e itens e registra o checkpoint. Repetições e interrupções podem ser retomadas pela fila.
3. A janela automática usa até 60 dias. Períodos anteriores consultam o histórico disponível no banco. O painel mostra o horário da última sincronização.
4. Valor líquido representa recebido menos reembolsos. Pagamento, cancelamento, atendimento e modalidade de entrega são dimensões distintas.
5. A fila Atenção agora tem escopo independente do filtro comercial. A modalidade local e a retirada exibem frete conforme o valor registrado no pedido.
6. O cron da Vercel está declarado para 09h UTC (06h de Brasília). A ativação depende de `CRON_SECRET`; confira a resposta da rota e os logs no ambiente de produção. A rota autenticada agenda um workflow exclusivo de vendas e responde 202: isso confirma aceitação, não conclusão. O workflow continua todos os lotes com checkpoint e exclusividade no banco, espera quando outro processo possui o lote e encerra com erro visível no workflow se atingir 2.000 lotes. A ação manual e os scripts continuam disponíveis aos perfis autorizados.
7. O ranking de clientes usa o mesmo histórico sincronizado e considera pedidos em BRL pagos ou parcialmente reembolsados, não cancelados nem de teste, com recebido maior que reembolsado e identificação Shopify do cliente. Mostra a última sincronização completa em Brasília, eventos pendentes e pedidos sem identificação. Uma sincronização ausente ou com mais de 26 horas gera aviso; esse horário não comprova conciliação integral com a Shopify. Use `npm run sales:audit-ranking -- AAAA-MM-DD AAAA-MM-DD` para comparar, somente em leitura, quantidades e valores líquidos de cada cliente. O comando retorna código 1 em divergências ou falha; não imprime nomes ou credenciais.

### Históricos operacionais

| Histórico                | Unidade de registro                   | Data exibida                                                             |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| Alterações na Shopify    | Diferença entre snapshots do catálogo | Detecção na sincronização e última atualização Shopify quando disponível |
| Sincronizações           | Execução ou publicação de catálogo    | Início e conclusão da importação                                         |
| Atividade administrativa | Evento de equipe ou configuração      | Data e hora do evento no banco                                           |

Para o horário exato da publicação do sistema, consulte o deploy associado ao commit na Vercel. A atividade administrativa mostra eventos registrados a partir das ações existentes do painel.

## 5. Transferências WinThor

### Primeira etapa, consulta de movimentações existentes

A documentação TOTVS descreve o relatório da rotina **1124 — Transferir produto entre filial/depósito**. Na aba **Relatório**, filtre filial de origem, filial de destino e período, ou localize pela nota fiscal de transferência. Confirme com a equipe quais rotinas e tipos de movimentação de fato cobrem o histórico da Pitter Pan. O formato disponível para exportação precisa ser validado na instalação. [Procedimento oficial TOTVS](https://centraldeatendimento.totvs.com/hc/pt-br/articles/1500012182141)

| Dado a confirmar na fonte                                       | Uso na Gestão Comercial                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ID da transferência ou chave estável da nota, série e filial    | Identificar a operação e evitar duplicidade ao reimportar                       |
| Códigos de origem e destino                                     | Mapear Floresta, América e Iririú e distinguir depósitos internos               |
| Data da movimentação e situação                                 | Filtrar por período e exibir cancelamentos e status fornecidos                  |
| Identificador da linha, código de produto, unidade e quantidade | Montar detalhes da operação e preservar linhas repetidas legítimas              |
| Como o relatório representa saída e entrada                     | Exibir uma transferência por operação, mesmo quando os dois movimentos aparecem |
| Período mais antigo disponível                                  | Definir a cobertura da carga inicial e informar lacunas                         |

Para homologar, use um relatório anonimizado com duas transferências, itens e quantidades, além de uma operação cancelada se houver. Valide os totais e as filiais com o relatório original. O painel deve importar em leitura, deduplicar reenvios e manter a origem, a cobertura e o horário da carga. Depois de confirmar o formato, a mesma estrutura pode receber um serviço WinThor disponível na instalação. **Estado atual:** a tela está preparada e a leitura de dados reais depende dessa amostra ou do contrato do serviço.

Vendas físicas serão tratadas em outra etapa. Para conciliar a Shopify com o WinThor, confirme como o ERP registra o número de pedido online. O canal da compra e a filial de atendimento devem ser campos distintos.

## 6. Mapa do código

| Caminho                                             | Responsabilidade                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/app/gestor/(dashboard)/`                       | Rotas e composição do painel. O layout exige sessão e fornece sidebar e janelas de conferência.              |
| `src/app/api/`                                      | Endpoints HTTP, autenticação, validação, respostas e integração de servidor.                                 |
| `src/shared/components/admin/`                      | Componentes do painel, calendário, tabelas, formulários, gráficos e conferência de pedidos.                  |
| `src/shared/lib/admin/` e `src/shared/lib/agenda/`  | Regras e utilitários compartilhados para filtros, períodos, estoque, links, relatórios e agenda.             |
| `src/shared/server/auth/`                           | Sessões, permissões, hashes de senha, limites e utilitários de autenticação.                                 |
| `src/shared/server/admin/`                          | Repositório de catálogo administrativo, indicadores e alterações.                                            |
| `src/shared/server/agenda/`                         | Consultas e persistência da agenda, fornecedores e reuniões.                                                 |
| `src/shared/server/shopify/`                        | Cliente Shopify, consultas de catálogo, cache e normalização.                                                |
| `src/shared/server/sales/`                          | Configuração e sincronização de pedidos, filtros, valores, atendimento, destinos, relatórios e persistência. |
| `src/shared/server/database/`                       | Pool, esquema do catálogo, importações e repositórios.                                                       |
| `src/shared/server/sync/` e `src/shared/workflows/` | Controle e execução da sincronização longa de catálogo.                                                      |
| `src/shared/server/http/`                           | Utilitários HTTP e implementação compartilhada de APIs de catálogo.                                          |
| `src/shared/styles/`, `public/` e `config/`         | Estilos, arquivos públicos, dados locais e mapeamento de coleções.                                           |
| `scripts/`, `tests/`, `.github/workflows/`          | Rotinas de implantação, manutenção e verificação.                                                            |

### Endpoints

| Endpoints                                                                                                          | Responsabilidade                                                           |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `/api/health/`                                                                                                     | Verifica que a aplicação responde.                                         |
| `/api/auth/login/`, `logout/`, `password/`                                                                         | Sessão e ações de senha, com validação de origem e acesso conforme a ação. |
| `/api/admin/overview/`, `products/`, `settings/`, `users/`                                                         | Resumo administrativo, pesquisa de produtos, limites e equipe.             |
| `/api/admin/agenda/`, `agenda/video/`, `campaigns/`                                                                | Agenda, reuniões e planejamento.                                           |
| `/api/admin/sales/`, `sales/customers/`, `sales/fulfillment/`                                                      | Listagem e consultas de vendas, clientes e conferência de itens.           |
| `/api/admin/analytics/`, `destinations/`                                                                           | Análises e destinos dos pedidos.                                           |
| `/api/admin/sync/`                                                                                                 | Dispara e acompanha sincronização de catálogo.                             |
| `/api/webhooks/shopify/sales/`, `/api/cron/sales/`                                                                 | Entrada assinada de eventos e processamento agendado autenticado.          |
| `/api/catalogs/[slug]/`, `/api/categories/[slug]/`, `/api/catalog-banner/[slug]/`, `/api/product-image/[variant]/` | Leitura de coleções, categorias e imagens para o catálogo.                 |
| `/api/cart/`, `/api/checkout/`                                                                                     | Operações de catálogo e checkout de acordo com o fluxo da vitrine.         |

## 7. Configuração, operação e publicação

- Use Node.js 24 e `npm ci`. Configure o arquivo de ambiente pelo modelo [.env.example](../.env.example) e rode `npm run dev` para abrir a gestão local. A porta padrão da gestão é 3001.
- `DATABASE_URL` configura o banco. `CATALOG_DATA_SOURCE` seleciona a fonte da vitrine. `NEXT_PUBLIC_CATALOG_URL` aponta para a aplicação pública.
- `SHOPIFY_*` configura catálogo. `SHOPIFY_SALES_*` configura vendas. `ADMIN_*` controla acesso inicial e sessão. `CRON_SECRET` protege o cron. `JITSI_BASE_URL` configura videochamadas.
- Execute `npm run db:migrate` para preparar o esquema principal e `npm run sales:migrate` para o módulo de vendas no banco correto. Execute `npm run admin:setup` no ambiente autorizado quando precisar preparar a conta inicial.
- Catálogo usa `shopify:sync`, `shopify:publish` e `shopify:report`. Vendas usa `sales:setup`, `sales:webhooks`, `sales:sync`, `sales:retry` e `sales:audit`. Consulte o [README](../README.md) e os scripts antes de operar em produção.
- Para validar alterações, rode `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:server`. O teste HTTP usa ambiente local com dados de teste. Confira o login, as permissões e a fonte de dados antes de considerar uma integração homologada.
- Segredos ficam nas variáveis do ambiente autorizado. Use dados fictícios ou anonimizados em testes e documentação.
- Após publicar, confira o status e o commit na Vercel e a resposta de `/api/health/`. Em caso de regressão, identifique o commit e restaure uma versão estável pela Vercel ou pelo histórico do repositório, levando em conta qualquer migração já aplicada.

## 8. Manutenção da documentação

1. Na mesma alteração de código, atualize este mapa com a rota, dados, permissões ou procedimento afetado.
2. O workflow executa `node scripts/check-system-docs.mjs` para verificar o mapa do sistema.
3. Confira o commit em execução na Vercel após o deploy. Alterações de produto e sincronização têm históricos próprios, conforme a seção 4.

## Imagens do catálogo

Em Catálogos → Imagens do catálogo, administradores podem selecionar imagens, converter todas as pendentes ou tentar novamente as que falharam. O histórico compara formato, dimensões e bytes antes e depois e registra o horário do processamento. A sincronização processa as imagens pendentes após publicar o catálogo. A versão WebP usa 1000 × 1000 px, fundo branco e enquadramento sem cortes.

Execute `npm run db:migrate` no PostgreSQL usado pelo catálogo e pela Gestão Comercial. A vitrine pública usa a foto convertida quando consulta o mesmo PostgreSQL em modo `postgres`. Fotos pendentes ou que falharam continuam disponíveis pelo arquivo original. O histórico consolida URLs de imagem compartilhadas entre variantes.

## Auditoria de 23/11/2026

Consulte [a auditoria técnica](AUDITORIA-2026-11-23.md) para evidências, correções e limitações da conferência. O Next.js está fixado em 16.4.6. A conexão PostgreSQL explicita `verify-full` quando a URL usa os aliases de verificação do pg 8 (`prefer`, `require`, `verify-ca`), preservando a validação atual de certificado. A opção explícita `uselibpqcompat=true` continua respeitada. Não registre URLs de conexão em logs.

## Identidade visual do painel — 24/11/2026

A Gestão usa uma base clara inspirada na organização do painel Healthy e no tratamento de gráficos do Insighta, adaptados para a identidade Pitter Pan. O tema usa fundo cinza frio, cards brancos, azul principal, grafite e coral avermelhado para destaques, sem rosa, verde ou lilás nos gráficos. Rótulos e valores acompanham as cores; o significado não depende só da cor.

- `src/shared/styles/admin/theme.css`: tokens semânticos, tipografia, navegação, superfícies, indicadores, controles e tabelas. Importado no layout autenticado depois dos estilos funcionais existentes.
- `src/shared/styles/admin/charts.css`: acabamento dos gráficos, grades discretas, seleção e barras. Mantém controles por teclado e redução de movimento.
- `src/shared/lib/admin/chart-style.ts`: paleta de séries e interpolação monotônica compartilhada. As curvas passam pelos pontos reais, sem criar picos/vales entre amostras. Valores ausentes continuam separando os trechos; um gráfico bonito não deve sugerir continuidade onde não há informação.
- `geist/font/sans`: fonte variável Geist distribuída pelo pacote oficial e servida localmente no build, sem requisição ao Google Fonts. A variável fica disponível no documento; a família é aplicada no tema administrativo.

No desktop, sidebar e conteúdo têm moldura discreta, sem faixa colorida superior. Em larguras menores, o tema preserva o menu móvel e remove a moldura para aproveitar a tela. Não altera regras financeiras, fontes de dados, permissões ou sincronização. A prévia temporária de teste usa somente dados fictícios locais; nenhum dado de demonstração é publicado ou gravado no banco da operação.


## Ambiente de trabalho — reformulação estrutural de 24/11/2026

A navegação administrativa usa dois níveis: uma barra fixa de módulos e um painel contextual de rotinas, recolhível no desktop e apresentado como gaveta no celular. A pesquisa localiza rotinas entre todos os módulos permitidos ao usuário. As permissões continuam centralizadas no servidor; itens futuros permanecem identificados como “Em breve”.

A visão geral usa 30 dias por padrão e separa indicadores comerciais, desempenho, fila de atendimento, prioridades e catálogo. Os gráficos de evolução permitem alternar colunas e áreas; a distribuição de estoque usa anéis concêntricos. O calendário mostra até 35 dias de pedidos pagos do período selecionado, com links para o dia e indicação explícita de dias sem cobertura confirmada. Não são usados valores demonstrativos em produção.

Arquivos estruturais: `workspace-navigation.ts` define os módulos e as regras de seleção; `WorkspaceNavigation.tsx` apresenta as duas camadas; `DashboardShell.tsx` controla a navegação e o foco; `workspace.css` contém o layout e seus pontos de quebra. `SalesActivity.tsx` apresenta o calendário. `document-theme.ts` preserva as classes de fontes e acessibilidade ao trocar os temas do catálogo.

Validação: testes automatizados de permissões, rotas, filtros e preservação de classes; compilação de produção e verificação HTTP. A homologação visual em navegadores e dispositivos reais continua necessária.


## Categorias de conteúdo e filtros — 24/11/2026

A visão geral agora renderiza exclusivamente a categoria selecionada em `secao`: desempenho, catálogo ou prioridades. As categorias são URLs reais, preservam o período e funcionam com recarga e histórico do navegador. Atendimento recebe somente a categoria catálogo. A publicação e o estoque são consultados na categoria catálogo; indicadores comerciais e pendências permanecem nas categorias permitidas.

`content-categories.ts` centraliza seleção, permissões e links entre as rotinas comerciais, produtos/catálogos/estoque, clientes, análises e administração. `ContentCategories.tsx` apresenta essa navegação abaixo do título. A sidebar mantém sua estrutura. A agenda continua renderizando uma área de cada vez, agora com sua navegação no conteúdo.

O período dos pedidos continua visível. `SalesFilterPanel.tsx` reúne os demais critérios em pagamento, atendimento, entrega e produto; apenas um assunto aparece por vez, com navegação por teclado, critérios removíveis e limpeza da seleção. A pesquisa textual de situação foi preservada dentro de pagamento. O status implícito de recebimentos/reembolsos não é transportado para outra rotina.

`FilterDisclosure.tsx` organiza filtros densos de outras páginas. Os campos permanecem montados mesmo recolhidos, preservando os formulários automáticos e seus valores. Consultas simples, como período do ranking, busca de catálogo e período de análises, continuam diretamente acessíveis. Datas das análises são preservadas ao abrir categorias ou relatórios.

`content.css` aplica superfícies claras, tipografia Geist e cores semânticas somente ao conteúdo administrativo; não altera a geometria nem os estilos da sidebar. O painel de desempenho usa quatro indicadores reais: recebido após reembolsos, pedidos pagos não cancelados, ticket desses pedidos e reembolsos dos pedidos do período. Valores de moedas diferentes permanecem separados. O calendário e a série principal continuam distinguindo ausência de dados de valores zero. Não há migração de banco nesta mudança.


## Central de prioridades — 24/11/2026

A categoria Prioridades tem componente e consulta próprios (`PrioritiesOverview.tsx` e `priority-queue.ts`), sem carregar o relatório financeiro. A antiga prévia de cinco pedidos e a repetição de indicadores foram substituídas por uma fila paginada de oito pedidos, cobrindo todo o histórico importado. As categorias Todas, A preparar e Retiradas prontas têm URLs próprias; a ordenação aceita mais antigos ou mais recentes e a paginação é recalculada quando necessário.

Contagens e linhas usam a mesma regra `awaitingFulfillmentSql`: loja correta, pedidos não teste, pagos ou parcialmente reembolsados com saldo positivo, sem cancelamento e ainda não atendidos. A consulta é executada em transação de leitura com snapshot consistente. A seleção de período permanece nos links de navegação, mas não limita esta fila.

O resumo compacto apresenta pedidos a preparar, retiradas prontas e a idade do pedido mais antigo. Cada linha mostra foto de um item ativo, título, quantidade de itens/unidades, cliente, data, valor original, situação, modalidade e conferência de atendimento. Ausência de imagem usa o placeholder existente. “Há N dias” mede dias de calendário em Brasília desde o pedido e não significa prazo vencido ou atraso de entrega. A sincronização ausente, antiga ou em andamento fica explícita.

`priorities.css` contém layout próprio, sem posicionamento absoluto nem áreas nomeadas de grid. A antiga regra global `#overview-pending { grid-area: pending }`, que criava colunas implícitas e deslocava o card, foi restrita ao componente legado. A sidebar e os outros módulos mantêm a estrutura. Nenhuma migração ou alteração de dados é necessária.


## Distribuição mundial de entregas — 24/11/2026

A seção de entregas foi reconstruída com duas categorias exclusivas: Mapa de entregas e Destinos detalhados. A navegação, os filtros e o período ficam registrados na URL. O período permanece visível; país, UF, modalidade, atendimento e busca ficam em filtros recolhíveis, com critérios removíveis. A seleção de país limpa a UF anterior; selecionar uma UF define Brasil.

O mapa mundial usa um card horizontal escuro, países/bandeiras e quantidades no topo, continentes em cinza e destaques em violeta nos países com pedidos. Não há bloco lateral de estado nem destaque artificial de países sem pedidos. Países com pedidos podem ser selecionados com mouse ou teclado para filtrar a consulta. O painel de cidades em destaque usa as mesmas linhas filtradas, com barras proporcionais às quantidades reais; a tabela detalhada tem oito destinos por página. Retiradas e destinos incompletos permanecem visíveis na contextualização.

`world-countries.json` contém contornos locais derivados da base Natural Earth 1:110m; fonte, transformação e limitações estão em `docs/data/world-map.md`. `world-deliveries.ts` agrega os países. Territórios pequenos sem contorno e pedidos sem país permanecem contabilizados na tabela e são identificados no card. O mapa indica distribuição por país, sem endereço individual. A imagem da geometria foi conferida com uma renderização estática de teste; a inspeção do aplicativo em navegador e dispositivos reais continua necessária.

`DeliveryMapView.tsx` apresenta um único mapa escuro: `DeliveryMap.tsx` usa Leaflet com cartografia pontilhada local em Canvas, projeção Web Mercator e agrupamento de cidades por distância na tela. Selecionar um país destacado aproxima seu contorno e exibe seus municípios localizados; clicar em um agrupamento aproxima os pontos, e clicar ou focar um ponto consulta pedidos/unidades. O botão de retorno limpa o país e volta ao mundo. `delivery-map-geometry.ts` projeta os contornos e identifica o país clicado por seus polígonos. A antiga URL `painel=cities` abre esse mesmo mapa, sem duplicação. `DestinationsDashboard.tsx` apresenta a organização completa da seção e mantém os filtros e os estados de carregamento/erro. O mapa mundial não depende de tiles, geocodificação, chaves ou novas bibliotecas. O filtro `country` é validado pela API e aplicado sobre o mesmo conjunto de destinos usado nos demais indicadores. Não há migração nem mudança de permissões.


## Atendimento fixado e navegação — 24/11/2026

Ao fixar uma janela de conferência à esquerda, a navegação atual (`workspace-navigation`) acompanha o mesmo deslocamento `--fulfillment-left-width` usado pela aplicação. A regra anterior abrangia somente a sidebar legada e deixava o menu atual atrás da janela. O deslocamento continua restrito ao modo de encaixe desktop, a partir de 1100px, e desaparece ao soltar ou fechar a janela. O cabeçalho atual também participa da quebra de linha usada quando há painéis fixados.

As larguras continuam sendo calculadas pelo gerenciador de janelas, inclusive durante redimensionamento e com painéis dos dois lados. Nenhuma mudança de dados, permissões ou migração foi necessária.


## Códigos permanentes de rotinas — 24/11/2026

Todas as entradas da navegação têm código explícito e único: faixas 1000 Início, 2000 Comercial, 3000 Catálogo, 4000 Estoque, 5000 Agenda, 6000 Análises e 7000 Sistema. O catálogo completo está em `docs/ROTINAS.md`. IDs são independentes do WinThor, da ordem de exibição e do perfil; rotinas planejadas mantêm a indicação de funcionalidade futura. Novos itens precisam de código livre e códigos retirados não devem ser reutilizados.

O mesmo registro alimenta menu, pesquisa, identificação do cabeçalho e badge junto ao título. Números usam Geist Mono, enquanto os textos mantêm Geist Sans. A pesquisa aceita código, prefixo, nome e combinações; Enter abre um único resultado permitido ao perfil, usando os links existentes e preservando as regras de contexto comercial. `activeRoutine` centraliza a identificação de rotas e subvisões. Não foram alterados caminhos, regras de acesso ou banco de dados.

O mapa unificado não requisita tiles externos. Coordenadas continuam aproximadas por município brasileiro; destinos sem coordenadas permanecem na tabela e não recebem pontos inventados. A base Natural Earth é simplificada e não serve para navegação de ruas. Não é necessária migração.

### Fotos na fila de pedidos — 25/11/2026

A fila consultava somente `pitterpan_sales_items.image_url`: pedidos históricos sem essa informação exibiam o espaço reservado, mesmo com foto disponível no catálogo. `sales/product-photos.ts` prefere a foto atual do catálogo ativo da mesma loja e preserva a histórica como alternativa, por ID exato da variante (ou produto quando não há variante). Para catálogo Shopify ao vivo, `loadPriorities` consulta em lote apenas os IDs da página, com cache de cinco minutos e prazo de 2,5 segundos para essa consulta opcional, depois de liberar a transação do banco. Prefere imagem da variante e recorre à principal do produto. Não compara títulos/SKUs e não usa importações antigas ou outra loja. Ausência real ou integração indisponível preservam as imagens históricas disponíveis e, como último recurso, o placeholder, sem bloquear a fila. URLs passam pelo validador de mídia Shopify. Não há migração nem alteração de pedidos/produtos na Shopify.

Limite da auditoria: a consulta direta à Shopify foi concluída na rechecagem abaixo; a URL histórica efetivamente salva no banco de produção e o resultado visual autenticado no painel não foram inspecionados.

### Rechecagem das fotos da fila — 25/11/2026

A primeira correção cobria somente URLs vazias, mantendo URLs históricas preenchidas mesmo quando o arquivo deixava de carregar. A fila agora prefere a imagem atual da mesma variante/produto e preserva a anterior como alternativa. A consulta usa `ProductVariant.media` e `Product.featuredMedia`, validada na API Shopify 2026-10. `ProductThumbnail` tenta a versão reduzida, a original sem redimensionamento e a imagem alternativa antes do placeholder; reinicia a sequência quando as URLs mudam e interrompe tentativas no último recurso. Pedidos sem imagem recebem a indicação “Sem foto disponível”.

Auditoria direta da Shopify: PP-1022 (SKU 1834) e PP-1043 (SKU 1884) possuem foto atual na mídia principal do produto; ambas as variantes estão sem mídia própria. As duas URLs atuais responderam HTTP 200, inclusive com `width=120`. PP-1039 (SKU 2481) retorna imagem, produto e variante nulos na linha do pedido: não há associação atual para recuperar sua foto por ID. Esse resultado comprova ausência do vínculo, mas não distingue sozinho exclusão do produto de uma linha personalizada. A busca atual pelo SKU 2481 também não encontrou variantes. Não será vinculada automaticamente uma foto por semelhança de título ou reutilização de SKU. Não houve alteração de pedidos ou produtos na Shopify.

A sessão do painel ainda exige autenticação; a URL histórica efetivamente salva no banco de produção não foi inspecionada. A hipótese de URL antiga deve permanecer distinta da evidência confirmada de foto atual disponível. Sem migração.

### Agenda da equipe — calendário reformulado em 25/11/2026

A rotina 5001 mantém os mesmos dados, permissões e endpoints de agenda, fornecedores, notas e videochamadas. O calendário passou a ter composição própria em `calendar-premium.css`, com navegação compacta, resumos reais do mês, visões Mês/Lista e painel do dia selecionado ao lado da grade. Abaixo de 1250px o painel desce; em larguras de celular a grade mantém sete colunas sem largura mínima fixa e usa indicadores compactos, com títulos completos no painel do dia ou na lista.

`MeetingCalendar.tsx` coordena a seleção e os formulários. `CalendarMonth.tsx`, `CalendarDayPanel.tsx` e `CalendarScheduleList.tsx` separam grade, consulta do dia e programação mensal. Selecionar um dia consulta a programação; os botões Novo compromisso e + abrem o cadastro. As setas do teclado, Home e End navegam pelos dias; navegar por um dia adjacente troca o mês. O botão Hoje retorna à data atual de Brasília. Datas ocultas, planejamento de ocasiões, compromissos concluídos/cancelados e links de reunião continuam acessíveis. Cancelados não ocupam a grade/lista principal, mas permanecem no detalhe do dia.

`CalendarEditorDialog.tsx` usa diálogo nativo, contenção de foco, fechamento por Escape e devolução do foco ao acionador. O seletor de data consome Escape antes do diálogo externo. Durante gravação o diálogo não fecha. Ao carregar outro mês, `AgendaWorkspace` mantém o calendário montado, separa o mês carregado do solicitado e não mostra zeros como se fossem contagens confirmadas. Consulta externa ao banco e lógica de persistência não foram alteradas. Os helpers de calendário tratam seleção entre meses, navegação por teclado, sobreposição mensal com fim exclusivo e continuidade de compromissos noturnos.

Verificação visual executada em uma prévia isolada com componentes e estilos reais, compromissos fictícios e adaptador de rotas apenas para a prévia. Foram conferidos desktop, viewport de 390px, ausência de overflow horizontal, diálogo, seletor de data, retorno de foco, setas, troca de mês e Hoje. Não foram criados compromissos ou alterados dados no ambiente de produção. A prévia não substitui validação da sessão autenticada no site. Sem novas dependências ou migração de banco.


### Consulta direta de pedidos e destinos — 25/11/2026

O botão “Refinar consulta” e os assuntos aninhados foram retirados de vendas e do mapa de entregas. `SalesFilterPanel` mostra diretamente Pagamento, Atendimento, Entrega e Categoria, com rótulos permanentes e seleção atual visível. A busca textual duplicada por situação foi removida; o seletor conserva os estados suportados e só mostra o estado legado NO_MATCH quando já selecionado. Recebimentos e reembolsos exibem apenas entrega/categoria, preservando seu escopo financeiro. O período permanece no cabeçalho e não é redefinido por Limpar filtros. Mudanças continuam combinadas, automáticas e reiniciam a paginação; categoria mantém o debounce existente.

Destinos usa a mesma apresentação para país, UF, entrega, atendimento e busca por local. Selecionar UF mantém o vínculo com Brasil; mudar país limpa UF. Chips removem critérios individualmente e Limpar filtros remove apenas os critérios adicionais. O mapa e os endpoints permanecem iguais. `query-filters.css` organiza os controles em quatro, duas ou uma coluna conforme a largura, sem recortar os menus. Sidebar e categorias de navegação não foram alteradas. Sem novas dependências ou migração de banco.

Validação: 133 testes, build de produção e testes HTTP autenticados com dados isolados, incluindo ausência dos controles financeiros indevidos. Prévia isolada com os componentes reais verificou combinação, remoção individual, limpeza preservando datas, navegação por teclado e largura de 390px sem overflow horizontal. Não houve alteração de dados de produção; a sessão autenticada online não foi inspecionada.

### Módulos comerciais e resumo Shopify — 25/11/2026

A área Comercial passa a exibir os módulos Visão geral, Pedidos, Financeiro, Clientes e Entregas no menu. Pedidos contém Lista de pedidos e Atendimento; Financeiro contém Recebimentos e Estornos/reembolsos. `commercial-modules.ts` é o contrato compartilhado pelo menu e pelas opções internas. As rotinas 2001–2008 preservam seus códigos e URLs; a busca por nome/código continua encontrando as funções internas. O cabeçalho e o item ativo da sidebar permanecem no módulo enquanto as opções internas mudam. O estilo e a geometria da sidebar permanecem os mesmos. Não há mais a faixa com cinco destinos comerciais repetida em todas as telas, nem o atalho de Clientes para Entregas no conteúdo.

As opções internas mantêm período, categoria e modalidade compatíveis, descartando paginação e cursores. Pagamento e atendimento são mantidos entre as visões de Pedidos. Cada visão financeira aplica seu próprio escopo (CASH_FLOW ou REFUNDS) e ignora atendimento, evitando filtro invisível herdado. As permissões continuam exigidas no servidor; agrupar o menu não cria acesso a novas rotinas.

`ShopifySummary.tsx` substitui os antigos blocos do Resumo Shopify: quatro indicadores, gráfico real de recebido/líquido, conferência financeira e situações da operação. A apresentação usa azul, grafite, cinza e coral, com contraste próprio para os cartões escuros. O resumo solicita a série diária à API existente, na mesma seleção dos totais. Moedas são selecionadas individualmente, sem somar valores entre moedas. Não exibe variação percentual fictícia ou comparação sem cobertura. Dias ausentes permanecem desconhecidos fora da janela automática concluída, durante importação parcial e no dia atual. Totais não mudam de definição: recebido inclui frete/impostos; líquido é recebido menos reembolsado; datas são as dos pedidos, não as dos pagamentos; cancelamento não equivale a estorno. Informações da importação ficam no rodapé e os alertas de dados parciais/divergências permanecem visíveis.

Gráfico, controles e cartões usam componentes e dados existentes; sem nova dependência, migração ou alteração dos pedidos da Shopify. O agrupamento modular desta entrega se aplica à área Comercial; Catálogo, Estoque, Agenda, Análises e Sistema conservam suas rotinas atuais.

Na visão geral sem critérios adicionais, apenas o período e a moeda são necessários: os filtros detalhados ficam em Pedidos/Financeiro. Links antigos de resumo com situação, categoria, modalidade ou atendimento continuam funcionando e mostram os controles aplicados, evitando um indicador filtrado sem indicação visível.

Validação desta entrega: 136 testes de domínio, build de produção, TypeScript, formatação e testes HTTP de permissões/rotas antigas e dos módulos, incluindo resumo com filtros explícitos e ausência de atendimento oculto nas visões financeiras. Prévia isolada com componentes reais e dados fictícios conferiu composição desktop, contraste do indicador escuro, modos linha/barras, troca recebido/líquido, contexto e período entre as opções financeiras e largura de 390px sem overflow. Nenhum pedido ou pagamento foi alterado durante a validação visual.


### Identidade visual azul e coral — 25/11/2026

A identidade da gestão usa a referência de azul profundo #023661, quase preto #0A0C12, grafite #3F3A42 e cinza #76828E. O laranja da referência foi adaptado para coral avermelhado #C4473D. Fundos claros e cinzas derivados equilibram o contraste; a paleta dos gráficos não introduz verde, rosa ou lilás. `brand.css`, importado após os estilos legados no layout protegido, define os tokens da identidade e os aplica à sidebar, navegação, cabeçalhos, seletores, agenda e mapa. Os seletores ficam sob `.admin-app.workspace-shell`, preservando os temas dos catálogos públicos e do login.

O Resumo Shopify usa azul profundo no indicador principal, azuis nos gráficos e coral nos destaques. `query-filters.css` segue os mesmos azuis. `brand-colors.ts` concentra as cores usadas por SVG/canvas: `chart-style.ts`, legendas financeiras e níveis do mapa de destinos. O mapa permanece único e mantém as regras de agrupamento/zoom; apenas sua paleta muda. As cores complementam rótulos e valores, sem substituir nomes de situações. Não há alteração de navegação, cálculos, filtros, dados, permissões ou dependências; sem migração.

Validação: 136 testes, TypeScript, build, formatação e testes HTTP do painel passaram. Prévia isolada com componentes reais verificou os estilos calculados do cartão principal (azul #023661 com texto branco) e do destaque coral, gráfico azul em linha/barras e viewport de 390px sem overflow horizontal. Contrastes de branco sobre azul/coral são, respectivamente, 12,33:1 e 4,87:1; isso não equivale a uma auditoria de contraste de todos os estados do sistema. A verificação visual não gravou dados.


### Paleta estrita, sem rosa/lilás/verde — 25/11/2026

A revisão anterior ainda permitia fundos rosados em estados de reembolso/cancelamento e tons próprios em análises, calendário e ícones sazonais do catálogo. Esta revisão elimina esses tons de todos os estilos da gestão e dos ícones SVG administrativos. Azul #023661, quase preto #0A0C12, grafite #3F3A42, cinza #76828E e coral avermelhado #C4473D passam a ser as referências. Branco e cinzas neutros compõem as superfícies; os azuis derivados ficam nos gráficos/seleções. Fundos de destaque deixam de misturar coral com branco, pois essa mistura gerava rosa. Reembolsos e alertas usam coral sólido como detalhe sobre fundo neutro. Sucesso/pagamento confirmado usa azul, preservando o rótulo do estado.

Classes legadas `rose`, `violet`, `green` e `amber` permanecem como identificadores de estados, mas já não definem rosa, lilás, verde ou amarelo. `brand.css` também cobre os aliases do CSS administrativo de base, sem alterar login. Ícones do catálogo e de entrega seguem a mesma paleta; fotos de produtos, logotipo e bandeiras preservam suas imagens reais. Não há alteração de filtros, valores, status, permissões ou navegação. Sem dependências ou migração.

Validação: 136 testes de domínio, TypeScript e build de produção passaram; testes HTTP conferem rotas e isolamento. A revisão estática cobriu todos os estilos de `styles/admin`, exceto o tema separado de login, e as cores inline dos ícones administrativos. Prévia isolada confirmou que reembolsos têm fundo RGB(248,248,248) e cancelamentos RGB(251,251,251), ambos neutros, com detalhes em azul/coral. Não foram alterados dados ou imagens reais de produtos.


### Padrões financeiros de gráficos — 25/11/2026

O resumo comercial adapta a referência de fluxo, anel e evolução com barras/linha à identidade azul, quase preto, grafite, cinza e coral avermelhado. `FinancialFlowChart` mostra recebido menos reembolsado e líquido na mesma moeda/filtros. As linhas de fluxo são ilustração da relação financeira; as proporções estão no anel e nos percentuais explícitos. Os valores permanecem os do servidor e os cartões abrem as respectivas consultas financeiras. Não são apresentados lucro, margem, CAC, metas ou previsões sem dados que sustentem esses indicadores.

`financialComposition` admite anel somente com base recebida positiva, valores válidos e reembolso entre zero e recebido. Sem base, valores inválidos, líquido divergente ou reembolso superior ao recebido, a proporção não é desenhada; as mensagens explicam a situação. `SalesTrendChart` ganha opção combinada no resumo: barras e curva representam o mesmo indicador diário, declarado na legenda. Linha/barras isoladas e alternância recebido/líquido permanecem disponíveis. As outras telas mantêm a apresentação anterior. Dias desconhecidos e valores negativos preservam o tratamento existente.

O fluxo usa SVG decorativo com valores em HTML e links acessíveis. Em celular, as linhas decorativas cedem lugar ao anel e aos valores em blocos legíveis. Sem novas dependências, alteração de dados ou migração.

Validação: 137 testes, TypeScript e build, incluindo composição integral, parcial, sem recebimento, reembolso excedente e dados inválidos. Prévia isolada dos componentes reais conferiu desktop e viewport de 390px sem overflow horizontal, presença simultânea de barras e curva no modo combinado, alternância recebido/líquido e consulta por setas do teclado. Os testes HTTP preservam as rotas/permissões do painel; não houve alteração de pedidos ou pagamentos.


### Resumo comercial em bento — 25/11/2026

A composição anterior foi substituída por uma grade bento de 12 colunas e componentes novos, sem reutilizar `SalesTrendChart` no resumo. `BentoRevenueChart` é o gráfico principal, agora sobre a base compartilhada de colunas e áreas em fundo grafite; alterna Recebido/Líquido e Dia/Semana, permite consultar valores por ponteiro ou setas e preserva negativos. `BentoComposition` usa anéis concêntricos para líquido e reembolsado sobre o recebido. `BentoActivity` mostra calendário de intensidade, com seleção e valor exato de cada dia. Blocos menores apresentam pedidos pagos, ticket e pendências; blocos intermediários mostram conferência financeira e exceções. Abaixo de 980px a grade se reorganiza; em celular os gráficos ocupam a largura disponível e os indicadores menores ficam em pares.

`bento-series.ts` agrupa semanas por segunda-feira, incluindo mudanças de ano, e não converte dias sem cobertura em zero. Uma semana com algum valor desconhecido permanece sem total completo. O calendário diferencia valor zero de ausência de dados e mostra no máximo os últimos 35 dias da seleção, com essa limitação explícita no próprio bloco; isso não altera os totais do período. Moedas continuam separadas. As regras de composição financeira e os alertas existentes são preservados; não há previsão, lucro ou comparação fictícia.

O antigo painel de fluxo e seus estilos (`FinancialFlowChart`, `financial-patterns.css`, `shopify-summary.css`) foram retirados. `SalesTrendChart` permanece nas telas financeiras, sem mudar o comportamento delas. Sidebar, filtros, endpoints, permissões e dados da Shopify não foram alterados. Sem novas dependências ou migração.

Validação: 139 testes, TypeScript e build de produção. Os novos testes conferem agrupamento semanal entre anos, totais com dados desconhecidos, valores negativos, alinhamento de calendário e janela de 35 dias. Prévia isolada com componentes reais verificou a grade desktop, seleção de semana por teclado, leitura do dia no calendário e viewport de 390px sem rolagem horizontal. As rotas protegidas e o isolamento permanecem cobertos pelos testes HTTP. Nenhum pedido, pagamento ou produto foi alterado.

A Visão Geral inicial também usa os novos gráficos em `BentoPerformance`, alimentados pelo mesmo snapshot comercial já carregado pelo servidor. O gráfico antigo de performance foi substituído ali; os atalhos de indicadores e os avisos da importação permanecem. O calendário passa a mostrar valores recebidos por data do pedido, com esse nome explícito, sem misturar moedas. O resumo e o início compartilham os mesmos componentes de colunas, composição e intensidade.


### Gráficos por finalidade — 25/11/2026

Todos os pontos de entrada que exibem gráficos na Gestão compartilham a família de infográficos: Visão Geral e Resumo Shopify, recebimentos e reembolsos, visão executiva e relatórios do Analytics, composição do catálogo e estoque. A sidebar permanece com a estrutura existente. O mapa de entregas continua sendo a visualização geográfica única, com sua interação e paleta já definidas.

- `InfographicTimeline.tsx`: colunas com marcadores e área linear sobre tela grafite, leitura exata por clique/toque e setas, comparação anterior tracejada quando fornecida. Eixos incluem negativos; zero tem altura zero e lacunas desconhecidas não são conectadas.
- `InfographicRadial.tsx`: anéis concêntricos com base explícita, legenda selecionável e retorno à base. Até nove anéis; a legenda conserva todos os grupos. Base zero, dados incompletos, negativos ou composição financeira divergente desabilitam proporções.
- `InfographicRanking.tsx`: comparação por barras com marcadores, valores assinados, paginação de seis grupos e participação opcional. O denominador considera todos os grupos retornados, sem recalcular a proporção por página. A interface informa que isso não é o universo de toda a fonte. Taxas, médias, horas e razões não recebem participação somada.
- `SessionJourney` em `AnalyticsCharts.tsx`: funil de sessões, carrinho, checkout e compra, com proporções sobre sessões. Sequências inconsistentes da fonte mantêm seus valores e recebem aviso.
- `infographics.css`: acabamento compartilhado e organização bento dos conjuntos financeiro e catálogo/estoque. `infographic.ts` concentra domínios, validação de proporções e paleta derivada azul/grafite/coral. Os gráficos 3D decorativos e controles duplicados foram substituídos.

`BentoRevenueChart`, `BentoComposition`, `SalesTrendChart`, `RevenueChart`, `InteractiveColumns`, `PartyChart`, `StockOverview` e `FinanceOverview` consomem essa base. O agrupamento Dia/Semana e a distinção entre dados desconhecidos e zero do Resumo continuam preservados. Fontes, consultas, permissões, moedas, filtros, exportações e critérios financeiros não são alterados por esta reformulação. Nenhuma migração ou nova dependência é necessária.

Validação: 141 testes unitários, tipos, build e rotas HTTP; prévia dos gráficos com teclado, troca de estilo, participação, paginação, valores negativos, ausência de dados e largura de celular de 390 px, sem transbordamento horizontal. Dados da prévia são fictícios e não integram o código de produção.

A conferência online também removeu o limite legado de 740 px da seção de recebimentos: o gráfico financeiro usa toda a largura do módulo, sem moldura externa duplicada. Havendo várias moedas, cada gráfico continua separado e a grade adapta o número de colunas à largura disponível.


### Geometria da referência de infográficos — 25/11/2026

A segunda revisão segue mais de perto a linguagem visual da referência enviada: fundo grafite pontilhado, divisórias finas, ícones centrais, rótulos com linhas de chamada e gráficos em SVG próprios. A estrutura da sidebar e a paleta azul/grafite/coral permanecem. O novo `reference-charts.css`, após a base de gráficos, controla a apresentação compacta; não altera catálogos públicos nem login.

`InfographicRadial` oferece três desenhos: leque de setores de ângulo constante e área proporcional ao valor para categorias, círculos segmentados para composição financeira e arcos espessos sobrepostos para estoque. Ícones e rótulos são decorativos ou descritivos; percentuais são calculados da base informada. A seleção por clique ou teclado preserva os links para os produtos da categoria e os filtros de estoque. Valores negativos, base zero e dados incompletos continuam sem proporção artificial.

`InfographicPeaks` compara até seis grupos por página com triângulos de base constante e altura proporcional ao valor. A escala é definida sobre todos os grupos retornados, permanecendo constante entre páginas; o leque também mantém o mesmo máximo. `reference-geometry.ts` concentra o desenho dos setores, a escala por área dos leques e os picos assinados. Os testes verificam proporcionalidade de área, setores pequenos e de 360 graus, zero e negativos.

`InfographicJourney` desenha as etapas de conversão em arcos sobrepostos com a mesma base de sessões. As etapas não são somadas nem tratadas como fatias exclusivas; valores inconsistentes preservam os números e recebem aviso.

A evolução temporal agora abre em picos triangulares, com opção de colunas e área, mantendo as datas, agrupamento semanal quando disponível e as lacunas desconhecidas. O valor inicial destacado é o maior valor real da série, identificado pela data; a seleção passa a mostrar o dia consultado. O calendário de intensidade conserva seus dados e passa a usar marcadores circulares. A composição bento do Resumo e da Visão Geral usa os novos desenhos. A mudança não cria dados, dependências ou migrações.

Verificação: 143 testes unitários, TypeScript, formatação, build e testes HTTP; prévia desktop e largura de celular de 390 px sem rolagem horizontal, seleção dos setores, paginação, consulta dos picos por teclado, estados sem base e dados ausentes. As figuras de teste usam dados fictícios fora do repositório.


### Miniaturas nos pedidos e identificação de entregas — 26/11/2026

A lista de pedidos recentes, recebimentos e reembolsos passa a apresentar uma coluna Produtos com até três fotos por pedido, o primeiro título, quantidade de itens e unidades originais. Pedidos com mais itens mostram +N; o detalhamento completo continua em Conferir itens. Sem itens importados há um aviso, e fotos indisponíveis usam o fallback existente de `ProductThumbnail`.

`order-previews.ts` lê apenas os oito pedidos da página e no máximo três linhas de cada um, com contagens calculadas sobre todos os itens originais. As fotos usam o registro do pedido e o catálogo ativo da mesma loja, por ID exato de variante/produto. A imagem histórica continua como alternativa. O resultado fica em `orderPreviews`, separado dos dados financeiros e da paginação dos pedidos. Uma consulta opcional à Shopify para fotos ausentes ocorre após liberar a conexão do banco, com timeout e fallback; falha de foto não impede abrir a lista. Não há migração ou mudança de pedidos/valores.

`OrderProductPreview.tsx` apresenta as miniaturas e títulos. `order-media.css` adapta a coluna a telas estreitas com a rolagem da tabela já existente. `DeliveryMark.tsx` diferencia os veículos por cores: Sedex amarelo/azul, PAC azul, Jadlog vermelho e motoboy coral com caixa dourada; a loja de retirada tem toldo dourado. As cores se restringem às ilustrações; rótulos e classificação de entrega são preservados.

O teste das miniaturas verifica limite de três, total original dos itens, seleção somente dos pedidos solicitados, fallback histórico e isolamento entre lojas mesmo com IDs iguais. Validação: 144 testes unitários, tipos, formatação, build e rotas HTTP passaram. A prévia verifica miniaturas, fallback de imagem e largura de 390 px sem transbordamento horizontal da página.

### Organização das consultas · 26/11/2026

A barra local separa ações da rotina dos atalhos gerais. Período, atualização de pedidos e filtros ficam no conteúdo. “Filtrar” abre e recolhe os critérios no fluxo da página; Escape recolhe a área e devolve o foco ao botão, sem fechar seletores que trataram a tecla. Os controles comerciais passaram depois à disposição compacta descrita na seção seguinte.

Na lista de pedidos, “Conferir itens” aparece na coluna Pedido, abaixo do número e da data, seguindo o padrão financeiro. A coluna de entrega mostra somente modalidade, frete e atendimento. Fotos dos produtos, ícones coloridos, paginação e janelas de conferência mantêm seu funcionamento.

### Filtros comerciais e período · 26/11/2026

Nos módulos de Pedidos, Financeiro e Visão geral comercial, os critérios da consulta ficam diretamente visíveis no topo do conteúdo, sem botão expansível. Pagamento, atendimento, entrega e categoria ocupam uma linha compacta; o Financeiro mantém somente os critérios compatíveis com o módulo. Logo abaixo, as opções internas ficam à esquerda e o calendário à direita da mesma faixa. A atualização de pedidos, quando disponível, acompanha o período. Em telas estreitas, os campos se reorganizam e o período passa à linha seguinte sem encobrir as abas. Os chips aparecem apenas quando existem critérios adicionais, mantendo a limpeza individual e geral e preservando o período. As demais rotinas mantêm sua barra de consulta.

O cabeçalho global mantém somente a identificação da tela e o controle da navegação. Os atalhos da direita (sincronização, catálogo público e perfil) foram removidos. Sincronizações, Catálogos e Minha conta continuam acessíveis nas rotinas do menu, e o encerramento da sessão permanece no ícone da base da barra azul. A renderização do cabeçalho deixa de consultar a configuração do catálogo e as solicitações de recuperação apenas para compor esses atalhos.

### Posição dos filtros na barra do sistema · 26/11/2026

Pagamento, Atendimento, Entrega e Categoria ficam na barra global superior, ao lado da identificação da rotina, no espaço liberado pela remoção dos atalhos da direita. O conteúdo deixa de ter um cartão de filtros acima das abas. O calendário permanece à direita das opções internas do módulo. Os critérios continuam controlados pelo estado da consulta; trocar ou limpar um filtro preserva o período. O botão de limpeza geral permanece acessível na barra. Em larguras menores, os campos se reorganizam na própria barra sem encobrir a navegação.

### Categorias de filtros no cabeçalho · 26/11/2026

As opções ficam recolhidas em categorias clicáveis no cabeçalho, sem cartões de filtros no conteúdo. Pedidos e Financeiro usam os critérios aplicáveis ao módulo; Produtos, Ofertas e Estoque têm Categoria, Marca e Estoque. Em Entregas, o grupo Destinos reúne os critérios geográficos e operacionais. Clientes, Análises, Histórico de alterações, Catálogos, Imagens e Checkouts mantêm período, busca ou filtros no cabeçalho, conforme a rotina. O calendário de Pedidos e Financeiro continua junto às abas internas.

Os campos de formulários GET permanecem no formulário original: apenas os botões dos grupos são movidos. Os painéis usam popovers ancorados no botão, com Escape, fechamento ao clicar fora, foco de entrada e limites da tela. Menus de seleção mantêm navegação por teclado e sinalizam critérios ativos. Exportações e pesquisas únicas são preservadas.
