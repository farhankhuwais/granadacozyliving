# AGENTS.md — Cozy Living by Granada

## Project Overview
Mobile-first dashboard for co-living property management. Dual role: Investor (financial tracking) + Manager (operations). Super admin can do everything.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + React Router DOM + TanStack Query
- **Styling:** Tailwind CSS 3 (brand: primary=#5F7354, secondary=#9AA67A, accent=#D39A56)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Charts:** Recharts
- **Export:** Custom CSV

## Database (Supabase PostgreSQL)
8 tables + SECURITY DEFINER functions for RLS bypass:

### Tables
| Table | Key Fields | Notes |
|-------|-----------|-------|
| profiles | id, email, role (enum), property_id | Links to auth.users |
| properties | id, name, location, total_rooms | Single property for MVP |
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

## Key Files & Structure

### Routes (under src/routes/)
| Route | File | Roles |
|-------|------|-------|
| `/` | index.tsx (Investor) / pengelola.tsx (Manager) / super-admin.tsx | All |
| `/login` | login.tsx | - |
| `/reset-password` | reset-password.tsx | - |
| `/kamar` | kamar.tsx | All |
| `/keuangan` | keuangan.tsx | Investor+, Manager- |
| `/permintaan` | permintaan.tsx | Manager+, Investor approve |
| `/profil` | profil.tsx | All |
| `/admin/users` | signup.tsx | Super admin only |
| `/pengelola` | pengelola.tsx | Manager+ |

### Hooks (src/hooks/)
| Hook | File | Purpose |
|------|------|---------|
| useAuth | use-auth.tsx | Auth context + role helpers |
| useDashboard | use-dashboard.tsx | Aggregate stats for dashboard |
| useRooms | use-rooms.tsx | Room CRUD, cascade delete |
| useTenants | use-tenants.tsx | Tenant CRUD, mark paid, history delete |
| useTransactions | use-transactions.tsx | Transaction CRUD + filter |
| useRequests | use-requests.tsx | Request CRUD + status workflow + auto expense |
| useToast | use-toast.tsx | Toast notification system |

### Components (src/components/)
| Component | Purpose |
|-----------|---------|
| MobileLayout + BottomNav | Mobile-first layout + bottom nav bar |
| ProtectedRoute | Role-based route protection |
| ErrorBoundary | Global error catch + reload |

### Lib (src/lib/)
- `storage.ts` — Supabase Storage helpers for room photos

## Roles & Permissions
| Role | Access |
|------|--------|
| super_admin | Full CRUD all features + admin panel |
| investor_only | Read-only financial, approve requests |
| manager_only | Manage tenants, rooms, input transactions, create requests |
| investor_manager | Both investor + manager abilities |

## Key Flows

### Payment Flow
1. Manager marks tenant paid ( $ icon ) → prompt amount
2. Creates income transaction + updates tenant.payment_status
3. Partial payment supported (Sisa badge shown on room card)

### Maintenance Request Flow
1. Manager creates request (with optional photos)
2. Investor approves/rejects (sees photos before deciding)
3. Manager proses → selesai
4. Auto-creates expense transaction on completion

### Room Management
- Super admin: add/edit/delete rooms, upload photos
- Manager: add/edit/end tenant lease
- Ended tenants move to History tab

## Pending / Known Issues
- [ ] Default rooms (K1-K8) need to be manually inserted via SQL seed
- [ ] Room photo upload via thumbnail click menu
- [ ] CSV export for transactions
- [ ] Lease expiry automated notifications (requires cron)
- [ ] WhatsApp/email integration (phase 2)
- [ ] Multi-property support (phase 2)

## Environment Variables (.env.local)
```
VITE_SUPABASE_URL=https://uwawqxcsqcqcnowijufg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.uwawqxcsqcqcnowijufg:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## Dev Commands
```bash
npm run dev        # Start Vite dev server
npm run build      # Build production
npm run db:push    # Push Drizzle migrations (if re-enabled)
```

## SQL Files (src/db/)
| File | Purpose |
|------|---------|
| create-tables-chunk-1.sql | ENUMs + tables 1-4 |
| create-tables-chunk-2.sql | Tables 5-8 |
| create-tables-chunk-3.sql | RLS policies (OBSOLETE) |
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

## Tips for Resuming
1. Check `.env.local` for Supabase credentials
2. Run `npm run dev` to start
3. Login with `admin@cozyliving.com` / `demo1234` (super admin)
4. To reset database: run SQL from `seed-data.sql` via Supabase dashboard
5. All SQL files in `src/db/` are safe to re-run (use `IF NOT EXISTS` / `ON CONFLICT`)
