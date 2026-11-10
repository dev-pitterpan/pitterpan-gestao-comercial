# Gestão Comercial Pitter Pan Festas

Mapa funcional e técnico do painel da Floresta, América e Iririú. A versão e a data de registro de cada mudança ficam em [system-releases.json](../src/shared/config/system-releases.json) e aparecem em **Administração → Versões e atualizações**.

## 1. Ambientes e fontes

| Componente | Responsabilidade |
| --- | --- |
| [Gestão Comercial](https://pitterpangestaocomercial.vercel.app/) | Painel autenticado. Next.js App Router, React, TypeScript e PostgreSQL. |
| [Catálogo digital](https://catalogopitterpanfesta.vercel.app/) | Aplicação pública com endereço e deploy próprios. A gestão oferece uma prévia autenticada das coleções e atalhos para o catálogo público. |
| Shopify Admin | Fonte dos pedidos online e do cadastro publicado no catálogo. Integrações de catálogo e vendas usam configurações distintas. |
| PostgreSQL | Guarda snapshots do catálogo, pedidos sincronizados, fila de eventos, configurações, usuários, agenda e eventos administrativos. |
| WinThor | ERP das lojas físicas. Vendas na loja, estoque por filial e transferências aguardam conexão com os dados do ERP. |
| GitHub e Vercel | O repositório versiona o código. A Vercel hospeda a produção a partir de `main`. O GitHub Actions verifica a documentação, tipos, testes e build. |

O avatar na barra lateral permite escolher, trocar ou remover a foto da própria conta. A foto é privada e armazenada no PostgreSQL em tamanho reduzido. Em instalações existentes, execute `npm run db:migrate` antes de habilitar o recurso.

## 2. Mapa das telas

| Menu ou tela | Rota | O que faz e de onde vêm os dados |
| --- | --- | --- |
| Login e recuperação | `/login/`, `/recuperar-senha/` | Entrada da equipe e solicitação de recuperação. O master usa credenciais configuradas. As contas da equipe ficam no banco. |
| Visão geral | `/gestor/` | Indicadores, evolução de vendas e ranking por data. A fila Atenção agora considera as pendências do histórico importado. Também reúne categorias, estoque e mudanças de catálogo. |
| Pedidos Shopify | `/gestor/vendas/` | Lista paginada, filtros, situação de pagamento e atendimento, conferência de itens, frete, estornos e indicadores. O calendário ajusta a posição ao espaço disponível e abre acima da navegação; em telas estreitas mostra um mês por vez. Usa o histórico de vendas sincronizado. |
| Produtos vendidos | `/gestor/produtos-vendidos/` | Consulta de produtos e variantes vendidos, com busca e filtros. |
| Mapa de entregas | `/gestor/mapa/` | Agrupa destinos dos pedidos online por município e UF quando identificados. |
| Vendas na loja | `/gestor/winthor/balcao/` | Área reservada para vendas de caixa por filial. A integração está pendente. |
| Todos os produtos | `/gestor/produtos/` | Pesquisa, filtros e indicadores das variantes do catálogo publicado. |
| Ofertas | `/gestor/ofertas/` | Variantes em que o preço de comparação supera o preço atual. |
| Catálogos | `/gestor/catalogos/`, `/gestor/[slug]/` | Lista de coleções e prévias. Permite consultar e compartilhar os catálogos. |
| Alterações na Shopify | `/gestor/alteracoes/` | Compara publicações sucessivas. Exibe inclusão, ausência e campos modificados. Filtra pela detecção na sincronização e mostra a data Shopify quando disponível. |
| Estoque da Shopify | `/gestor/estoque/` | Saldo agregado da última publicação. Classifica estoque baixo, sem estoque e indisponível conforme dados e limites configurados. |
| Estoque por loja | `/gestor/winthor/estoque-por-loja/` | Área reservada para saldo por filial no WinThor. A integração está pendente. |
| Transferências | `/gestor/winthor/transferencias/` | Área reservada para histórico de movimentações WinThor. A etapa inicial é mapear a fonte e uma amostra real. |
| Agenda e fornecedores | `/gestor/agenda/`, `/gestor/calendario/`, `/gestor/reunioes/[id]/` | Fornecedores, compromissos, calendário e reuniões. Permite importar uma exportação HTML de fornecedores do WinThor. Videochamada depende da configuração do Jitsi. |
| Análises Shopify | `/gestor/analises/`, `/gestor/analises/checkouts/` | Consultas de desempenho, relatórios e checkouts, sujeitas às permissões e à disponibilidade na Shopify. |
| Relatórios | `/gestor/relatorios/` | Entrada para relatórios disponíveis ao perfil autenticado. |
| Sincronizações | `/gestor/sincronizacoes/` | Acompanha importação, validação e publicação do catálogo. |
| Minha conta | `/gestor/minha-conta/` | Informações da sessão e ações disponíveis para a própria conta. |
| Equipe | `/gestor/usuarios/` | Gestão das contas da equipe e perfis. Acesso Admin. |
| Configurações | `/gestor/configuracoes/` | Limites de estoque e informações de acesso e integração. Acesso Admin. |
| Versões e atualizações | `/gestor/versoes/` | Versão em execução, data de registro, commit quando disponível, mapa do sistema e até 20 eventos recentes de equipe e configuração. Acesso Admin. Os históricos usam linhas que se empilham em telas estreitas. |

## 3. Acesso e responsabilidades

- **Admin** pode acessar os módulos de operação, gerenciar Equipe e Configurações e consultar Versões e atualizações.
- **Gestor e Gerente de Compras** compartilham as permissões operacionais. Incluem vendas, análises, agenda e sincronização de catálogo. Os atalhos de administração são exclusivos do Admin.
- **Atendimento** tem acesso às telas liberadas para seu perfil, sem acesso aos indicadores financeiros e módulos WinThor. A proteção é validada nas rotas e no servidor.
- Os eventos de equipe e configuração registram ação, responsável e horário no banco. A tela de versões exibe apenas os eventos permitidos. Dados detalhados da alteração, credenciais e ações de senha ficam fora dessa visualização.

## 4. Como os dados circulam

### Catálogo

1. A integração consulta produtos, variantes e coleções Shopify. A normalização preserva identificadores de produto e variante, SKU, preço, imagem, tipo, marca e saldo quando informado.
2. O importador prepara uma versão candidata e valida a carga. Na publicação, o ponteiro do catálogo ativo muda para a nova versão.
3. As telas do painel consultam o snapshot publicado. A comparação de alterações usa pares de versões da mesma loja.
4. No modo local sem banco, o painel pode usar os JSON de catálogo como referência. O estado da tela indica quando a fonte está indisponível ou quando o histórico depende de importação.

### Pedidos Shopify

Pedidos, visão geral, análises, destinos e histórico de alterações usam o mesmo seletor de período. As datas podem ser digitadas em DD/MM/AAAA ou escolhidas no calendário do painel. Os seletores de data única da agenda usam o mesmo padrão de popover e grade. O calendário mensal da agenda é uma visualização de compromissos.

1. A integração recebe os eventos de vendas e mantém uma fila persistente com tentativas. A rota de webhook valida assinatura e loja antes de registrar.
2. O processamento consulta a Shopify, atualiza pedidos e itens e registra o checkpoint. Repetições e interrupções podem ser retomadas pela fila.
3. A janela automática usa até 60 dias. Períodos anteriores consultam o histórico disponível no banco. O painel mostra o horário da última sincronização.
4. Valor líquido representa recebido menos reembolsos. Pagamento, cancelamento, atendimento e modalidade de entrega são dimensões distintas.
5. A fila Atenção agora tem escopo independente do filtro comercial. A modalidade local e a retirada exibem frete conforme o valor registrado no pedido.
6. O cron da Vercel está declarado para 09h UTC. A ativação depende de `CRON_SECRET`; confira a resposta da rota e os logs no ambiente de produção. A ação manual e os scripts continuam disponíveis aos perfis autorizados.

### Alterações e versões

| Histórico | Unidade de registro | Data exibida |
| --- | --- | --- |
| Alterações na Shopify | Diferença entre snapshots do catálogo | Detecção na sincronização e última atualização Shopify quando disponível |
| Sincronizações | Execução ou publicação de catálogo | Início e conclusão da importação |
| Versões e atualizações | Mudança documentada no código | Data de registro da versão; o commit identifica o código deste ambiente |
| Atividade administrativa | Evento de equipe ou configuração | Data e hora do evento no banco |

O histórico de versões é editorial. Para o horário exato da publicação, consulte o deploy associado ao commit na Vercel. A atividade administrativa mostra eventos registrados a partir das ações existentes do painel.

## 5. Transferências WinThor

### Primeira etapa, consulta de movimentações existentes

A documentação TOTVS descreve o relatório da rotina **1124 — Transferir produto entre filial/depósito**. Na aba **Relatório**, filtre filial de origem, filial de destino e período, ou localize pela nota fiscal de transferência. Confirme com a equipe quais rotinas e tipos de movimentação de fato cobrem o histórico da Pitter Pan. O formato disponível para exportação precisa ser validado na instalação. [Procedimento oficial TOTVS](https://centraldeatendimento.totvs.com/hc/pt-br/articles/1500012182141)

| Dado a confirmar na fonte | Uso na Gestão Comercial |
| --- | --- |
| ID da transferência ou chave estável da nota, série e filial | Identificar a operação e evitar duplicidade ao reimportar |
| Códigos de origem e destino | Mapear Floresta, América e Iririú e distinguir depósitos internos |
| Data da movimentação e situação | Filtrar por período e exibir cancelamentos e status fornecidos |
| Identificador da linha, código de produto, unidade e quantidade | Montar detalhes da operação e preservar linhas repetidas legítimas |
| Como o relatório representa saída e entrada | Exibir uma transferência por operação, mesmo quando os dois movimentos aparecem |
| Período mais antigo disponível | Definir a cobertura da carga inicial e informar lacunas |

Para homologar, use um relatório anonimizado com duas transferências, itens e quantidades, além de uma operação cancelada se houver. Valide os totais e as filiais com o relatório original. O painel deve importar em leitura, deduplicar reenvios e manter a origem, a cobertura e o horário da carga. Depois de confirmar o formato, a mesma estrutura pode receber um serviço WinThor disponível na instalação. **Estado atual:** a tela está preparada e a leitura de dados reais depende dessa amostra ou do contrato do serviço.

Vendas físicas serão tratadas em outra etapa. Para conciliar a Shopify com o WinThor, confirme como o ERP registra o número de pedido online. O canal da compra e a filial de atendimento devem ser campos distintos.

## 6. Mapa do código

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/gestor/(dashboard)/` | Rotas e composição do painel. O layout exige sessão e fornece sidebar e janelas de conferência. |
| `src/app/api/` | Endpoints HTTP, autenticação, validação, respostas e integração de servidor. |
| `src/shared/components/admin/` | Componentes do painel, calendário, tabelas, formulários, gráficos e conferência de pedidos. |
| `src/shared/lib/admin/` e `src/shared/lib/agenda/` | Regras e utilitários compartilhados para filtros, períodos, estoque, links, relatórios e agenda. |
| `src/shared/server/auth/` | Sessões, permissões, hashes de senha, limites e utilitários de autenticação. |
| `src/shared/server/admin/` | Repositório de catálogo administrativo, indicadores e alterações. |
| `src/shared/server/agenda/` | Consultas e persistência da agenda, fornecedores e reuniões. |
| `src/shared/server/shopify/` | Cliente Shopify, consultas de catálogo, cache e normalização. |
| `src/shared/server/sales/` | Configuração e sincronização de pedidos, filtros, valores, atendimento, destinos, relatórios e persistência. |
| `src/shared/server/database/` | Pool, esquema do catálogo, importações e repositórios. |
| `src/shared/server/sync/` e `src/shared/workflows/` | Controle e execução da sincronização longa de catálogo. |
| `src/shared/server/http/` | Utilitários HTTP e implementação compartilhada de APIs de catálogo. |
| `src/shared/styles/`, `public/` e `config/` | Estilos, arquivos públicos, dados locais e mapeamento de coleções. |
| `src/shared/config/system-releases.json` | Registro das versões exibidas no Admin. |
| `scripts/`, `tests/`, `.github/workflows/` | Rotinas de implantação, manutenção e verificação. |

### Endpoints

| Endpoints | Responsabilidade |
| --- | --- |
| `/api/health/` | Verifica que a aplicação responde. |
| `/api/auth/login/`, `logout/`, `password/` | Sessão e ações de senha, com validação de origem e acesso conforme a ação. |
| `/api/admin/overview/`, `products/`, `settings/`, `users/` | Resumo administrativo, pesquisa de produtos, limites e equipe. |
| `/api/admin/agenda/`, `agenda/video/`, `campaigns/` | Agenda, reuniões e planejamento. |
| `/api/admin/sales/`, `sales/customers/`, `sales/fulfillment/` | Listagem e consultas de vendas, clientes e conferência de itens. |
| `/api/admin/analytics/`, `destinations/` | Análises e destinos dos pedidos. |
| `/api/admin/sync/` | Dispara e acompanha sincronização de catálogo. |
| `/api/webhooks/shopify/sales/`, `/api/cron/sales/` | Entrada assinada de eventos e processamento agendado autenticado. |
| `/api/catalogs/[slug]/`, `/api/categories/[slug]/`, `/api/catalog-banner/[slug]/`, `/api/product-image/[variant]/` | Leitura de coleções, categorias e imagens para o catálogo. |
| `/api/cart/`, `/api/checkout/` | Operações de catálogo e checkout de acordo com o fluxo da vitrine. |

## 7. Configuração, operação e publicação

- Use Node.js 24 e `npm ci`. Configure o arquivo de ambiente pelo modelo [.env.example](../.env.example) e rode `npm run dev` para abrir a gestão local. A porta padrão da gestão é 3001.
- `DATABASE_URL` configura o banco. `CATALOG_DATA_SOURCE` seleciona a fonte da vitrine. `NEXT_PUBLIC_CATALOG_URL` aponta para a aplicação pública.
- `SHOPIFY_*` configura catálogo. `SHOPIFY_SALES_*` configura vendas. `ADMIN_*` controla acesso inicial e sessão. `CRON_SECRET` protege o cron. `JITSI_BASE_URL` configura videochamadas.
- Execute `npm run db:migrate` para preparar o esquema principal e `npm run sales:migrate` para o módulo de vendas no banco correto. Execute `npm run admin:setup` no ambiente autorizado quando precisar preparar a conta inicial.
- Catálogo usa `shopify:sync`, `shopify:publish` e `shopify:report`. Vendas usa `sales:setup`, `sales:webhooks`, `sales:sync`, `sales:retry` e `sales:audit`. Consulte o [README](../README.md) e os scripts antes de operar em produção.
- Para validar alterações, rode `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:server`. O teste HTTP usa ambiente local com dados de teste. Confira o login, as permissões e a fonte de dados antes de considerar uma integração homologada.
- Segredos ficam nas variáveis do ambiente autorizado. Use dados fictícios ou anonimizados em testes e documentação.
- Após publicar, confira o status na Vercel, a resposta de `/api/health/` e a versão indicada no Admin. Em caso de regressão, identifique o commit e restaure uma versão estável pela Vercel ou pelo histórico do repositório, levando em conta qualquer migração já aplicada.

## 8. Manutenção da documentação

1. Na mesma alteração de código, atualize este mapa com a rota, dados, permissões ou procedimento afetado.
2. Adicione uma entrada no início de [system-releases.json](../src/shared/config/system-releases.json) com versão única `AAAA.MM.DD.N`, data ISO 8601 com fuso, título e resumo. Preserve as entradas anteriores.
3. O workflow executa `node scripts/check-system-docs.mjs`. Em mudanças funcionais, verifica se o mapa e o registro de versões foram atualizados juntos.
4. Revise a versão em execução após o deploy. Alterações de produto, sincronização e ações administrativas têm históricos próprios, conforme a seção 4.
