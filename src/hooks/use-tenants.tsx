import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useTenants() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["tenants", profile?.propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select("*, rooms(*)")
        .in(
          "room_id",
          (
            await supabase
              .from("rooms")
              .select("id")
              .eq("property_id", profile?.propertyId)
          ).data?.map((r) => r.id) || []
        )
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.propertyId,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("tenants")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      if (values.room_id) {
        await supabase
          .from("rooms")
          .update({ status: "terisi" })
          .eq("id", values.room_id);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("tenants")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      roomId,
    }: {
      id: string;
      roomId: string;
    }) => {
      const { error } = await supabase
        .from("tenants")
        .update({ status: "ended" })
        .eq("id", id);
      if (error) throw error;
      await supabase
        .from("rooms")
        .update({ status: "tersedia" })
        .eq("id", roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
