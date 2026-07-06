import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useDashboard() {
  const { profile } = useAuth();
  const propertyId = profile?.propertyId;

  return useQuery({
    queryKey: ["dashboard", propertyId],
    queryFn: async () => {
      // Rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, status, type")
        .eq("property_id", propertyId);

      const totalRooms = rooms?.length || 0;
      const occupiedRooms =
        rooms?.filter((r) => r.status === "terisi").length || 0;
      const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Income
      const { data: incomeTx } = await supabase
        .from("transactions")
        .select("amount, category")
        .eq("property_id", propertyId)
        .eq("type", "income");

      const totalIncome =
        incomeTx?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const monthlyRent =
        incomeTx
          ?.filter((r) => r.category === "monthly_rent")
          .reduce((sum, r) => sum + r.amount, 0) || 0;
      const dailyRent =
        incomeTx
          ?.filter((r) => r.category === "daily_rent")
          .reduce((sum, r) => sum + r.amount, 0) || 0;

      // Expense
      const { data: expenseTx } = await supabase
        .from("transactions")
        .select("amount, category")
        .eq("property_id", propertyId)
        .eq("type", "expense");

      const totalExpense =
        expenseTx?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const ipl =
        expenseTx
          ?.filter((r) => r.category === "property_tax")
          .reduce((sum, r) => sum + r.amount, 0) || 0;
      const managementFee =
        expenseTx
          ?.filter((r) => r.category === "management_fees")
          .reduce((sum, r) => sum + r.amount, 0) || 0;
      const maintenanceCost =
        expenseTx
          ?.filter((r) => r.category === "maintenance")
          .reduce((sum, r) => sum + r.amount, 0) || 0;

      // Active requests
      const { data: activeRequests } = await supabase
        .from("requests")
        .select("id")
        .eq("property_id", propertyId)
        .in("status", ["menunggu", "proses"]);

      return {
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        monthlyRent,
        dailyRent,
        ipl,
        managementFee,
        maintenanceCost,
        activeRequestCount: activeRequests?.length || 0,
      };
    },
    enabled: !!propertyId,
    refetchInterval: 30000,
  });
}
