# Catálogo de rotinas da Gestão Comercial

Os códigos são internos desta Gestão Comercial e independentes dos números do WinThor. São fixos no registro `src/shared/lib/admin/workspace-navigation.ts`: não derivam da posição, do perfil ou dos filtros. Códigos removidos não devem ser reaproveitados; novas rotinas recebem um código livre da faixa do módulo.

Abas, filtros e detalhes mantêm o código da rotina principal. Os relatórios individuais usam a rotina 6006. Rotinas planejadas têm códigos reservados e continuam identificadas como “Em breve”; numerá-las não ativa a funcionalidade.

A busca aceita nome, código, prefixo da faixa, `#3002`, `Rotina 3002` ou combinações como `3002 ofertas`. Enter abre somente quando há um resultado permitido ao perfil. O código também aparece no menu, cabeçalho e título da página.

| Código | Rotina | Módulo | Caminho | Situação |
| --- | --- | --- | --- | --- |
| 1001 | Visão geral | Início | `/gestor/` | Disponível |
| 1002 | Minha conta | Início | `/gestor/minha-conta/` | Disponível |
| 2001 | Resumo Shopify | Comercial | `/gestor/vendas/resumo/` | Disponível |
| 2002 | Vendas Shopify | Comercial | `/gestor/vendas/` | Disponível |
| 2003 | Atendimento de pedidos | Comercial | `/gestor/vendas/atendimento/` | Disponível |
| 2004 | Recebimentos | Comercial | `/gestor/vendas/recebimentos/` | Disponível |
| 2005 | Estornos e reembolsos | Comercial | `/gestor/vendas/reembolsos/` | Disponível |
| 2006 | Ranking de clientes | Comercial | `/gestor/clientes/` | Disponível |
| 2007 | Mapa de entregas | Comercial | `/gestor/mapa/` | Disponível |
| 2008 | Vendas Loja | Comercial | `/gestor/winthor/balcao/` | Em breve |
| 3001 | Todos os produtos | Catálogo | `/gestor/produtos/` | Disponível |
| 3002 | Ofertas | Catálogo | `/gestor/ofertas/` | Disponível |
| 3003 | Produtos mais vendidos | Catálogo | `/gestor/produtos-vendidos/` | Disponível |
| 3004 | Catálogos | Catálogo | `/gestor/catalogos/` | Disponível |
| 3005 | Imagens do catálogo | Catálogo | `/gestor/catalogos/imagens/` | Disponível |
| 3006 | Alterações na Shopify | Catálogo | `/gestor/alteracoes/` | Disponível |
| 4001 | Estoque da Shopify | Estoque | `/gestor/estoque/` | Disponível |
| 4002 | Estoque por loja | Estoque | `/gestor/winthor/estoque-por-loja/` | Em breve |
| 4003 | Transferências | Estoque | `/gestor/winthor/transferencias/` | Em breve |
| 5001 | Agenda e fornecedores | Agenda | `/gestor/agenda/` | Disponível |
| 6001 | Análises Shopify | Análises | `/gestor/analises/` | Disponível |
| 6002 | Vendas | Análises | `/gestor/analises/?secao=vendas` | Disponível |
| 6003 | Checkouts abandonados | Análises | `/gestor/analises/checkouts/` | Disponível |
| 6004 | Visão de clientes | Análises | `/gestor/analises/?secao=clientes` | Disponível |
| 6005 | Atribuição | Análises | `/gestor/analises/?secao=atribuicao` | Disponível |
| 6006 | Relatórios Shopify | Análises | `/gestor/analises/?secao=relatorios` | Disponível |
| 6007 | Relatórios | Análises | `/gestor/relatorios/` | Disponível |
| 7001 | Sincronizações | Sistema | `/gestor/sincronizacoes/` | Disponível |
| 7002 | Equipe | Sistema | `/gestor/usuarios/` | Disponível |
| 7003 | Configurações | Sistema | `/gestor/configuracoes/` | Disponível |
