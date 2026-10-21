-- Standard monthly price for employees who have life insurance selected.
UPDATE rem_controladoria.employees
SET insurance_monthly=777, updated=now()::text
WHERE coalesce(insurance_enabled,insurance_monthly>0) AND insurance_monthly<>777;
