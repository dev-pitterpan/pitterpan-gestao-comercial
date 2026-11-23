# Auditoria técnica da Gestão Comercial — 23/11/2026

## Escopo e critérios

Repositório: `dev-pitterpan/pitterpan-gestao-comercial`. Base examinada: `09ce09dc005c9db348bc1dd0c371e0b1d61ecfd5`, correspondente à produção encontrada na Vercel, em estado READY. O Catálogo Digital e o PitterCore ERP possuem projetos próprios e não foram modificados nesta auditoria.

Foram revisados o mapa de rotas, a separação entre interface e servidor, autenticação/permissões, importação de catálogo, vendas, ranking, agenda, tratamento de imagens, configuração e automação de publicação. Foram executadas as suítes automatizadas do repositório, a checagem de tipos e o build. A conferência não constitui garantia de ausência de defeitos: os limites de acesso e a cobertura de cada verificação são descritos abaixo.

## Ranking: fonte e referência real

A tela lê `pitterpan_sales_orders` e `pitterpan_sales_items` no PostgreSQL. Abrir a página não consulta os pedidos diretamente na Shopify. O período padrão é de 30 dias, pela data de processamento do pedido no horário de Brasília.

Entram pedidos em BRL, não cancelados nem de teste, com situação PAID ou PARTIALLY_REFUNDED, recebido maior que reembolsado e ID válido de cliente Shopify. O valor usado é recebido menos reembolsado. Pessoas com o mesmo nome permanecem separadas por ID; os empates têm ordenação estável. Pedidos expirados, não pagos, totalmente reembolsados ou sem identificação utilizável não somam compras no ranking.

Consulta direta e somente em leitura à Shopify em 23/11/2026, com paginação esgotada para 25/10/2026–23/11/2026:

| Medida                           | Referência Shopify |
| -------------------------------- | -----------------: |
| Pedidos não teste retornados     |                 57 |
| Pedidos elegíveis ao ranking     |                 46 |
| Clientes identificados elegíveis |                 42 |
| Valor líquido elegível           |        R$ 4.224,01 |

Esses números validam a referência externa, não o banco da aplicação. Não foi possível abrir conexão TCP com `db.prisma.io` neste ambiente; não houve conciliação entre o PostgreSQL da produção e a Shopify. A existência de uma data recente de sincronização não substitui essa conciliação. Dados pessoais dos clientes não foram adicionados a este relatório.

## Achados e correções

| Prioridade | Evidência na base examinada                                                                                                                                  | Tratamento                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alta       | O cron chamava `syncSalesPage()` uma única vez. Cada página contém até cinco pedidos; um histórico maior podia levar várias execuções diárias para terminar. | Cron inicia workflow exclusivo de vendas, com continuação dos lotes, pausas persistentes, checkpoint e lease existentes. Resposta 202 significa aceitação. Falhas e limite de 2.000 lotes encerram o workflow com erro. |
| Alta       | Ranking não informava última conclusão, carga em andamento, eventos pendentes ou compras sem identificação.                                                  | Painel de atualização em Brasília, aviso após 26 horas, cobertura de identificação e pendências, inclusive eventos com dez tentativas.                                                                                  |
| Alta       | Sem conferência específica dos agrupamentos por cliente.                                                                                                     | Comando `sales:audit-ranking`: consulta todas as páginas, compara quantidade e valor líquido por ID, usa centavos inteiros exatos e transação somente leitura; código 1 em divergência/falha.                           |
| Média      | Next.js 16.4.2 no lockfile, com alertas de segurança no npm audit.                                                                                           | Atualização fixada em 16.4.6 no manifesto e no lockfile.                                                                                                                                                                |
| Média      | Logs reais da Vercel mostraram aviso de ambiguidade do `sslmode` no pg.                                                                                      | Normalização dos aliases atuais para `verify-full`, preservando a verificação de certificado e respeitando `uselibpqcompat=true` explícito.                                                                             |
| Média      | Verificação contínua não bloqueava alertas altos/críticos nas dependências.                                                                                  | Adicionado `npm audit --audit-level=high` ao CI. Alertas moderados continuam exigindo acompanhamento.                                                                                                                   |
| Baixa      | Documentação ainda descrevia a antiga tela de versões.                                                                                                       | Mapa funcional corrigido e atualização do ranking, cron e procedimentos documentados.                                                                                                                                   |

Nenhuma migração, alteração de credenciais ou escrita em pedidos/produtos da Shopify foi executada pela auditoria. As mudanças não exigem nova tabela nem migração em uma instalação que já possui o esquema atual de vendas.

## Estrutura, funcionalidades e proteção

