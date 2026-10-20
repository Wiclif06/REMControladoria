# REM Controladoria - APP

Portal de orçamento de pessoal para ALPAN, REM Construtora e REM Vendas.

## Funcionalidades

- Login com sessão segura e permissões de administrador ou gestor por setor.
- Cadastro de funcionários CLT/PJ e benefícios.
- Encargos configurados pela Controladoria por regime (CLT/PJ).
- Dashboard com custos mensais e anuais por empresa e setor.
- Exportação Excel com resumo consolidado e detalhamento.

## Vercel

Aplicação Next.js com PostgreSQL persistente no schema exclusivo `rem_controladoria`. Defina `DATABASE_URL` e `INITIAL_ADMIN_PASSWORD` somente no servidor, provisione o usuário restrito `rem_controladoria_app` e execute `database/schema.sql` e publique o projeto. Utilize a conexão pooler do provedor para funções serverless. Nunca envie credenciais ou dados pessoais para o Git.

```sh
npm ci
npm run dev
npm run build
```

O usuário do banco só recebe acesso às tabelas da REM; as tabelas e configurações do FW ERP não são alteradas. O banco existente é compartilhado e o limite de conexões do app é 1 por instância.

Os dados do ambiente anterior não são transferidos automaticamente. O administrador inicial é criado no primeiro acesso; a senha inicial é recebida pela variável de ambiente `INITIAL_ADMIN_PASSWORD` e não aparece no código.

## Orçamento por setor

- Catálogo com as 134 etapas do modelo REM de Despesas Administrativas. As etapas repetidas no modelo mantêm identificadores próprios.
- Ano, empresa e setor; 12 valores mensais em centavos; totais por etapa/categoria/setor e consolidado da Controladoria.
- Gestores leem e editam apenas seu setor. Adriano vê todas as áreas e pode editar, aprovar ou solicitar ajustes.
- Rascunho → enviado para revisão → aprovado ou ajustes solicitados. Gestores não editam orçamentos enviados ou aprovados.
- Controle otimista de versão e histórico com snapshot na mesma operação SQL.
- SQL adicional em `database/budget.sql`, restrito ao schema `rem_controladoria` e ao papel existente `rem_controladoria_app`; sem alterações às tabelas do FWERP.
- Exportação de pessoal em uma única aba `Gasto por Funcionário`, com distribuição mensal da projeção anual e detalhamento dos componentes na mesma aba.
- Exportação do orçamento em uma única aba `Despesas Administrativas`, mantendo etapas, categorias, subtotais, fórmulas e estilos do modelo enviado.
- Custos do cadastro de pessoal e despesas do orçamento são apresentados separadamente para evitar dupla contagem. Os gestores devem preencher o orçamento de pessoal conforme as premissas do exercício.

## Benefícios e tarefa da Engenharia

Execute `database/benefits-and-task.sql` antes de publicar esta versão. A migração é aditiva e pode ser repetida sem sobrescrever parâmetros já editados. Preserva políticas, usuários, premissas, orçamentos e o histórico das datas de férias.

- CLT: VR/VA desconta 5% do benefício; VT desconta o menor entre 6% do salário-base do mês e o custo do VT. PJ mantém o custo integral dos benefícios.
- Plano de saúde: mensalidade total menos participação do funcionário, mais coparticipação total prevista menos coparticipação descontada do funcionário. Todos os valores são mensais em centavos; contribuições não podem exceder o custo correspondente.
- Encargos CLT totais: padrão 26,8%, incluindo a parcela de FGTS, editável pela Controladoria. Férias e 13º continuam provisões separadas. A categoria antiga de INSS passa a exibir encargos CLT exceto FGTS.
- Tarefa: verba mensal adicional somente para Engenharia. Soma ao custo e tem categoria própria (175); não entra no salário-base, reajuste, VT, encargos, férias ou 13º.
- A programação de férias sai do cadastro e da resposta da API; o adicional permanece nos parâmetros. Datas antigas permanecem no banco sem alteração.
- Cadastro, orçamento e Excel usam o mesmo cálculo mensal, em centavos. Saúde (25) e tarefa (175) são automáticas e não permitem preenchimento manual duplicado.

### Verificação

`npm test` executa cálculos, conciliação mensal, contratos de API, validação, escopo por setor, parâmetros exclusivos do administrador e exportação Excel. `npm run build` verifica TypeScript e compilação de produção.

`tests/browser.cjs` exercita o aplicativo compilado em `http://localhost:3100` com Playwright/Edge e dados fictícios. Requer o pacote `playwright` disponível no ambiente de teste (ou em `NODE_PATH`). O navegador usa os handlers reais da API com adaptador de banco e sessão em memória; não autentica usuários nem grava dados na produção.
