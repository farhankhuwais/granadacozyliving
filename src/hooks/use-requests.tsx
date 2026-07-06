import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useRequests(filters?: {
  status?: string;
  type?: string;
}) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";

  return useQuery({
    queryKey: ["requests", { superAdmin: isSuperAdmin }, filters],
    queryFn: async () => {
      let query = supabase
        .from("requests")
        .select("*, rooms(room_number), creator:profiles!created_by(full_name), approver:profiles!approved_by(full_name)")
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && profile?.propertyId) {
        query = query.eq("property_id", profile.propertyId);
      }

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.type) query = query.eq("type", filters.type);

      const { data } = await query;
      return data || [];
    },
    enabled: true,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("requests")
        .insert({
          ...values,
          property_id: profile?.propertyId,
          created_by: profile?.id,
          status: "menunggu",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      approvedBy,
    }: {
      id: string;
      status: "menunggu" | "diizinkan" | "ditolak" | "proses" | "selesai";
      approvedBy?: string;
    }) => {
      const updates: Record<string, string> = { status };
      if (approvedBy) updates.approved_by = approvedBy;
      const { error } = await supabase
        .from("requests")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
