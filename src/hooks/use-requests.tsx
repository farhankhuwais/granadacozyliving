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
        .select("*, rooms(room_number), request_photos(*), creator:profiles!created_by(full_name), approver:profiles!approved_by(full_name)")
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
      // Resolve property_id for super admin
      let propertyId = profile?.propertyId;
      if (!propertyId && profile?.role === "super_admin") {
        const { data: firstProp } = await supabase
          .from("properties")
          .select("id")
          .limit(1)
          .single();
        propertyId = firstProp?.id || null;
      }
      if (!propertyId) throw new Error("No property found");

      const { data, error } = await supabase
        .from("requests")
        .insert({
          ...values,
          property_id: propertyId,
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

      // Auto-create expense transaction when request is completed
      if (status === "selesai") {
        const { data: req } = await supabase
          .from("requests")
          .select("title, estimated_cost, property_id, room_id, created_by")
          .eq("id", id)
          .single();
        if (req?.estimated_cost && req?.property_id) {
          const { error: txErr } = await supabase
            .from("transactions")
            .insert({
              property_id: req.property_id,
              room_id: req.room_id || null,
              type: "expense",
              category: "maintenance",
              amount: req.estimated_cost,
              description: `Maintenance: ${req.title}`,
              transaction_date: new Date().toISOString().split("T")[0],
              created_by: req.created_by || approvedBy || null,
            });
          if (txErr) console.error("[Auto expense] failed:", txErr);
          else console.log("[Auto expense] created:", req.estimated_cost);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteAllRequests() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async () => {
      let query = supabase.from("requests").delete();
      if (profile?.role !== "super_admin" && profile?.propertyId) {
        query = query.eq("property_id", profile.propertyId);
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
