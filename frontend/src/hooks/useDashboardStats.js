import { useAsyncData } from "./useAsyncData.js";
import { fetchDashboardStats } from "../services/dashboardService.js";

export function useDashboardStats() {
  const { data: stats, loading, error, refetch } = useAsyncData(
    (signal) => fetchDashboardStats(signal),
    []
  );

  return { stats, loading, error, refetch };
}