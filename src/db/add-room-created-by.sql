-- Add created_by column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Update existing rooms with super admin (first admin user)
UPDATE rooms SET created_by = (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1) WHERE created_by IS NULL;
