-- Insert default app_settings row if none exists
-- This sets auto generation on for local/dev environments. Run via psql or Supabase SQL editor.

BEGIN;

INSERT INTO app_settings (auto_bill_generate, auto_carry_meter_reading, auto_meter_calculation, electricity_per_unit, created_at, updated_at)
SELECT true, true, true, 7, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

COMMIT;
