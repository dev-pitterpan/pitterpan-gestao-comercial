# Pitter Pan — Gestão Comercial

Projeto independente. Não depende do repositório do outro sistema.

## Executar

Node.js 24 ou superior.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Preencha o .env sem sobrescrever configurações existentes. Porta padrão: 3001.

## Verificar

`npm run typecheck`, `npm test`, `npm run build` e `npm run test:server`. Os testes HTTP utilizam dados fictícios e JSON locais.

## Publicar na Vercel

Importe este repositório com Root Directory na raiz (`./`), framework Next.js e Node 24. Configure as variáveis do .env.example nas configurações do projeto. Em produção, NEXT_PUBLIC_CATALOG_URL deve apontar para https://catalogopitterpanfesta.vercel.app. Nunca envie .env ou credenciais ao GitHub.

Mantenha os endpoints /api/webhooks/shopify/sales/ e /api/cron/sales/ no domínio da gestão. A base de produtos pode ser compartilhada com o catálogo; isso não duplica a loja nem os pedidos.

## Organização

Páginas e APIs em src/app. Componentes, regras e integrações utilizadas por esta aplicação em src/shared. Recursos em public e configurações em config. Scripts e testes pertencem a este projeto.

## Importar a configuração do projeto anterior

Na pasta deste projeto, execute:

```powershell
npm run env:import -- --from "C:\Projetos\bruno\pitterpanfestas-catalogo\.env"
```

A importação lê o arquivo somente no computador, copia apenas as variáveis do modelo desta aplicação e preenche os valores ausentes. Preserva valores já preenchidos no novo `.env`, cria backup antes de alterá-lo e não imprime credenciais. O catálogo não recebe credenciais de vendas ou autenticação da gestão. As portas padrão ficam 3000 para catálogo e 3001 para gestão.

A validação é local e não consulta a Shopify. A gestão requer banco PostgreSQL, credenciais próprias de vendas e configuração de login. `JITSI_BASE_URL` e `CRON_SECRET` são opcionais para os respectivos recursos. Não compartilhe o conteúdo do `.env`. Arquivos `.env.local` e outros arquivos específicos de ambiente podem prevalecer sobre `.env` e são sinalizados.

Na Vercel, configure as mesmas variáveis de servidor no projeto correspondente e use `NEXT_PUBLIC_CATALOG_URL=https://catalogopitterpanfesta.vercel.app` em produção. Não publique o `.env` no GitHub.

## Acessos da equipe

Gestor e Gerente de Compras têm os mesmos acessos operacionais, incluindo vendas, agenda e sincronização do catálogo. Usuários e Configurações ficam reservados ao Admin. Atendimento tem o perfil restrito.

## Operação de vendas

Execute `npm run sales:migrate` com a conexão do ambiente de destino para habilitar o registro da revisão do histórico. Em um banco que já sincroniza vendas, o processamento incremental continua durante a atualização, mesmo antes de aplicar essa migração.

A Vercel tem uma execução diária de contingência na janela das 09h UTC (06h em Joinville) em `/api/cron/sales/`. Configure `CRON_SECRET` no ambiente de produção com pelo menos 32 caracteres. Cada chamada processa uma etapa. Para atualização frequente durante o expediente, use o agendamento já existente ou configure um agendador para chamar o mesmo endpoint com o cabeçalho `Authorization: Bearer <CRON_SECRET>`. Acompanhe o horário do último ciclo concluído, a idade do evento mais antigo e as falhas da fila no painel de Vendas. Para importar o volume inicial, execute `npm run sales:sync` e retome se o comando indicar lotes pendentes.

A importação automática consulta pedidos criados na janela móvel de 60 dias. O filtro aceita datas anteriores para consultar pedidos já armazenados. Antes de usar um período mais longo para fechamento, confira a cobertura no banco e reconcilie uma amostra com a Shopify.
