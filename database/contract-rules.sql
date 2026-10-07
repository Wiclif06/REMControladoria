BEGIN;
ALTER TABLE rem_controladoria.payroll_rules ADD COLUMN IF NOT EXISTS adjustment_rate integer NOT NULL DEFAULT 0 CHECK (adjustment_rate BETWEEN 0 AND 10000);
ALTER TABLE rem_controladoria.payroll_rules ADD COLUMN IF NOT EXISTS adjustment_month integer NOT NULL DEFAULT 1 CHECK (adjustment_month BETWEEN 1 AND 12);
INSERT INTO rem_controladoria.payroll_rules(company,inss_rate,fgts_rate,vacation_factor,thirteenth_factor) VALUES ('CLT',2000,800,3333,10000),('PJ',0,0,0,0) ON CONFLICT(company) DO NOTHING;
UPDATE rem_controladoria.employees SET vacation_factor=3333 WHERE contract='CLT';
COMMIT;
