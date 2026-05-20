# Code Quality and Standards

This document assesses the standards, patterns, and validation workflows utilized inside **Bari Manager BD (বাড়ি ম্যানেজার BD)**.

## Typing and Compilation Checks
- **Strict TypeScript Profile**:
  - Compiles under `typescript ~5.9.3` using specific sub-configs (`tsconfig.app.json` for compilation targets, `tsconfig.node.json` for bundler hooks).
  - Explicit database types (`House`, `Flat`, `Tenant`, `MeterReading`, `RentCollection`, `CollectionHistory`) are defined and exported in `src/lib/supabase.ts`, preventing runtime type mismatch errors.
  
## Code Formatting & Style Guide
- **Linter Structure**:
  - Flat structure config (`eslint.config.js`) integrates `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` configurations to verify custom hooks compliance and component hot-reloading boundaries.
- **Component Layout & Design System**:
  - Relies completely on Material UI (MUI v7) components and themes (`src/theme.ts`) to avoid inline styles and control color schemes system-wide.
  - Component layouts strictly leverage the theme provider values (`primary`, `success`, `warning`, `error`, `text.secondary`) for status cards and indicators.

## User Experience Standards
- **Loading Indicators**:
  - Global loading screens (e.g. at auth check in `App.tsx` or settings boot in `SettingsContext.tsx`) utilize `<CircularProgress />` components centered within styled `<Box>` structures.
- **Form Inputs and Validations**:
  - Validation blocks (such as in `Collections.tsx` form saver) dynamically calculate derived totals (`totalPayable = monthly_rent + electric_bill + water_bill + service_charge`) before committing transactions.
  - Submit buttons are conditionally disabled (`disabled={saving || !form.flat_id || !form.monthly_rent}`) during state changes or if required inputs are omitted, preventing duplicate requests and corrupted payload submissions.
  - Graceful toast and inline alert warnings are implemented via MUI `<Alert>` components to catch and display Supabase insertion/update transaction exceptions.

## Security Practices
- **Data Protection**:
  - Relies entirely on Supabase Row-Level Security (RLS) policies. Read and write restrictions are applied inside SQL migrations, ensuring users can only read/write their own generated house rental information.
  - Prevents Client-Side Injection vulnerability by routing all requests through the parameterized `@supabase/supabase-js` query compiler.
