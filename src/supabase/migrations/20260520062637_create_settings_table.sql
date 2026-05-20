/*
  # Create settings table for app configuration

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `app_name` (text)
      - `default_language` (text: 'bn' or 'en')
      - `theme_mode` (text: 'light' or 'dark')
      - `date_format` (text)
      - `currency` (text, default: '৳')
      - `house_name` (text)
      - `default_monthly_rent` (numeric)
      - `due_date` (integer, day of month)
      - `late_fee_percentage` (numeric)
      - `auto_bill_generate` (boolean)
      - `auto_carry_meter_reading` (boolean)
      - `partial_payment_enabled` (boolean)
      - `electricity_per_unit` (numeric)
      - `water_bill_amount` (numeric)
      - `service_charge_amount` (numeric)
      - `gas_bill_amount` (numeric)
      - `auto_meter_calculation` (boolean)
      - `meter_warning_limit` (numeric)
      - `pending_rent_reminder` (boolean)
      - `due_date_notification` (boolean)
      - `overdue_alert` (boolean)
      - `push_notification_enabled` (boolean)
      - `sound_vibration_enabled` (boolean)
      - `offline_mode_enabled` (boolean)
      - `auto_sync_enabled` (boolean)
      - `last_sync_time` (timestamptz)
      - `default_payment_method` (text)
      - `auto_generate_receipt` (boolean)
      - `monthly_pdf_export` (boolean)
      - `excel_export` (boolean)
      - `auto_report_generate` (boolean)
      - `theme_color` (text)
      - `card_style` (text)
      - `font_size` (text: 'small', 'normal', 'large')
      - `compact_mode` (boolean)
      - `animations_enabled` (boolean)
      - `app_version` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `app_settings`
    - Add policy for authenticated users to read settings
    - Add policy for authenticated users to update settings
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text DEFAULT 'বাড়ি ম্যানেজার BD',
  default_language text DEFAULT 'bn' CHECK (default_language IN ('bn', 'en')),
  theme_mode text DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
  date_format text DEFAULT 'dd/MM/yyyy',
  currency text DEFAULT '৳',
  house_name text DEFAULT '',
  
  default_monthly_rent numeric DEFAULT 0,
  due_date integer DEFAULT 5,
  late_fee_percentage numeric DEFAULT 0,
  auto_bill_generate boolean DEFAULT false,
  auto_carry_meter_reading boolean DEFAULT false,
  partial_payment_enabled boolean DEFAULT true,
  
  electricity_per_unit numeric DEFAULT 0,
  water_bill_amount numeric DEFAULT 0,
  service_charge_amount numeric DEFAULT 0,
  gas_bill_amount numeric DEFAULT 0,
  auto_meter_calculation boolean DEFAULT true,
  meter_warning_limit numeric DEFAULT 0,
  
  pending_rent_reminder boolean DEFAULT true,
  due_date_notification boolean DEFAULT true,
  overdue_alert boolean DEFAULT true,
  push_notification_enabled boolean DEFAULT true,
  sound_vibration_enabled boolean DEFAULT true,
  
  offline_mode_enabled boolean DEFAULT false,
  auto_sync_enabled boolean DEFAULT true,
  last_sync_time timestamptz,
  
  default_payment_method text DEFAULT 'নগদ',
  auto_generate_receipt boolean DEFAULT true,
  
  monthly_pdf_export boolean DEFAULT false,
  excel_export boolean DEFAULT false,
  auto_report_generate boolean DEFAULT false,
  
  theme_color text DEFAULT '#1976d2',
  card_style text DEFAULT 'elevated',
  font_size text DEFAULT 'normal' CHECK (font_size IN ('small', 'normal', 'large')),
  compact_mode boolean DEFAULT false,
  animations_enabled boolean DEFAULT true,
  
  app_version text DEFAULT 'v1.0.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
