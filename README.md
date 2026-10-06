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
