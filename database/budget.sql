-- REM-only budget storage: no changes to FWERP tables or credentials.
CREATE TABLE IF NOT EXISTS rem_controladoria.budget_plans (
 year integer NOT NULL CHECK(year BETWEEN 2020 AND 2100),
 company text NOT NULL CHECK(company IN ('ALPAN','REM Construtora','REM Vendas')),
 sector text NOT NULL REFERENCES rem_controladoria.areas(name),
 amounts jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(amounts)='object'),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','changes')),
 version integer NOT NULL DEFAULT 1,
 note text NOT NULL DEFAULT '',
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(year,company,sector)
);
CREATE TABLE IF NOT EXISTS rem_controladoria.budget_history (
 id uuid PRIMARY KEY,
 year integer NOT NULL, company text NOT NULL, sector text NOT NULL,
 actor text NOT NULL, action text NOT NULL, version integer NOT NULL,
 snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS budget_history_scope ON rem_controladoria.budget_history(year,company,sector,created_at DESC);
ALTER TABLE rem_controladoria.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE rem_controladoria.budget_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rem_controladoria.budget_plans,rem_controladoria.budget_history FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON rem_controladoria.budget_plans TO rem_controladoria_app;
GRANT SELECT,INSERT ON rem_controladoria.budget_history TO rem_controladoria_app;
DROP POLICY IF EXISTS rem_app ON rem_controladoria.budget_plans;
CREATE POLICY rem_app ON rem_controladoria.budget_plans TO rem_controladoria_app USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS rem_app ON rem_controladoria.budget_history;
CREATE POLICY rem_app ON rem_controladoria.budget_history TO rem_controladoria_app USING(true) WITH CHECK(true);
