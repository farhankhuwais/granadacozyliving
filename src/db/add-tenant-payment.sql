-- Add payment tracking to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS paid_amount INTEGER DEFAULT 0;

-- Drop old constraint if exists, add new one
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_payment_status_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_payment_status_check CHECK (payment_status IN ('paid', 'unpaid', 'partial'));

-- Update existing rows
UPDATE tenants SET payment_status = 'unpaid' WHERE payment_status IS NULL OR payment_status = 'overdue';
