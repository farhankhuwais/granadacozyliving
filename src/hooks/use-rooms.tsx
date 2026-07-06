import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useRooms() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["rooms", profile?.propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*, tenants(*)")
        .eq("property_id", profile?.propertyId)
        .order("room_number");
      return data || [];
    },
    enabled: !!profile?.propertyId,
  });
}

export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*, tenants(*)")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });
}
