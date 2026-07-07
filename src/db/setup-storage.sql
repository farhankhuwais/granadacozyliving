-- Create storage bucket for room photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-photos', 'room-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view room photos" ON storage.objects;
DROP POLICY IF EXISTS "Manager can upload room photos" ON storage.objects;

-- Allow public read
CREATE POLICY "Anyone can view room photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-photos');

-- Allow authenticated users to upload
CREATE POLICY "Auth can upload room photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-photos'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to overwrite (upsert)
CREATE POLICY "Auth can update room photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'room-photos' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'room-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Auth can delete room photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'room-photos' AND auth.role() = 'authenticated');
