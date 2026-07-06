import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useTransactions(filters?: {
  dateStart?: string;
  dateEnd?: string;
  category?: string;
  type?: string;
}) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";

  return useQuery({
    queryKey: ["transactions", { superAdmin: isSuperAdmin }, filters],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (!isSuperAdmin && profile?.propertyId) {
        query = query.eq("property_id", profile.propertyId);
      }

      if (filters?.dateStart)
        query = query.gte("transaction_date", filters.dateStart);
      if (filters?.dateEnd)
        query = query.lte("transaction_date", filters.dateEnd);
      if (filters?.category)
        query = query.eq("category", filters.category);
      if (filters?.type) query = query.eq("type", filters.type);

      const { data } = await query;
      return data || [];
    },
    enabled: !!profile?.propertyId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (
      values: Record<string, unknown>
    ) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...values, property_id: profile?.propertyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useTransactionBreakdown(dateStart?: string, dateEnd?: string) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  return useQuery({
    queryKey: ["transaction-breakdown", { superAdmin: isSuperAdmin }, dateStart, dateEnd],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*");

      if (!isSuperAdmin && profile?.propertyId) {
        query = query.eq("property_id", profile.propertyId);
      }

      if (dateStart) query = query.gte("transaction_date", dateStart);
      if (dateEnd) query = query.lte("transaction_date", dateEnd);

      const { data } = await query;
      const rows = data || [];

      const income = rows
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);
      const expense = rows
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

      const byCategory: Record<string, number> = {};
      rows.forEach((r) => {
        const key = `${r.type}_${r.category}`;
        byCategory[key] = (byCategory[key] || 0) + r.amount;
      });

      return { income, expense, net: income - expense, byCategory, rows };
    },
    enabled: !!profile?.propertyId,
  });
}
