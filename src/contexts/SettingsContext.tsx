import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cacheAll, getCachedAt, isOnline } from '../lib/offlineService';

interface AppSettings {
  id: string;               // DB primary key — always present after load
  updated_at?: string;      // optional — may not exist in older tables
  app_name: string;
  default_language: 'bn' | 'en';
  theme_mode: 'light' | 'dark';
  date_format: string;
  currency: string;
  house_name: string;
  default_monthly_rent: number;
  due_date: number;
  late_fee_percentage: number;
  auto_bill_generate: boolean;
  auto_carry_meter_reading: boolean;
  partial_payment_enabled: boolean;
  electricity_per_unit: number;
  water_bill_amount: number;
  service_charge_amount: number;
  gas_bill_amount: number;
  auto_meter_calculation: boolean;
  meter_warning_limit: number;
  pending_rent_reminder: boolean;
  due_date_notification: boolean;
  overdue_alert: boolean;
  push_notification_enabled: boolean;
  sound_vibration_enabled: boolean;
  offline_mode_enabled: boolean;
  auto_sync_enabled: boolean;
  default_payment_method: string;
  auto_generate_receipt: boolean;
  monthly_pdf_export: boolean;
  excel_export: boolean;
  auto_report_generate: boolean;
  theme_color: string;
  card_style: string;
  font_size: 'small' | 'normal' | 'large';
  compact_mode: boolean;
  animations_enabled: boolean;
  app_version: string;
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  deleteAllData: () => Promise<void>;
  deleteTableData: (tableName: string) => Promise<void>;
  exportDatabase: () => Promise<void>;
  importBackup: (data: any) => Promise<void>;
  lastSyncTime: Date | null;
  syncDatabase: () => Promise<void>;
  /** True when browser is offline */
  networkOffline: boolean;
  /** ISO string of last successful full cache, or null */
  offlineCacheAge: string | null;
  t: (bn: string, en: string) => string;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'local-defaults',
  app_name: 'Bari Manager BD',
  default_language: 'bn',
  theme_mode: 'light',
  date_format: 'dd/MM/yyyy',
  currency: '৳',
  house_name: '',
  default_monthly_rent: 0,
  due_date: 5,
  late_fee_percentage: 0,
  auto_bill_generate: false,
  auto_carry_meter_reading: false,
  partial_payment_enabled: true,
  electricity_per_unit: 7,
  water_bill_amount: 0,
  service_charge_amount: 0,
  gas_bill_amount: 0,
  auto_meter_calculation: true,
  meter_warning_limit: 0,
  pending_rent_reminder: true,
  due_date_notification: true,
  overdue_alert: true,
  push_notification_enabled: true,
  sound_vibration_enabled: true,
  offline_mode_enabled: false,
  auto_sync_enabled: true,
  default_payment_method: 'cash',
  auto_generate_receipt: true,
  monthly_pdf_export: false,
  excel_export: false,
  auto_report_generate: false,
  theme_color: '#1976d2',
  card_style: 'elevated',
  font_size: 'normal',
  compact_mode: false,
  animations_enabled: true,
  app_version: 'v1.0.0',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [networkOffline, setNetworkOffline] = useState(!isOnline());
  const [offlineCacheAge, setOfflineCacheAge] = useState<string | null>(getCachedAt());

