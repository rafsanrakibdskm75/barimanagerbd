# Risks, Concerns, and Technical Debt

This document details identified risks, gaps, and technical friction points found during the codebase scan of **Bari Manager BD (বাড়ি ম্যানেজার BD)**.

## 1. Architectural & Specification Gaps
- **Offline Mode Discrepancy**:
  - *Risk*: `next plan.txt` explicitly requests offline support ("Even without internet: Monthly due auto generation still works, Data saves locally, Auto sync to server later").
  - *Status*: The current frontend codebase communicates directly with Supabase via remote REST API requests in context loaders and page components. No local data persistence sync strategy (such as IndexDB, PWA service workers, or SQLite caching) is currently implemented. Only basic language and theme choices are synced to `localStorage`.
- **Missing Auto-Monthly Due Generation Engine**:
  - *Risk*: The core user requirement specifies that monthly dues should automatically generate for all occupied flats at the start of each month, with old unpaid rents carrying forward.
  - *Status*: At present, rent collections are created manually one-by-one by the administrator via the "সংগ্রহ যোগ করুন" (Add Collection) modal in `Collections.tsx`. There is no background checker, client-side batch trigger, or database cron job handling automated generation yet.

## 2. Security & Data Integrity Gaps
- **Cascading Delete Vulnerability**:
  - *Risk*: The database schema uses cascade deletes extensively:
    ```sql
    CREATE TABLE flats (
       house_id uuid REFERENCES houses(id) ON DELETE CASCADE, ...
    )
    CREATE TABLE rent_collections (
       flat_id uuid REFERENCES flats(id) ON DELETE CASCADE, ...
    )
    ```
  - *Consequence*: Deleting a house or flat automatically deletes all related rent collections, payment ledgers, and transaction histories permanently without safety confirmations or soft-delete safety nets.
- **Collector Authorization Gaps**:
  - *Risk*: RLS policies allow any authenticated user to select, insert, or update any record under the target tables (e.g., `USING (true)`). If multiple caretakers or collection agents are active, one agent could modify or delete transaction records created by another.

## 3. Performance & Scaling Gaps
- **Client-Side Data Overhead**:
  - *Risk*: Pages like `Collections.tsx` load all collections for the selected month/year in a single query block (`supabase.from('rent_collections').select('*')`).
  - *Consequence*: As the property grows (dozens of buildings and hundreds of flats) over multiple years, loading entire un-paginated record lists will cause substantial network overhead, slow query performance, and high memory utilization on low-end mobile devices.

## 4. Verification and Infrastructure Debt
- **No Automated Tests**:
  - *Risk*: The repository lacks any unit, integration, or visual regression testing setups. There are no testing dependencies configured in `package.json`.
  - *Consequence*: Feature updates, structural database schema modifications, or manual calculation engine changes are highly prone to regressions, which must be caught manually.
