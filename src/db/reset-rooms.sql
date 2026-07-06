-- Hapus semua data kamar dan relasinya
-- Execute di Supabase SQL Editor

DELETE FROM request_photos;
DELETE FROM requests;
DELETE FROM transactions;
DELETE FROM room_photos;
DELETE FROM tenants;
DELETE FROM rooms;

-- Verify
SELECT count(*) as rooms_count FROM rooms;
SELECT count(*) as tenants_count FROM tenants;
SELECT count(*) as transactions_count FROM transactions;
SELECT count(*) as requests_count FROM requests;
