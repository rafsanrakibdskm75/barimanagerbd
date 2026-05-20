# Technology Stack and Tools

This document maps out the core technology stack, key dependencies, configuration files, and tools used in the **Bari Manager BD (বাড়ি ম্যানেজার BD)** project.

## Core Technologies
- **Frontend Framework**: React 19 (v19.2.4)
- **Programming Language**: TypeScript (v5.9.3)
- **Build System & Dev Server**: Vite (v8.0.1)
- **UI Framework & Design System**: Material UI (MUI v7.3.9) with Emotion styling (`@emotion/react`, `@emotion/styled`)
- **Database & Authentication Provider**: Supabase (`@supabase/supabase-js` v2.106.0)

## Runtime Dependencies
The following dependencies form the runtime core of the application:
- `react` & `react-dom` (v19.2.4): Modern React component lifecycle.
- `react-router-dom` (v7.15.1): Dynamic routing and navigation layout.
- `@mui/material` & `@mui/icons-material` (v7.3.9): Component library providing material design controls, icons, and layout utilities.
- `@fontsource/roboto` (v5.2.10): Standard typography for MUI layout rendering.
- `date-fns` (v4.2.1): Robust, lightweight date utility module.
- `recharts` (v3.8.1): Dynamic SVG charting system for metrics, reports, and monthly collections.

## Development & Tooling Configuration
The codebase is supported by the following build-time and quality configurations:
- **TypeScript Config**:
  - `tsconfig.json`: Root TypeScript loader targeting app and node profiles.
  - `tsconfig.app.json`: Target configuration for browser app bundle compiled via Vite.
  - `tsconfig.node.json`: Configuration for Vite development and build tooling scripts.
- **ESLint & Code Formatting**:
  - `eslint.config.js`: Flat ESLint layout supporting React hooks, fast-refresh check warnings, and TypeScript validation rules.
- **Vite Config**:
  - `vite.config.ts`: Configuration utilizing `@vitejs/plugin-react` for SWC/Oxc performance.

## Backend Integration
- **Supabase Cloud Interface**: Connected through standard environment-injected configuration values:
  - `VITE_SUPABASE_URL`: DB REST/RPC URL endpoint.
  - `VITE_SUPABASE_ANON_KEY`: Public client-safe credential key.
- **Local Persistence & Cache**:
  - Application settings utilize standard browser `localStorage` as a fallback caching layer for UI preferences (theme, language).
