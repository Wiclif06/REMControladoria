ALTER TABLE rem_controladoria.payroll_rules ADD COLUMN IF NOT EXISTS bonus_annual integer CHECK (bonus_annual BETWEEN 0 AND 100000000);
