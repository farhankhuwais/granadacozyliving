import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useAuditLogs() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      if (profile?.role !== "super_admin") return [];

      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      return data || [];
    },
    enabled: profile?.role === "super_admin",
  });
}

export function useInsertAuditLog() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (values: {
      action: string;
      target_type?: string;
      target_id?: string;
      target_label?: string;
      details?: string;
    }) => {
      if (!profile?.id) return;

      const { error } = await supabase.from("audit_logs").insert({
        user_id: profile.id,
        user_email: profile.email,
        user_role: profile.role,
        action: values.action,
        target_type: values.target_type,
        target_id: values.target_id,
        target_label: values.target_label,
        details: values.details,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    },
  });
}
