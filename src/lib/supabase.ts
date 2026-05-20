import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type House = {
  id: string;
  name: string;
  owner_name: string;
  address: string;
  total_flats: number;
  caretaker_name: string;
  caretaker_phone: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Flat = {
  id: string;
  house_id: string;
  flat_number: string;
  floor_number: number;
  room_count: number;
  monthly_rent: number;
  water_bill: number;
  service_charge: number;
  status: 'occupied' | 'vacant';
  created_at: string;
  updated_at: string;
  tenants?: Tenant[];
  house?: House;
};

export type Tenant = {
  id: string;
  flat_id: string;
  full_name: string;
  phone: string;
  nid_number: string;
  family_members: number;
  occupation: string;
  move_in_date: string;
  emergency_contact: string;
  address: string;
  profile_photo_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MeterReading = {
  id: string;
  flat_id: string;
  month: number;
  year: number;
  previous_reading: number;
  current_reading: number;
  units_used: number;
  per_unit_price: number;
  total_bill: number;
  created_at: string;
  updated_at: string;
  flat?: Flat;
};

export type RentCollection = {
  id: string;
  flat_id: string;
  month: number;
  year: number;
  monthly_rent: number;
  electric_bill: number;
  water_bill: number;
  service_charge: number;
  total_payable: number;
  amount_paid: number;
  due_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  collector_name: string;
  collector_phone: string;
  payment_method: 'cash' | 'bkash' | 'nagad' | 'bank_transfer';
  transaction_id: string;
  collection_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  flat?: Flat;
};

export type CollectionHistory = {
  id: string;
  collection_id: string;
  flat_id: string;
  action: string;
  amount: number;
  collector_name: string;
  collector_phone: string;
  payment_method: string;
  transaction_id: string;
  notes: string;
  performed_by: string;
  created_at: string;
  flat?: Flat;
  collection?: RentCollection;
};

export const MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'নগদ (Cash)',
  bkash: 'বিকাশ (bKash)',
  nagad: 'নগদ (Nagad)',
  bank_transfer: 'ব্যাংক ট্রান্সফার',
};
