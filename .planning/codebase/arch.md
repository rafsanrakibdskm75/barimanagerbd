# System Architecture and Design

This document maps out the logical and component-level architecture of **Bari Manager BD (বাড়ি ম্যানেজার BD)**.

## Architecture Overview
The application follows a standard **Serverless Client-Side Single Page Application (SPA)** model. The frontend is built with React, styled using Material UI, and integrated directly with a **Supabase** backend for Authentication, Relational Storage (PostgreSQL), and Row-Level Security (RLS) enforcement.

```mermaid
graph TD
    subgraph Client Application [React SPA]
        A[Router: react-router-dom] --> B[AppRoutes Layout / Auth Filter]
        B --> C[Layout Shell]
        C --> D1[Dashboard Page]
        C --> D2[Houses / Flats / Tenants Pages]
        C --> D3[Meter / MeterHistory Pages]
        C --> D4[Collections / History Pages]
        C --> D5[Reports & Settings Pages]
        
        E[AuthContext] -. Provides Session .-> B
        F[SettingsContext] -. Provides Global Preferences .-> C
    end
    
    subgraph Cloud Backend [Supabase Services]
        G[Auth Manager] <--> E
        H[PostgreSQL DB with RLS] <--> F
        H <--> D2
        H <--> D3
        H <--> D4
    end
```

## Codebase Directory Structure
```
bd rent/
├── .planning/                  # Project roadmap & codebase maps
│   └── codebase/               # Target scan reports (tech, arch, quality, concerns)
├── src/
│   ├── components/             # Reusable global layout component(s)
│   │   └── Layout.tsx          # Main layout shell with sidebar drawer and mobile toolbar
│   ├── contexts/               # React Context Providers for global state
│   │   ├── AuthContext.tsx     # Session state & sign-in/sign-out logic
│   │   └── SettingsContext.tsx # Global settings, data exports, backups, and deletes
│   ├── lib/                    # Library configurations
│   │   └── supabase.ts         # Supabase Client config and TypeScript models
│   ├── pages/                  # Route-level Page views
│   │   ├── Collections.tsx     # Rent collection list and manual payment logs
│   │   ├── Dashboard.tsx       # Statistics summaries and graphical charts
│   │   ├── Flats.tsx           # Flat inventory management
│   │   ├── History.tsx         # Payment logs and ledger audit trail
│   │   ├── Houses.tsx          # House list manager
│   │   ├── Login.tsx           # Email-based administration authentication
│   │   ├── Meter.tsx           # Current month electricity meter input
│   │   ├── MeterHistory.tsx    # Historical log of meter readings
│   │   ├── Reports.tsx         # Graphic data analysis and income reporting
│   │   ├── Settings.tsx        # System configuration panel
│   │   └── Tenants.tsx         # Active and historical tenant profile manager
│   └── supabase/
│       └── migrations/         # PostgreSQL schema structure files
├── index.html                  # HTML entry point
├── vite.config.ts              # Bundler configuration
└── package.json                # Project dependencies
```

## Relational Database Schema
The system maps domain objects directly to relational PostgreSQL tables:

```mermaid
erDiagram
    HOUSES ||--o{ FLATS : contains
    FLATS ||--o| TENANTS : occupies
    FLATS ||--o{ METER_READINGS : records
    FLATS ||--o{ RENT_COLLECTIONS : collects
    RENT_COLLECTIONS ||--o{ COLLECTION_HISTORY : audits
    
    HOUSES {
        uuid id PK
        text name
        text owner_name
        text address
        integer total_flats
        text caretaker_name
        text caretaker_phone
        uuid created_by FK
        timestamptz created_at
    }
    
    FLATS {
        uuid id PK
        uuid house_id FK
        text flat_number
        integer floor_number
        integer room_count
        numeric monthly_rent
        numeric water_bill
        numeric service_charge
        text status "occupied/vacant"
        timestamptz created_at
    }
    
    TENANTS {
        uuid id PK
        uuid flat_id FK
        text full_name
        text phone
        text nid_number
        integer family_members
        text occupation
        date move_in_date
        text emergency_contact
        text address
        text profile_photo_url
        boolean is_active
        timestamptz created_at
    }
    
    METER_READINGS {
        uuid id PK
        uuid flat_id FK
        integer month
        integer year
        numeric previous_reading
        numeric current_reading
        numeric units_used "generated"
        numeric per_unit_price
        numeric total_bill "generated"
    }
    
    RENT_COLLECTIONS {
        uuid id PK
        uuid flat_id FK
        integer month
        integer year
        numeric monthly_rent
        numeric electric_bill
        numeric water_bill
        numeric service_charge
        numeric total_payable
        numeric amount_paid
        numeric due_amount "generated"
        text payment_status "pending/partial/paid"
        text collector_name
        text payment_method
        timestamptz collection_date
    }
```

## Core Architectural Flows
1. **User Authentication Flow**:
   - `AuthContext` checks active Supabase JWT session on startup.
   - If unauthenticated, `AppRoutes` intercepts navigation and renders `<Login />`.
   - If authenticated, layout unlocks dashboard routes.
2. **Settings Synchronisation Flow**:
   - On startup, `SettingsContext` loads or inserts a row into `app_settings`.
   - UI views reference the provider values (such as per-unit electricity price, due dates).
   - Local configurations fall back onto `localStorage` keys for multi-lingual default states.
3. **Smart Rent Collection Generation Flow**:
   - Rent collections are recorded per flat with a compound index on `(flat_id, month, year)`.
   - Bill values are composed dynamically based on flat parameters (monthly rent, water, service charge) plus the generated electricity bill from that month's `meter_readings`.
