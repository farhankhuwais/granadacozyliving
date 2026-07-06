import { supabase } from "@/integrations/supabase/client";

export async function uploadRoomPhoto(
  roomId: string,
  file: File,
  caption: string,
  photoType: string,
  uploadedBy: string
) {
  const ext = file.name.split(".").pop();
  const filePath = `${roomId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("room-photos")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("room-photos")
    .getPublicUrl(filePath);

  const { error: dbError } = await supabase.from("room_photos").insert({
    room_id: roomId,
    photo_url: urlData.publicUrl,
    caption,
    photo_type: photoType,
    uploaded_by: uploadedBy,
  });

  if (dbError) throw dbError;

  return urlData.publicUrl;
}

export async function deleteRoomPhoto(photoId: string, photoUrl: string) {
  // Extract path from URL to delete from storage
  const path = photoUrl.split("/room-photos/")[1];
  if (path) {
    await supabase.storage.from("room-photos").remove([path]);
  }
  const { error } = await supabase.from("room_photos").delete().eq("id", photoId);
  if (error) throw error;
}

export async function getRoomPhotos(roomId: string) {
  const { data } = await supabase
    .from("room_photos")
    .select("*")
    .eq("room_id", roomId)
    .order("uploaded_at", { ascending: false });
  return data || [];
}
