BEGIN;
-- Selections are independent of prices. Keep existing costs and infer legacy records.
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS health_enabled boolean;
ALTER TABLE rem_controladoria.employees ADD COLUMN IF NOT EXISTS insurance_enabled boolean;
UPDATE rem_controladoria.employees SET health_enabled=(health_monthly>0 OR health_copay_monthly>0) WHERE health_enabled IS NULL;
UPDATE rem_controladoria.employees SET insurance_enabled=(insurance_monthly>0) WHERE insurance_enabled IS NULL;
COMMIT;
