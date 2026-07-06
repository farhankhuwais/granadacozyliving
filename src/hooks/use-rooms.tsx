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
        .select("*, tenants(*), creator:profiles!created_by(full_name)");

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
      notes?: string;
    }) => {
      // Get property_id - use first available if super admin
      let propertyId = profile?.propertyId;
      if (!propertyId && profile?.role === "super_admin") {
        const { data: firstProp } = await supabase
          .from("properties")
          .select("id")
          .limit(1)
          .single();
        propertyId = firstProp?.id || null;
      }
      if (!propertyId) throw new Error("No property found. Setup property first.");

      const { data, error } = await supabase
        .from("rooms")
        .insert({
          room_number: values.room_number,
          name: values.name,
          type: values.type,
          monthly_price: values.monthly_price,
          daily_price: values.daily_price,
          notes: values.notes || null,
          property_id: propertyId,
          created_by: profile?.id,
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
      // Get request IDs for this room (for cascade delete of request_photos)
      const { data: roomRequests } = await supabase
        .from("requests").select("id").eq("room_id", id);
      const reqIds = roomRequests?.map(r => r.id) || [];

      if (reqIds.length > 0) {
        const { error: err0 } = await supabase
          .from("request_photos").delete().in("request_id", reqIds);
        if (err0) throw err0;
      }

      const { error: err1 } = await supabase.from("tenants").delete().eq("room_id", id);
      if (err1) throw err1;
      const { error: err2 } = await supabase.from("room_photos").delete().eq("room_id", id);
      if (err2) throw err2;
      const { error: err3 } = await supabase.from("requests").delete().eq("room_id", id);
      if (err3) throw err3;

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
