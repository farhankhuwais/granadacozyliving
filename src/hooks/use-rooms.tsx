import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useRooms() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const propertyId = profile?.propertyId;

  return useQuery({
    queryKey: ["rooms", propertyId, { superAdmin: isSuperAdmin }],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select("*, tenants(*)");

      if (!isSuperAdmin && propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data } = await query.order("room_number");
      return data || [];
    },
    enabled: true,
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
      name: string;
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
      // Delete related data first, then room
      await supabase.from("tenants").delete().eq("room_id", id);
      await supabase.from("room_photos").delete().eq("room_id", id);
      await supabase.from("requests").delete().eq("room_id", id);
      await supabase.from("request_photos").delete().eq("room_id", id);
      // Not needed since request_photos uses request_id, but keep for safety
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from("rooms").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
