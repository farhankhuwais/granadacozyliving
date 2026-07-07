# 🏠 Cozy Living by Granada

Dashboard investasi & manajemen operasional properti **co-living real estate**. Mobile-first, dual role (investor + manager), realtime via Supabase.

**Live:** [granadacozyliving.vercel.app](https://granadacozyliving.vercel.app)

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Investor** | Ringkasan investasi, tingkat okupansi, pendapatan/pengeluaran, pie chart kontribusi sewa |
| **Dashboard Manager** | Quick stats, aksi cepat, manajemen operasional |
| **Dashboard Super Admin** | Full kontrol: financial + operasional + manajemen properti multi-unit |
| **Manajemen Kamar & Tenant** | Status kamar real-time, CRUD penyewa, soft delete, lease tracking, history penyewa |
| **Manajemen Keuangan** | Transaksi income/expense, filter per kategori, export CSV |
| **Manajemen Permintaan** | Request maintenance/inventory, workflow approval (manager → investor), upload foto |
| **Multi-Properti** | Kelola beberapa properti, assign user per properti, filter data per properti |
| **Role-Based Access** | Super admin, investor_only, manager_only, investor_manager |
| **PWA** | Install sebagai app di HP, offline support, auto-update |
| **Upload Foto** | Foto kamar (storage Supabase) + avatar profil |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS 3 (Dark theme #000) |
| State & Data | TanStack Query (React Query) |
| Icons | Lucide React |
| Charts | Recharts (PieChart) |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Hosting | Vercel (auto-deploy from GitHub) |

---

## Role & Hak Akses

| Role | Dashboard | Kamar | Keuangan | Permintaan | Admin Panel |
|------|-----------|-------|----------|------------|-------------|
| **super_admin** | Full (all data) | CRUD + foto | Full | Full | Kelola user + properti |
| **investor_only** | Financial + chart | Read-only | Read-only | Approve | - |
| **manager_only** | Operasional | Kelola tenant | Input transaksi | CRUD request | - |
| **investor_manager** | Financial + chart + aksi | CRUD + foto | Read-only | CRUD + approve | - |

---

## Setup Lokal

```bash
# 1. Clone
git clone https://github.com/farhankhuwais/granadacozyliving.git
cd granadacozyliving

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

# 4. Database (via Supabase Dashboard SQL Editor)
# Jalankan file SQL di src/db/ secara berurutan:
src/db/create-tables-chunk-1.sql
src/db/create-tables-chunk-2.sql
src/db/fix-rls-recursion.sql
src/db/seed-data.sql
src/db/function-delete-room-cascade.sql
src/db/setup-storage.sql

# 5. Auth users (via Supabase Dashboard → Authentication → Users)
# Buat user email/password, lalu insert ke tabel profiles:
# INSERT INTO profiles (id, email, role) VALUES ('user-uuid', 'admin@cozyliving.com', 'super_admin');

# 6. Jalankan
npm run dev
```

---

## Struktur Proyek

```
src/
├── routes/                    # Halaman aplikasi
│   ├── login.tsx              # Login page
│   ├── reset-password.tsx     # Reset password
│   ├── index.tsx              # Dashboard investor
│   ├── pengelola.tsx          # Dashboard manager
│   ├── super-admin.tsx        # Dashboard super admin (shared investor_manager)
│   ├── kamar.tsx              # Manajemen kamar & tenant (921 baris)
│   ├── keuangan.tsx           # Manajemen keuangan + export CSV
│   ├── permintaan.tsx         # Request maintenance workflow
│   ├── profil.tsx             # Profil user + edit properti (super admin)
│   └── signup.tsx             # Admin panel: create user + kelola properti
├── components/
│   ├── MobileLayout.tsx       # Layout mobile-first + bottom nav
│   ├── BottomNav.tsx          # Bottom navigation 5 tab
│   ├── ProtectedRoute.tsx     # Role-based route guard
│   ├── ErrorBoundary.tsx      # Global error boundary
│   ├── PWABanner.tsx          # PWA install banner
│   └── CreateUserForm.tsx     # Form create user (admin panel)
├── hooks/
│   ├── use-auth.tsx           # Auth context + CRUD profile
│   ├── use-dashboard.tsx      # Aggregate stats (occupancy, income, expense)
│   ├── use-rooms.tsx          # Room CRUD + cascade delete
│   ├── use-tenants.tsx        # Tenant CRUD + mark paid
│   ├── use-transactions.tsx   # Transaction CRUD + filter
│   ├── use-requests.tsx       # Request CRUD + workflow + auto expense
│   ├── use-properties.tsx     # Property CRUD (multi-property)
│   └── use-toast.tsx          # Toast notification
├── integrations/supabase/
│   ├── client.ts              # Supabase client init
│   └── types.ts               # TypeScript types
├── db/                        # SQL migration files
│   ├── create-tables-chunk-1.sql
│   ├── create-tables-chunk-2.sql
│   ├── fix-rls-recursion.sql
│   ├── seed-data.sql
│   └── ...
├── lib/
│   └── storage.ts             # Supabase Storage helpers
├── main.tsx                   # Entry point + PWA SW update handler
├── App.tsx                    # Router + providers
├── styles.css                 # Global styles (dark theme)
└── pwa.d.ts                   # PWA type declarations
public/
├── icon-192.svg               # PWA icon
├── icon-512.svg               # PWA icon
└── vite.svg
```

---

## Database (Supabase PostgreSQL)

8 tables + SECURITY DEFINER functions:

| Table | Key Fields |
|-------|-----------|
| profiles | id, email, role (enum), property_id, avatar_url |
| properties | id, name, location |
| rooms | id, property_id, room_number, name, type, status, monthly_price, daily_price, notes, created_by |
| room_photos | id, room_id, photo_url, photo_type |
| tenants | id, room_id, name, phone, lease_start, lease_end, status, payment_status, paid_amount |
| transactions | id, property_id, room_id, type, category, amount, created_by |
| requests | id, property_id, room_id, type, title, status, estimated_cost, created_by, approved_by |
| request_photos | id, request_id, photo_url, photo_type |

RLS: SECURITY DEFINER functions bypass RLS. Super admin full access. Regular users filtered by property_id.

---

## PWA

App bisa di-install sebagai aplikasi native di HP:

| Fitur | Detail |
|-------|--------|
| **Install** | Banner hijau → klik Install (Android: native prompt, iOS: panduan manual) |
| **Offline** | Workbox cache assets + API (NetworkFirst) |
| **Auto-update** | Deteksi perubahan → confirm reload → pakai versi baru |
| **Manifest** | name, icons, theme_color #5F7354, display standalone |
| **Icons** | SVG 192x192 + 512x512 |

---

## Deployment

### Production

```bash
# Push ke GitHub → Vercel auto-deploy
git push origin main
```

### Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) |

### Preview

```bash
npm run build
npm run preview
```

---

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@cozyliving.com` | `demo1234` |
| Investor | `investor@cozyliving.com` | `demo1234` |
| Manager | `manager@cozyliving.com` | `demo1234` |

---

## Dev Commands

```bash
npm run dev         # Start Vite dev server (port 3000)
npm run build       # TypeScript check + Vite build
npm run preview     # Preview production build
npm run lint        # ESLint check
```

---

## Lisensi

Hak cipta dilindungi. Proyek ini dibuat untuk keperluan demo dan presentasi klien.
