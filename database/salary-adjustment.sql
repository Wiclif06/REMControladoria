-- Forecast adjustment: basis points (500 = 5%), first affected month (1–12).
ALTER TABLE rem_controladoria.employees
 ADD COLUMN IF NOT EXISTS adjustment_rate integer NOT NULL DEFAULT 0 CHECK(adjustment_rate BETWEEN 0 AND 10000),
 ADD COLUMN IF NOT EXISTS adjustment_month integer NOT NULL DEFAULT 1 CHECK(adjustment_month BETWEEN 1 AND 12);
