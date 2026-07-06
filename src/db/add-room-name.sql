-- Add name column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing rooms with default names
UPDATE rooms SET name = 'Kamar ' || room_number WHERE name IS NULL OR name = '';
