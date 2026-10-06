# REM Constroladoria - APP

Portal de orçamento de pessoal para ALPAN, REM Construtora e REM Vendas.

## Funcionalidades

- Login com sessão segura e permissões de administrador ou gestor por setor.
- Cadastro de funcionários CLT/PJ e benefícios.
- Encargos configurados pela Controladoria por empresa.
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
