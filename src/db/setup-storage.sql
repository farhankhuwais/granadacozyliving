-- Create storage bucket for room photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-photos', 'room-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view photos
CREATE POLICY "Anyone can view room photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-photos');

-- Allow managers and super admin to upload
CREATE POLICY "Manager can upload room photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-photos'
  AND auth.role() = 'authenticated'
);
