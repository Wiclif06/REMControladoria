BEGIN;
-- Additive migration: retains vacation history and all existing grants/policies.
ALTER TABLE rem_controladoria.payroll_rules ADD COLUMN IF NOT EXISTS charge_rate integer;
UPDATE rem_controladoria.payroll_rules
 SET charge_rate=CASE WHEN company='CLT' THEN 2680 ELSE 0 END,
     inss_rate=CASE WHEN company='CLT' THEN 2680-fgts_rate ELSE 0 END
 WHERE charge_rate IS NULL;
ALTER TABLE rem_controladoria.payroll_rules ALTER COLUMN charge_rate SET DEFAULT 2680;
ALTER TABLE rem_controladoria.payroll_rules ALTER COLUMN charge_rate SET NOT NULL;

ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS charge_rate integer;
UPDATE rem_controladoria.employees e
 SET charge_rate=CASE WHEN contract='CLT' THEN COALESCE((SELECT charge_rate FROM rem_controladoria.payroll_rules WHERE company='CLT'),2680) ELSE 0 END
 WHERE charge_rate IS NULL;
ALTER TABLE rem_controladoria.employees ALTER COLUMN charge_rate SET DEFAULT 2680;
ALTER TABLE rem_controladoria.employees ALTER COLUMN charge_rate SET NOT NULL;
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS health_monthly integer NOT NULL DEFAULT 0 CHECK(health_monthly BETWEEN 0 AND 100000000);
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS health_employee_monthly integer NOT NULL DEFAULT 0 CHECK(health_employee_monthly BETWEEN 0 AND health_monthly);
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS health_copay_monthly integer NOT NULL DEFAULT 0 CHECK(health_copay_monthly BETWEEN 0 AND 100000000);
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS health_copay_employee_monthly integer NOT NULL DEFAULT 0 CHECK(health_copay_employee_monthly BETWEEN 0 AND health_copay_monthly);
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS task_monthly integer NOT NULL DEFAULT 0 CHECK(task_monthly BETWEEN 0 AND 100000000);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='rem_rules_charge_rate_check' AND conrelid='rem_controladoria.payroll_rules'::regclass) THEN
  ALTER TABLE rem_controladoria.payroll_rules ADD CONSTRAINT rem_rules_charge_rate_check CHECK(charge_rate BETWEEN 0 AND 10000 AND (company<>'CLT' OR fgts_rate<=charge_rate));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='rem_employee_charge_rate_check' AND conrelid='rem_controladoria.employees'::regclass) THEN
  ALTER TABLE rem_controladoria.employees ADD CONSTRAINT rem_employee_charge_rate_check CHECK(charge_rate BETWEEN 0 AND 10000);
 END IF;
END $$;
COMMIT;
