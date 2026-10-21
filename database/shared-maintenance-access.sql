BEGIN;
CREATE TABLE IF NOT EXISTS rem_controladoria.employee_site_access (
 username text NOT NULL REFERENCES rem_controladoria.app_users(username) ON DELETE CASCADE,
 construction_site text NOT NULL REFERENCES rem_controladoria.construction_sites(name) ON UPDATE CASCADE ON DELETE CASCADE,
 PRIMARY KEY(username,construction_site)
);
ALTER TABLE rem_controladoria.employee_site_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rem_controladoria.employee_site_access FROM PUBLIC,anon,authenticated;
GRANT SELECT ON rem_controladoria.employee_site_access TO rem_controladoria_app;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='rem_controladoria' AND tablename='employee_site_access' AND policyname='rem_app_read') THEN
  CREATE POLICY rem_app_read ON rem_controladoria.employee_site_access FOR SELECT TO rem_controladoria_app USING(true);
 END IF;
END $$;
INSERT INTO rem_controladoria.employee_site_access(username,construction_site)
SELECT username,'Manutenção' FROM rem_controladoria.app_users WHERE username='fernanda.vieira' AND role='manager' AND sector='Incorporação' AND active=1
ON CONFLICT DO NOTHING;
COMMIT;