  // Listen for browser online / offline events
  useEffect(() => {
    const handleOnline = () => setNetworkOffline(false);
    const handleOffline = () => setNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('app_settings').select('*').maybeSingle();
      if (error) {
        console.warn('loadSettings: Error fetching app_settings. Using local defaults.', error);
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      if (!data) {
        // If settings row does not exist, attempt to insert one
        const { data: newSettings, error: insertErr } = await supabase
          .from('app_settings')
          .insert([{}])
          .select()
          .maybeSingle();

        if (insertErr) {
          console.warn('loadSettings: Failed to insert default settings (likely unauthorized). Using local defaults.', insertErr.message);
          setSettings(DEFAULT_SETTINGS);
        } else {
          setSettings((newSettings as AppSettings) || DEFAULT_SETTINGS);
        }
      } else {
        setSettings(data as AppSettings);
      }
    } catch (err) {
      console.error('loadSettings: Unhandled exception loading settings.', err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;

    // Guard: must have DB row id
    if (!settings.id) {
      console.error('updateSettings: settings row has no id — cannot update');
      return;
    }

    // ── Optimistic: update UI instantly ───────────────────────────────────
    const previousSettings = settings;
    setSettings({ ...settings, ...updates });

    // Persist critical prefs to localStorage for instant bootstrap on next load
    if (updates.default_language !== undefined)
      localStorage.setItem('app_language', updates.default_language);
    if (updates.theme_mode !== undefined)
      localStorage.setItem('app_theme', updates.theme_mode);
    if (updates.animations_enabled !== undefined)
      localStorage.setItem('app_animations', String(updates.animations_enabled));
    if (updates.offline_mode_enabled !== undefined)
      localStorage.setItem('app_offline_mode', String(updates.offline_mode_enabled));
    // ─────────────────────────────────────────────────────────────────────

    // If using local defaults (e.g. unauthenticated or database error), skip Supabase update
    if (settings.id === 'local-defaults') {
      return;
    }

    // Strip id/updated_at from the updates payload (avoid PK conflicts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, updated_at: _ua, ...safeUpdates } = updates as any;

    // Attempt 1: with updated_at timestamp
    let { error } = await supabase
      .from('app_settings')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', settings.id);

    // Attempt 2: if updated_at column doesn't exist, retry without it
    if (error && (error.message?.includes('updated_at') || error.code === '42703')) {
      const retry = await supabase
        .from('app_settings')
        .update(safeUpdates)
        .eq('id', settings.id);
      error = retry.error;
    }

    if (error) {
      // Rollback optimistic update
      setSettings(previousSettings);
      if (updates.default_language !== undefined)
        localStorage.setItem('app_language', previousSettings.default_language);
      if (updates.theme_mode !== undefined)
        localStorage.setItem('app_theme', previousSettings.theme_mode);
      if (updates.animations_enabled !== undefined)
        localStorage.setItem('app_animations', String(previousSettings.animations_enabled));
      if (updates.offline_mode_enabled !== undefined)
        localStorage.setItem('app_offline_mode', String(previousSettings.offline_mode_enabled ?? false));
      throw new Error(error.message); // bubble to handleSave → shows error toast
    }
  };



  const deleteTableData = async (tableName: string) => {
    try {
      const { error } = await supabase.from(tableName).delete().neq('id', '');
      if (error) throw error;
    } catch (err) {
      console.error(`Error deleting data from ${tableName}:`, err);
    }
  };

  const deleteAllData = async () => {
    const tables = [
      'collection_history',
      'meter_readings',
      'rent_collections',
      'tenants',
      'flats',
      'houses',
    ];
    for (const table of tables) {
      await deleteTableData(table);
    }
  };

  const exportDatabase = async () => {
    const tables = [
      'houses',
      'flats',
      'tenants',
      'rent_collections',
      'meter_readings',
      'collection_history',
      'app_settings',
    ];

    const backup: any = {};
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*');
      backup[table] = data || [];
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bari-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (data: any) => {
    try {
      for (const [table, records] of Object.entries(data)) {
        if (Array.isArray(records) && records.length > 0) {
          await supabase.from(table).insert(records as any);
        }
      }
      await loadSettings();
    } catch (err) {
      console.error('Error importing backup:', err);
    }
  };

  /** Sync Now: pull all tables into localStorage cache */
  const syncDatabase = async () => {
    await cacheAll();
    const now = new Date();
    setLastSyncTime(now);
    setOfflineCacheAge(now.toISOString());
  };

  const t = (bn: string, en: string): string => {
    return settings?.default_language === 'en' ? en : bn;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        deleteAllData,
        deleteTableData,
        exportDatabase,
        importBackup,
        lastSyncTime,
        syncDatabase,
        networkOffline,
        offlineCacheAge,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
