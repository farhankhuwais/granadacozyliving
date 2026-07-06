-- Add payment tracking to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS paid_amount INTEGER DEFAULT 0;
