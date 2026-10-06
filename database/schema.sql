BEGIN;
CREATE TABLE IF NOT EXISTS employees (
 id text PRIMARY KEY, name text NOT NULL, position text NOT NULL, sector text NOT NULL,
 contract text NOT NULL CHECK (contract IN ('CLT','PJ')), salary integer NOT NULL,
 meal integer NOT NULL, transport integer NOT NULL, creator text NOT NULL, updated text NOT NULL,
 admission text NOT NULL DEFAULT '', inss_rate integer NOT NULL DEFAULT 2000,
 fgts_rate integer NOT NULL DEFAULT 800, vacation_factor integer NOT NULL DEFAULT 13333,
 thirteenth_factor integer NOT NULL DEFAULT 10000, bonus_annual integer NOT NULL DEFAULT 0,
 insurance_monthly integer NOT NULL DEFAULT 0, other_annual integer NOT NULL DEFAULT 0,
 notes text NOT NULL DEFAULT '', company text NOT NULL DEFAULT 'Não informada'
);
CREATE TABLE IF NOT EXISTS app_users (
 username text PRIMARY KEY, display_name text NOT NULL, role text NOT NULL CHECK(role IN ('admin','manager')),
 sector text NOT NULL, salt text NOT NULL, password_hash text NOT NULL, active integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS areas(name text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS auth_attempts(key text PRIMARY KEY,count integer NOT NULL,reset bigint NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY,username text NOT NULL REFERENCES app_users(username),expires bigint NOT NULL);
CREATE TABLE IF NOT EXISTS payroll_rules(company text PRIMARY KEY,inss_rate integer NOT NULL,fgts_rate integer NOT NULL,vacation_factor integer NOT NULL,thirteenth_factor integer NOT NULL);
CREATE INDEX IF NOT EXISTS employees_sector_idx ON employees(sector);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON employees,app_users,areas,auth_attempts,sessions,payroll_rules FROM PUBLIC;
COMMIT;