| Área                         | Evidência e conclusão                                                                                                                                                                                           | Limite                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pastas                       | Rotas em `src/app`, consultas e integrações em `src/shared/server`, componentes/estilos separados e scripts operacionais fora da interface. A divisão existente permite manutenção sem uma reorganização ampla. | Os maiores componentes ainda concentram várias responsabilidades; recomenda-se separação gradual por fluxo, com regressões.                                         |
| Acesso                       | Sessão assinada, validade/versão, revogação por credencial ou conta, papéis no servidor, controle de tentativas e verificação de origem nas mutações administrativas revisadas.                                 | Não equivale a pentest externo. Contas reais, senhas e permissões efetivas da organização não foram alteradas.                                                      |
| Vendas e valores             | Testes de cancelamento, reembolso, saldo oficial, entrega, identificação, conferência de atendimento e snapshots.                                                                                               | Valores reais da produção aguardam execução da conciliação somente leitura.                                                                                         |
| Ranking                      | SQL numérico, agrupamento por ID, desconto de reembolsos, seleção e paginação; testes adicionais de cobertura, atraso, eventos e conciliação.                                                                   | A carga automática continua limitada aos últimos 60 dias. Períodos anteriores dependem do histórico importado.                                                      |
| Catálogo/ofertas/estoque     | Publicação por snapshot, limite de queda de carga, filtros, compare-at-price maior que preço e testes de escala. Ordenação e data de alteração já estavam na base publicada.                                    | Descontos automáticos por quantidade ou por carrinho não são equivalentes a compare-at-price e não estão integralmente representados em Ofertas.                    |
| Fotos                        | Origem de mídia restrita a domínios Shopify, limites de download/pixels, validação e conversão WebP. Foto do perfil privada com fallback para iniciais.                                                         | O erro 503 da foto relatado anteriormente não foi reproduzido com sessão e banco reais; verificar migração/conexão antes de atribuir causa.                         |
| Agenda/fornecedores/reuniões | Suítes de agenda, importação, acesso, links e sala de reunião.                                                                                                                                                  | Vídeo depende de Jitsi configurado e teste real de câmera/microfone entre participantes.                                                                            |
| APIs e dados públicos        | Testes HTTP de isolamento de rotas/recursos, autenticação, limites de corpo, CSV e validação. Webhook revisado usa assinatura, loja, tópicos e deduplicação antes de persistir.                                 | `/api/health/` mede processo disponível, não saúde do banco ou atualização da Shopify.                                                                              |
| Publicação                   | CI existente cobre documentação, formatação, tipos, testes, build e servidor; incluído bloqueio de dependências altas/críticas.                                                                                 | Build aprovado não prova que todas as variáveis e migrações do ambiente estão corretas.                                                                             |
| WinThor                      | Áreas de balcão, estoque por loja e transferências explicitamente pendentes no mapa do sistema.                                                                                                                 | Sem amostra/conexão Oracle/contrato real, não são integrações operacionais validadas.                                                                               |
| Fiscal                       | A base main examinada não inclui a implementação fiscal da branch `feat/notas-fiscais-shopify`.                                                                                                                 | Não confundir o trabalho em branch com módulo publicado. Importação de XML/DANFE e emissão fiscal são funções distintas; o módulo fiscal exige homologação própria. |

## Segurança e operação: pendências reais

1. O npm audit após a atualização do Next.js ainda reporta 20 dependências com severidade moderada na árvore de Workflow, derivadas do advisory de minimatch `GHSA-g3hv-75wg-m249`. Não foram encontrados alertas altos/críticos nessa consulta. O npm propõe uma troca incompatível de versão de Workflow como correção; não foi aplicado `npm audit fix --force`. A correção dessa cadeia precisa de atualização/override homologado com teste de execução real dos workflows.
2. Credenciais foram compartilhadas anteriormente na conversa. O administrador deve verificar a rotação das chaves expostas e do segredo de sessão nos projetos envolvidos, incluindo histórico Git, quando aplicável. O código versionado atual contém apenas `.env.example`; a busca direcionada por padrões de chaves e URLs com credenciais nos arquivos operacionais rastreados não encontrou correspondências. Essa busca não é um scanner completo de histórico.
3. O cron diário permanece às 09:00 UTC/06:00 de Brasília. Não há promessa de atualização em tempo real. Eventos de webhook são enfileirados; a entrega do evento, sozinha, não significa processamento concluído. O GET sem credencial respondeu 401 em produção, confirmando a proteção do agendamento, sem executar a sincronização.
4. A janela de cinco minutos de logs disponível na Vercel mostrou o aviso TLS mencionado; ela não cobre todo o histórico operacional. Ausência de outro erro nessa amostra não prova ausência de falhas.
5. Responsividade, teclado e recursos locais foram revisados em código/testes HTTP. Não houve homologação visual completa em navegador, celular físico ou teste de impressão nesta auditoria.
6. Backup restaurável, recuperação de desastre, carga concorrente em produção, entrega real dos webhooks, registros de eventos esgotados e a conclusão do novo workflow agendado precisam de validação operacional com acesso ao ambiente.

## Verificação pelo administrador

Na pasta correta do repositório, com `.env` local configurado e sem compartilhar seu conteúdo:

```powershell
npm run sales:audit-ranking -- 2026-10-25 2026-11-23
npm run sales:audit -- 2026-10-25 2026-11-23
```

Ambos são somente leitura. `consistent: true` confirma a comparação efetuada para o intervalo naquele momento; não é garantia permanente. Se falhar, verificar conexão/permissões e preservar o relatório sem credenciais. Para atualizar dados, usar Sincronizar no painel e aguardar conclusão antes de repetir a conferência. Eventos que esgotaram tentativas exigem diagnóstico e a rotina administrativa de retry existente; não são descartados silenciosamente.

Na Vercel, conferir o commit/deployment correspondente, a execução de `salesSync`, a conclusão dos lotes e os logs. Acompanhar o horário no ranking e os avisos de cobertura. Conferir a tabela de fotos pelo procedimento de migração próprio se o 503 persistir; não recriar ou limpar tabelas para tentar resolver.

## Validação desta alteração

- Testes automatizados: 99 aprovados, zero falhas; incluem nova cobertura de sincronização de múltiplas páginas, concorrência por lease, limite/falhas, atraso do ranking, eventos pendentes/esgotados, conciliação centavo a centavo e normalização TLS.
- Checagem de tipos, formatação, build Next.js 16.4.6 e testes HTTP locais com build de produção: aprovados.
- O build reconhece dois workflows e 27 steps. Isso valida compilação, não a execução autenticada do agendamento na conta Vercel.
- A publicação e o commit final devem ser conferidos no PR/deploy. Este relatório foi preparado antes da publicação para acompanhar exatamente a mudança.
