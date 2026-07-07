# AGENTS.md — Cozy Living by Granada

## Project Overview
Mobile-first PWA dashboard for co-living property management. Dual role: Investor (financial tracking) + Manager (operations). Super admin can do everything across multiple properties.

**Live:** https://granadacozyliving.vercel.app

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite 5 + React Router DOM v7 + TanStack Query
- **Styling:** Tailwind CSS 3 (brand: primary=#5F7354, secondary=#9AA67A, accent=#D39A56)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Charts:** Recharts (PieChart)
- **PWA:** vite-plugin-pwa (Workbox, auto-update, install banner)
- **Hosting:** Vercel (auto-deploy from GitHub)

## Database (Supabase PostgreSQL)
8 tables + SECURITY DEFINER functions for RLS bypass:

### Tables
| Table | Key Fields | Notes |
|-------|-----------|-------|
| profiles | id, email, role (enum), property_id, avatar_url | Links to auth.users |
| properties | id, name, location | Multi-property support |
| rooms | id, property_id, room_number, name, type (enum), status, monthly_price, daily_price, notes, created_by | name = display label (e.g. "Melati") |
| room_photos | id, room_id, photo_url, photo_type (enum) | Uploaded to Supabase Storage |
| tenants | id, room_id, name, phone, lease_start, lease_end, status, id_type, id_number, payment_status, paid_amount, ended_at | |
| transactions | id, property_id, room_id, type (income/expense), category (enum), amount, created_by | |
| requests | id, property_id, room_id, type (maintenance/inventory), title, status (workflow), estimated_cost, created_by, approved_by | |
| request_photos | id, request_id, photo_url, photo_type (enum) | evidence type |

### RLS Strategy
- `SECURITY DEFINER` functions (`is_super_admin()`, `has_manager_role()`, `has_investor_role()`, `user_property_id()`) bypass RLS
- Super admin: full access all tables
- Regular users: filtered by property_id

### Storage
- Bucket: `room-photos` (public)
- Paths: `{roomId}/{timestamp}.{ext}` for rooms, `requests/{requestId}/{type}_{timestamp}.{ext}` for requests
- Paths: `avatars/{profileId}_{timestamp}.{ext}` for avatars

## Routes (`src/routes/`)

| Route | File | Roles |
|-------|------|-------|
| `/` | supver-admin.tsx (super_admin/investor_manager) / index.tsx (investor_only) / pengelola.tsx (manager_only) | All |
| `/login` | login.tsx | - |
| `/reset-password` | reset-password.tsx | - |
| `/kamar` | kamar.tsx | All |
| `/keuangan` | keuangan.tsx | super_admin, investor_only, investor_manager |
| `/permintaan` | permintaan.tsx | super_admin, manager_only, investor_manager |
| `/profil` | profil.tsx | All |
| `/admin/users` | signup.tsx | super_admin only |
| `/pengelola` | pengelola.tsx | super_admin, manager_only, investor_manager |

## Hooks (`src/hooks/`)
| Hook | File | Purpose |
|------|------|---------|
| useAuth | use-auth.tsx | Auth context + role helpers + profile CRUD |
| useDashboard | use-dashboard.tsx | Aggregate stats (occupancy, income, expense) |
| useRooms | use-rooms.tsx | Room CRUD + cascade delete + property join |
| useTenants | use-tenants.tsx | Tenant CRUD, mark paid, history delete |
| useTransactions | use-transactions.tsx | Transaction CRUD + filter |
| useRequests | use-requests.tsx | Request CRUD + status workflow + auto expense |
| useProperties | use-properties.tsx | Property CRUD (multi-property) |
| useToast | use-toast.tsx | Toast notification system |

## Components (`src/components/`)
| Component | Purpose |
|-----------|---------|
| MobileLayout + BottomNav | Mobile-first layout + 5-tab bottom nav (Dashboard center) |
| ProtectedRoute | Role-based route protection |
| ErrorBoundary | Global error catch + reload |
| PWABanner | PWA install banner (native prompt + fallback guide) |
| CreateUserForm | Form create user (admin panel) |

## Roles & Permissions
| Role | Dashboard | Kamar | Keuangan | Permintaan | Admin Panel |
|------|-----------|-------|----------|------------|-------------|
| super_admin | Full (all data) | CRUD + foto | Full | Full | Kelola user + properti |
| investor_only | Financial + chart | Read-only | Read-only | Approve | - |
| manager_only | Operasional | Kelola tenant | Input transaksi | CRUD request | - |
| investor_manager | Financial + chart + aksi | CRUD + foto | Read-only | CRUD + approve | - |

## Bottom Nav Order
`Kamar | Keuangan | Dashboard | Permintaan | Profil`

## Key Flows

### Payment Flow
1. Manager marks tenant paid ( $ icon ) → prompt amount
2. Creates income transaction + updates tenant.payment_status
3. Partial payment supported (Sisa badge on room card)

### Maintenance Request Flow
1. Manager creates request (with optional photos)
2. Investor approves/rejects (sees photos before deciding)
3. Manager proses → selesai
4. Auto-creates expense transaction on completion

### Room Management
- Super admin + investor_manager: add/edit/delete rooms, upload photos
- Manager: add/edit/end tenant lease
- Ended tenants move to History tab
- Room card shows property name + creator info (super admin sees all properties)

## PWA
- **Install:** Banner hijau → klik Install (native prompt on Android, guide on iOS)
- **Auto-update:** SW detect changes → confirm dialog → reload
- **Offline:** Workbox cache (NetworkFirst for Supabase API)
- **Manifest:** standalone, theme #5F7354, icons SVG 192+512

## Pending / Known Issues
- [ ] Default rooms (K1-K8) need manual SQL seed
- [ ] Lease expiry notifications (requires cron)
- [ ] WhatsApp/email integration (phase 2)

## Environment Variables
```
VITE_SUPABASE_URL=https://uwawqxcsqcqcnowijufg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.uwawqxcsqcqcnowijufg:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## Deployment
- Push to `main` → Vercel auto-deploy
- Env vars set via Vercel dashboard / CLI

## Dev Commands
```bash
npm run dev        # Vite dev server (port 3000)
npm run build      # tsc -b && vite build
npm run preview    # Preview production build
```

## SQL Files (src/db/)
| File | Purpose |
|------|---------|
| create-tables-chunk-1.sql | ENUMs + tables 1-4 |
| create-tables-chunk-2.sql | Tables 5-8 |
| fix-rls-recursion.sql | SECURITY DEFINER functions (CURRENT) |
| seed-data.sql | Sample property + rooms + seed data |
| insert-profiles.sql | Insert profiles from auth.users |
| reset-rooms.sql | Delete + re-insert rooms |
| add-room-name.sql | Add name column to rooms |
| add-room-created-by.sql | Add created_by to rooms |
| add-tenant-payment.sql | Add payment tracking columns |
| add-tenant-ended-at.sql | Add ended_at to tenants |
| function-delete-room-cascade.sql | SECURITY DEFINER cascade delete |
| setup-storage.sql | Create storage bucket |

## UI Brand Colors
```
Primary:  #5F7354 (sage green)
Secondary:#9AA67A (light sage)
Accent:   #D39A56 (gold)
Bg:       #ffffff
Text:     #1a1a1a
```

## Design File
Pencil design: `.pencil/documents/aabfb78c-8c07-4d21-a6d1-bd20e04a543e/pencil-new.pen`

## Tips for Resuming
1. `.env.local` — check Supabase credentials
2. `npm run dev` — start server
3. Login `admin@cozyliving.com` / `demo1234` (super admin)
4. Reset DB: run `seed-data.sql` via Supabase dashboard
5. Deploy: `git push origin main` → Vercel auto-deploy
