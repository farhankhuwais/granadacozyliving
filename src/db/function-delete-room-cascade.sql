-- Function: cascade delete room with all related data
-- Runs with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.delete_room_cascade(room_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Delete request photos for this room's requests
  DELETE FROM public.request_photos
  WHERE request_id IN (SELECT id FROM public.requests WHERE room_id = delete_room_cascade.room_id);

  -- Delete requests
  DELETE FROM public.requests WHERE room_id = delete_room_cascade.room_id;

  -- Delete tenants
  DELETE FROM public.tenants WHERE room_id = delete_room_cascade.room_id;

  -- Delete room photos
  DELETE FROM public.room_photos WHERE room_id = delete_room_cascade.room_id;

  -- Delete the room itself
  DELETE FROM public.rooms WHERE id = delete_room_cascade.room_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_room_cascade TO authenticated;
