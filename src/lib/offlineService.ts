/**
 * offlineService.ts
 * -----------------
 * Provides a lightweight offline-cache layer backed by localStorage.
 *
 * Tables cached: houses, flats, tenants, rent_collections, meter_readings, collection_history
 *
 * Usage:
 *   import { cacheAll, readCache, isOnline } from './offlineService';
 *
 *   const data = isOnline() ? (await supabase.from('houses').select('*')).data
 *                           : readCache('houses');
 */

import { supabase } from './supabase';

const CACHE_PREFIX = 'bari_offline_';
const CACHE_TS_KEY = 'bari_offline_cached_at';

const TABLES = [
  'houses',
  'flats',
  'tenants',
  'rent_collections',
  'meter_readings',
  'collection_history',
  'app_settings',
] as const;

// CacheTable type removed (unused) to satisfy TypeScript no-unused declarations

/** Returns true if the browser reports an active network connection */
export function isOnline(): boolean {
  return navigator.onLine;
}

/** Returns the ISO timestamp of the last successful full cache */
export function getCachedAt(): string | null {
  return localStorage.getItem(CACHE_TS_KEY);
}

/** Read one table's cached data (returns empty array if not cached) */
export function readCache<T = any>(table: string): T[] {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${table}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/** Write one table's data into the cache */
export function writeCache(table: string, data: any[]): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${table}`, JSON.stringify(data));
  } catch (e) {
    console.warn('offlineService: localStorage quota exceeded or blocked', e);
  }
}

/** Clear the entire offline cache */
export function clearCache(): void {
  TABLES.forEach(t => localStorage.removeItem(`${CACHE_PREFIX}${t}`));
  localStorage.removeItem(CACHE_TS_KEY);
}

/**
 * Pull all tables from Supabase and write them to localStorage.
 * Call this when the user is online and "Sync Now" is pressed.
 * Returns the number of rows cached in total.
 */
export async function cacheAll(): Promise<number> {
  let total = 0;
  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (!error && data) {
        writeCache(table, data);
        total += data.length;
      }
    } catch (e) {
      console.warn(`offlineService: failed to cache ${table}`, e);
    }
  }
  localStorage.setItem(CACHE_TS_KEY, new Date().toISOString());
  return total;
}

/**
 * Smart fetch helper.
 * Returns live Supabase data when online, cached data when offline.
 */
export async function smartFetch<T = any>(
  table: string,
  query: () => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  if (isOnline()) {
    const { data, error } = await query();
    if (!error && data) {
      writeCache(table, data);   // keep cache fresh
      return data;
    }
    // Network request failed even though `navigator.onLine` was true — fall back
    return readCache<T>(table);
  }
  return readCache<T>(table);
}
