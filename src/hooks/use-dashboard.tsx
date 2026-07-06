import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useDashboard() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";

  return useQuery({
    queryKey: ["dashboard", { superAdmin: isSuperAdmin }],
    queryFn: async () => {
      // Super admin: get all rooms
      let roomsQuery = supabase.from("rooms").select("id, status, type");
      if (!isSuperAdmin && profile?.propertyId) {
        roomsQuery = roomsQuery.eq("property_id", profile.propertyId);
      }
      const { data: rooms } = await roomsQuery;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter((r) => r.status === "terisi").length || 0;
      const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Super admin: get all income transactions
      let incomeQuery = supabase
        .from("transactions")
        .select("amount, category")
        .eq("type", "income");
      if (!isSuperAdmin && profile?.propertyId) {
        incomeQuery = incomeQuery.eq("property_id", profile?.propertyId);
      }
      const { data: incomeTx } = await incomeQuery;

      const totalIncome = incomeTx?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const monthlyRent = incomeTx?.filter((r) => r.category === "monthly_rent").reduce((sum, r) => sum + r.amount, 0) || 0;
      const dailyRent = incomeTx?.filter((r) => r.category === "daily_rent").reduce((sum, r) => sum + r.amount, 0) || 0;

      // Super admin: get all expense transactions
      let expenseQuery = supabase
        .from("transactions")
        .select("amount, category")
        .eq("type", "expense");
      if (!isSuperAdmin && profile?.propertyId) {
        expenseQuery = expenseQuery.eq("property_id", profile?.propertyId);
      }
      const { data: expenseTx } = await expenseQuery;

      const totalExpense = expenseTx?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const ipl = expenseTx?.filter((r) => r.category === "property_tax").reduce((sum, r) => sum + r.amount, 0) || 0;
      const managementFee = expenseTx?.filter((r) => r.category === "management_fees").reduce((sum, r) => sum + r.amount, 0) || 0;
      const maintenanceCost = expenseTx?.filter((r) => r.category === "maintenance").reduce((sum, r) => sum + r.amount, 0) || 0;

      // Super admin: get all active requests
      let requestsQuery = supabase
        .from("requests")
        .select("id")
        .in("status", ["menunggu", "proses"]);
      if (!isSuperAdmin && profile?.propertyId) {
        requestsQuery = requestsQuery.eq("property_id", profile?.propertyId);
      }
      const { data: activeRequests } = await requestsQuery;

      return {
        totalRooms, occupiedRooms, occupancyRate,
        totalIncome, totalExpense, netProfit: totalIncome - totalExpense,
        monthlyRent, dailyRent,
        ipl, managementFee, maintenanceCost,
        activeRequestCount: activeRequests?.length || 0,
      };
    },
    enabled: true,
    refetchInterval: 30000,
  });
}
