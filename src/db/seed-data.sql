-- Seed data for Cozy Living by Granada
-- Execute after Chunks 1-3 + profiles inserted

-- 1. Insert property
INSERT INTO properties (id, name, location, total_rooms, investment_scheme, description)
VALUES (
  gen_random_uuid(),
  'Cozy Living by Granada',
  'Granada, Spain',
  8,
  'hybrid',
  'Co-living property with 8 rooms (4 monthly, 4 daily)'
);

-- 2. Update profiles with property_id
UPDATE profiles 
SET property_id = (SELECT id FROM properties ORDER BY created_at ASC LIMIT 1)
WHERE role IN ('investor_only', 'manager_only');

-- 3. Insert rooms (K1-K4 monthly, K5-K8 daily)
DO $$
DECLARE
  prop_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties ORDER BY created_at ASC LIMIT 1;

  INSERT INTO rooms (id, property_id, room_number, type, status, monthly_price, daily_price) VALUES
  (gen_random_uuid(), prop_id, 1, 'bulanan', 'terisi', 1500000, NULL),
  (gen_random_uuid(), prop_id, 2, 'bulanan', 'terisi', 1500000, NULL),
  (gen_random_uuid(), prop_id, 3, 'bulanan', 'terisi', 1500000, NULL),
  (gen_random_uuid(), prop_id, 4, 'bulanan', 'tersedia', 1500000, NULL),
  (gen_random_uuid(), prop_id, 5, 'harian', 'tersedia', NULL, 200000),
  (gen_random_uuid(), prop_id, 6, 'harian', 'tersedia', NULL, 200000),
  (gen_random_uuid(), prop_id, 7, 'harian', 'tersedia', NULL, 200000),
  (gen_random_uuid(), prop_id, 8, 'harian', 'tersedia', NULL, 200000);
END $$;

-- 4. Insert sample tenants
DO $$
DECLARE
  r1 UUID; r2 UUID; r3 UUID;
  prop_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO r1 FROM rooms WHERE property_id = prop_id AND room_number = 1;
  SELECT id INTO r2 FROM rooms WHERE property_id = prop_id AND room_number = 2;
  SELECT id INTO r3 FROM rooms WHERE property_id = prop_id AND room_number = 3;

  INSERT INTO tenants (id, room_id, name, phone, email, lease_start, lease_end, status, id_type, id_number) VALUES
  (gen_random_uuid(), r1, 'Budi Santoso', '081234567890', 'budi@example.com', '2026-01-15', '2026-12-31', 'active', 'KTP', '3201234567890001'),
  (gen_random_uuid(), r2, 'Siti Nurhaliza', '081234567891', 'siti@example.com', '2026-03-01', '2027-02-28', 'active', 'KTP', '3201234567890002'),
  (gen_random_uuid(), r3, 'Ahmad Rahman', '081234567892', 'ahmad@example.com', '2026-02-10', '2026-08-10', 'active', 'KTP', '3201234567890003');
END $$;

-- 5. Insert sample transactions
DO $$
DECLARE
  prop_id UUID;
  r1 UUID; r2 UUID; r3 UUID; r5 UUID; r6 UUID;
  mgr_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO r1 FROM rooms WHERE property_id = prop_id AND room_number = 1;
  SELECT id INTO r2 FROM rooms WHERE property_id = prop_id AND room_number = 2;
  SELECT id INTO r3 FROM rooms WHERE property_id = prop_id AND room_number = 3;
  SELECT id INTO r5 FROM rooms WHERE property_id = prop_id AND room_number = 5;
  SELECT id INTO r6 FROM rooms WHERE property_id = prop_id AND room_number = 6;
  SELECT id INTO mgr_id FROM profiles WHERE email = 'manager@cozyliving.com';

  -- Income - Monthly rent
  INSERT INTO transactions (id, property_id, room_id, type, category, amount, description, transaction_date, created_by) VALUES
  (gen_random_uuid(), prop_id, r1, 'income', 'monthly_rent', 1500000, 'Sewa bulanan K1 - Januari 2026', '2026-01-01', mgr_id),
  (gen_random_uuid(), prop_id, r2, 'income', 'monthly_rent', 1500000, 'Sewa bulanan K2 - Januari 2026', '2026-01-01', mgr_id),
  (gen_random_uuid(), prop_id, r3, 'income', 'monthly_rent', 1500000, 'Sewa bulanan K3 - Januari 2026', '2026-01-01', mgr_id);

  -- Income - Daily rent
  INSERT INTO transactions (id, property_id, room_id, type, category, amount, description, transaction_date, created_by) VALUES
  (gen_random_uuid(), prop_id, r5, 'income', 'daily_rent', 4400000, 'Sewa harian K5 - 22 hari', '2026-01-15', mgr_id),
  (gen_random_uuid(), prop_id, r6, 'income', 'daily_rent', 4000000, 'Sewa harian K6 - 20 hari', '2026-01-15', mgr_id);

  -- Expense
  INSERT INTO transactions (id, property_id, room_id, type, category, amount, description, transaction_date, created_by) VALUES
  (gen_random_uuid(), prop_id, NULL, 'expense', 'property_tax', 1440000, 'IPL Januari 2026', '2026-01-05', mgr_id),
  (gen_random_uuid(), prop_id, NULL, 'expense', 'management_fees', 1080000, 'Management fee 5% - Januari 2026', '2026-01-10', mgr_id);
END $$;

-- 6. Insert sample requests
DO $$
DECLARE
  prop_id UUID;
  r3 UUID; r6 UUID; r2 UUID;
  mgr_id UUID; inv_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO r2 FROM rooms WHERE property_id = prop_id AND room_number = 2;
  SELECT id INTO r3 FROM rooms WHERE property_id = prop_id AND room_number = 3;
  SELECT id INTO r6 FROM rooms WHERE property_id = prop_id AND room_number = 6;
  SELECT id INTO mgr_id FROM profiles WHERE email = 'manager@cozyliving.com';
  SELECT id INTO inv_id FROM profiles WHERE email = 'investor@cozyliving.com';

  INSERT INTO requests (id, property_id, room_id, type, title, status, estimated_cost, notes, created_by, approved_by) VALUES
  (gen_random_uuid(), prop_id, r3, 'maintenance', 'Perbaikan AC', 'proses', 350000, 'AC tidak dingin, perlu isi freon', mgr_id, NULL),
  (gen_random_uuid(), prop_id, r6, 'maintenance', 'Penggantian Lampu', 'selesai', 75000, 'Lampu kamar mati', mgr_id, inv_id),
  (gen_random_uuid(), prop_id, r2, 'inventory', 'Tambahan Meja', 'menunggu', 450000, 'Tenant minta meja belajar tambahan', mgr_id, NULL);
END $$;

-- 7. Verify seed
SELECT 'Profiles:' as info, count(*) FROM profiles
UNION ALL
SELECT 'Properties:', count(*) FROM properties
UNION ALL
SELECT 'Rooms:', count(*) FROM rooms
UNION ALL
SELECT 'Tenants:', count(*) FROM tenants
UNION ALL
SELECT 'Transactions:', count(*) FROM transactions
UNION ALL
SELECT 'Requests:', count(*) FROM requests;
