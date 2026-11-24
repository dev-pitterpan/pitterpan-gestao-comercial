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

No painel do administrador e do gerente, os títulos e os filtros de consulta ficam logo abaixo da barra global. A data da Visão geral controla os indicadores de vendas. A metodologia de Recebimentos e Reembolsos fica disponível em “Como os valores são calculados”.

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

A Gestão usa uma base clara inspirada na organização do painel Healthy e no tratamento de gráficos do Insighta, adaptados para a identidade Pitter Pan. O tema não usa lilás: fundo cinza frio, cards brancos, azul principal, turquesa complementar, verde positivo, âmbar de atenção e coral para devoluções/alertas. Rótulos e valores acompanham as cores; o significado não depende só da cor.

- `src/shared/styles/admin/theme.css`: tokens semânticos, tipografia, navegação, superfícies, indicadores, controles e tabelas. Importado no layout autenticado depois dos estilos funcionais existentes.
- `src/shared/styles/admin/charts.css`: acabamento dos gráficos, grades discretas, seleção e barras. Mantém controles por teclado e redução de movimento.
- `src/shared/lib/admin/chart-style.ts`: paleta de séries e interpolação monotônica compartilhada. As curvas passam pelos pontos reais, sem criar picos/vales entre amostras. Valores ausentes continuam separando os trechos; um gráfico bonito não deve sugerir continuidade onde não há informação.
- `geist/font/sans`: fonte variável Geist distribuída pelo pacote oficial e servida localmente no build, sem requisição ao Google Fonts. A variável fica disponível no documento; a família é aplicada no tema administrativo.

No desktop, sidebar e conteúdo têm moldura discreta, sem faixa colorida superior. Em larguras menores, o tema preserva o menu móvel e remove a moldura para aproveitar a tela. Não altera regras financeiras, fontes de dados, permissões ou sincronização. A prévia temporária de teste usa somente dados fictícios locais; nenhum dado de demonstração é publicado ou gravado no banco da operação.


## Ambiente de trabalho — reformulação estrutural de 24/11/2026

A navegação administrativa usa dois níveis: uma barra fixa de módulos e um painel contextual de rotinas, recolhível no desktop e apresentado como gaveta no celular. A pesquisa localiza rotinas entre todos os módulos permitidos ao usuário. As permissões continuam centralizadas no servidor; itens futuros permanecem identificados como “Em breve”.

A visão geral usa 30 dias por padrão e separa indicadores comerciais, desempenho, fila de atendimento, prioridades e catálogo. O gráfico principal permite alternar linha e barras; a distribuição de estoque usa um semicírculo. O calendário mostra até 35 dias de pedidos pagos do período selecionado, com links para o dia e indicação explícita de dias sem cobertura confirmada. Não são usados valores demonstrativos em produção.

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
