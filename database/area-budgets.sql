CREATE TABLE IF NOT EXISTS rem_controladoria.area_budget_access (
 sector text PRIMARY KEY REFERENCES rem_controladoria.areas(name),
 groups jsonb NOT NULL CHECK(jsonb_typeof(groups)='array'),
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE rem_controladoria.area_budget_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rem_controladoria.area_budget_access FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON rem_controladoria.area_budget_access TO rem_controladoria_app;
CREATE POLICY rem_app ON rem_controladoria.area_budget_access TO rem_controladoria_app USING(true) WITH CHECK(true);
