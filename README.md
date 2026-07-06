# Cozy Living by Granada

Dashboard investasi & manajemen operasional properti co-living real estate. Mobile-first, dual role (investor + manager).

---

## Fitur

- **Dashboard Investor** — Ringkasan investasi, tingkat okupansi, pendapatan/pengeluaran, grafik kontribusi per kamar
- **Dashboard Manager** — Quick stats, aksi cepat, manajemen operasional
- **Manajemen Kamar & Tenant** — Status kamar real-time, CRUD penyewa, soft delete, lease tracking
- **Manajemen Keuangan** — Pencatatan transaksi (income/expense), filter, breakdown per kategori, export CSV
- **Manajemen Permintaan** — Request maintenance/inventory, workflow approval (manager → investor), tracking status
- **Manajemen Pengguna** — Super admin dapat membuat akun investor/manager dengan role-based access
- **Autentikasi** — Login, password reset, role-based routing, protected routes

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router DOM |
| Styling | Tailwind CSS 3 (Dark theme) |
| State | TanStack Query |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| ORM | Drizzle ORM |
| Charts | Recharts |
| Export | Custom CSV |
| Icons | Lucide React |
| Hosting | Vercel (Frontend) + Supabase (Backend) |

---

## Prasyarat

- Node.js 18+
- NPM 9+
- Akun Supabase (gratis)
- Akun Vercel (gratis)

---

## Setup Lokal

```bash
# 1. Clone repository
git clone https://github.com/farhankhuwais/granadacozyliving.git
cd granadacozyliving

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan credentials Supabase Anda

# 4. Setup database (via Supabase Dashboard)
# - Execute SQL di src/db/create-tables-chunk-1.sql
# - Execute SQL di src/db/create-tables-chunk-2.sql
# - Execute SQL di src/db/create-tables-chunk-3.sql
# - Execute SQL di src/db/seed-data.sql

# 5. Buat auth users di Supabase Dashboard
# - admin@cozyliving.com / demo1234 (super admin)
# - investor@cozyliving.com / demo1234 (investor)
# - manager@cozyliving.com / demo1234 (manager)

# 6. Jalankan development server
npm run dev
```

---

## Struktur Proyek

```
src/
├── routes/              # Halaman aplikasi
│   ├── login.tsx        # Login page
│   ├── reset-password.tsx
│   ├── signup.tsx       # Super admin create user
│   ├── index.tsx        # Dashboard investor
│   ├── pengelola.tsx    # Dashboard manager
│   ├── kamar.tsx        # Manajemen kamar & tenant
│   ├── keuangan.tsx     # Manajemen keuangan + export
│   ├── permintaan.tsx   # Request maintenance workflow
│   └── profil.tsx       # Profil & logout
├── components/
│   ├── ProtectedRoute.tsx   # Role-based access
│   ├── MobileLayout.tsx     # Layout mobile-first
│   └── BottomNav.tsx        # Bottom navigation
├── hooks/               # React hooks + TanStack Query
│   ├── use-auth.tsx
│   ├── use-dashboard.tsx
│   ├── use-rooms.tsx
│   ├── use-tenants.tsx
│   ├── use-transactions.tsx
│   ├── use-requests.tsx
│   └── use-toast.tsx
├── integrations/supabase/
│   ├── client.ts        # Supabase client
│   ├── auth.ts          # Auth helpers
│   ├── types.ts         # TypeScript types
│   └── rls-policies.sql # RLS policies
├── db/
│   ├── schema.ts        # Drizzle ORM schema
│   ├── index.ts         # Drizzle client
│   └── seed-*.sql       # Seed data scripts
├── lib/                 # Utilities
├── main.tsx             # Entry point
├── App.tsx              # Router + providers
└── styles.css           # Global styles (dark theme)
```

---

## Deployment

### Frontend (Vercel)

```bash
# Push ke GitHub
git push origin main

# Import repository ke Vercel
# Set environment variables:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# Deploy
```

### Backend (Supabase)

Sudah include dalam satu project. Cukup setup database dan auth via Supabase Dashboard.

---

## Demo Akun

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@cozyliving.com | demo1234 |
| Investor | investor@cozyliving.com | demo1234 |
| Manager | manager@cozyliving.com | demo1234 |

---

## Lisensi

Hak cipta dilindungi. Proyek ini dibuat untuk keperluan demo dan presentasi klien.
