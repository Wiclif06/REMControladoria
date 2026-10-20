BEGIN;
CREATE TABLE IF NOT EXISTS rem_controladoria.construction_sites (
 name text PRIMARY KEY CHECK(length(name) BETWEEN 1 AND 120)
);
ALTER TABLE rem_controladoria.construction_sites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rem_controladoria.construction_sites FROM PUBLIC,anon,authenticated;
GRANT SELECT ON rem_controladoria.construction_sites TO rem_controladoria_app;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='rem_controladoria' AND tablename='construction_sites' AND policyname='rem_app_read') THEN
  CREATE POLICY rem_app_read ON rem_controladoria.construction_sites FOR SELECT TO rem_controladoria_app USING(true);
 END IF;
END $$;
INSERT INTO rem_controladoria.construction_sites(name)
 VALUES ('Bom Retiro'),('Pç. Mário Fontana'),('Altitude Jardins'),('Doppio Jundiai'),('Caiubi Maranello')
 ON CONFLICT(name) DO NOTHING;
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS construction_site text
 REFERENCES rem_controladoria.construction_sites(name) ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS employees_construction_site_idx ON rem_controladoria.employees(construction_site);
COMMIT;
