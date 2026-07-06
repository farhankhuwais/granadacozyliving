import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      room_number: number;
      type: "bulanan" | "harian";
      monthly_price?: number;
      daily_price?: number;
    }) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          ...values,
          property_id: profile?.propertyId,
          status: "tersedia",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
