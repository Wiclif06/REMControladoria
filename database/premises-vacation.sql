CREATE TABLE IF NOT EXISTS rem_controladoria.premise_plans (
 year integer NOT NULL CHECK(year BETWEEN 2020 AND 2100),
 company text NOT NULL CHECK(company IN ('ALPAN','REM Construtora','REM Vendas')),
 sector text NOT NULL REFERENCES rem_controladoria.areas(name) ON UPDATE CASCADE,
 answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(answers)='object'),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(year,company,sector)
);
ALTER TABLE rem_controladoria.premise_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rem_controladoria.premise_plans FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON rem_controladoria.premise_plans TO rem_controladoria_app;
DROP POLICY IF EXISTS rem_app ON rem_controladoria.premise_plans;
CREATE POLICY rem_app ON rem_controladoria.premise_plans TO rem_controladoria_app USING(true) WITH CHECK(true);
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS vacation_start date;
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS vacation_end date;
ALTER TABLE rem_controladoria.employees ADD CONSTRAINT employees_vacation_period CHECK((vacation_start IS NULL AND vacation_end IS NULL) OR (vacation_start IS NOT NULL AND vacation_end IS NOT NULL AND vacation_end>=vacation_start));
