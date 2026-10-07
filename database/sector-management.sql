-- Rename child links atomically, preserving existing permission scope.
ALTER TABLE rem_controladoria.budget_plans DROP CONSTRAINT budget_plans_sector_fkey;
ALTER TABLE rem_controladoria.budget_plans ADD CONSTRAINT budget_plans_sector_fkey FOREIGN KEY(sector) REFERENCES rem_controladoria.areas(name) ON UPDATE CASCADE;
ALTER TABLE rem_controladoria.area_budget_access DROP CONSTRAINT area_budget_access_sector_fkey;
ALTER TABLE rem_controladoria.area_budget_access ADD CONSTRAINT area_budget_access_sector_fkey FOREIGN KEY(sector) REFERENCES rem_controladoria.areas(name) ON UPDATE CASCADE;
-- Only history's sector index can be changed; original snapshots remain immutable.
GRANT UPDATE(sector) ON rem_controladoria.budget_history TO rem_controladoria_app;
GRANT DELETE ON rem_controladoria.area_budget_access TO rem_controladoria_app;
