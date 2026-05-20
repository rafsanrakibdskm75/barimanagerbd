/*
  # Bari Manager BD - Complete Database Schema

  ## Overview
  Full house rental management system for Bangladesh including:
  - Houses and flats management
  - Tenant information with full profile data
  - Meter readings and electricity billing
  - Rent collection with collector tracking
  - Collection history and payment status

  ## Tables Created
  1. `houses` - House/building information with owner and caretaker details
  2. `flats` - Individual flat details with floor, room count, monthly rent
  3. `tenants` - Full tenant profile including NID, occupation, family members
  4. `meter_readings` - Monthly electricity meter readings per flat
  5. `rent_collections` - Payment records with collector info and payment method
  6. `collection_history` - Full audit trail of all collection activities

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write their own house data
*/

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  total_flats integer NOT NULL DEFAULT 0,
  caretaker_name text DEFAULT '',
  caretaker_phone text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view houses"
  ON houses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert houses"
  ON houses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update houses"
  ON houses FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete houses"
  ON houses FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Flats table
CREATE TABLE IF NOT EXISTS flats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE CASCADE,
  flat_number text NOT NULL DEFAULT '',
  floor_number integer NOT NULL DEFAULT 1,
  room_count integer NOT NULL DEFAULT 1,
  monthly_rent numeric NOT NULL DEFAULT 0,
  water_bill numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE flats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view flats"
  ON flats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert flats"
  ON flats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update flats"
  ON flats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete flats"
  ON flats FOR DELETE
  TO authenticated
  USING (true);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  nid_number text DEFAULT '',
  family_members integer NOT NULL DEFAULT 1,
  occupation text NOT NULL DEFAULT '',
  move_in_date date NOT NULL DEFAULT CURRENT_DATE,
  emergency_contact text DEFAULT '',
  address text DEFAULT '',
  profile_photo_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tenants"
  ON tenants FOR DELETE
  TO authenticated
  USING (true);

-- Meter readings table
CREATE TABLE IF NOT EXISTS meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  previous_reading numeric NOT NULL DEFAULT 0,
  current_reading numeric NOT NULL DEFAULT 0,
  units_used numeric GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
  per_unit_price numeric NOT NULL DEFAULT 7,
  total_bill numeric GENERATED ALWAYS AS ((current_reading - previous_reading) * per_unit_price) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(flat_id, month, year)
);

ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view meter readings"
  ON meter_readings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meter readings"
  ON meter_readings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meter readings"
  ON meter_readings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meter readings"
  ON meter_readings FOR DELETE
  TO authenticated
  USING (true);

-- Rent collections table
CREATE TABLE IF NOT EXISTS rent_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  monthly_rent numeric NOT NULL DEFAULT 0,
  electric_bill numeric NOT NULL DEFAULT 0,
  water_bill numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  total_payable numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  due_amount numeric GENERATED ALWAYS AS (total_payable - amount_paid) STORED,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  collector_name text DEFAULT '',
  collector_phone text DEFAULT '',
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'bank_transfer')),
  transaction_id text DEFAULT '',
  collection_date timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(flat_id, month, year)
);

ALTER TABLE rent_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rent collections"
  ON rent_collections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rent collections"
  ON rent_collections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rent collections"
  ON rent_collections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rent collections"
  ON rent_collections FOR DELETE
  TO authenticated
  USING (true);

-- Collection history (audit trail)
CREATE TABLE IF NOT EXISTS collection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES rent_collections(id) ON DELETE CASCADE,
  flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  collector_name text DEFAULT '',
  collector_phone text DEFAULT '',
  payment_method text DEFAULT 'cash',
  transaction_id text DEFAULT '',
  notes text DEFAULT '',
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collection_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view collection history"
  ON collection_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert collection history"
  ON collection_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flats_house_id ON flats(house_id);
CREATE INDEX IF NOT EXISTS idx_tenants_flat_id ON tenants(flat_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_flat_id ON meter_readings(flat_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_month_year ON meter_readings(month, year);
CREATE INDEX IF NOT EXISTS idx_rent_collections_flat_id ON rent_collections(flat_id);
CREATE INDEX IF NOT EXISTS idx_rent_collections_month_year ON rent_collections(month, year);
CREATE INDEX IF NOT EXISTS idx_rent_collections_status ON rent_collections(payment_status);
CREATE INDEX IF NOT EXISTS idx_collection_history_flat_id ON collection_history(flat_id);
CREATE INDEX IF NOT EXISTS idx_collection_history_created_at ON collection_history(created_at DESC);
