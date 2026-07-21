import { useAsyncData } from "./useAsyncData.js";
import { fetchAnalytics } from "../services/analyticsService.js";

export function useAnalytics() {
  const { data, loading, error, refetch } = useAsyncData(
    (signal) => fetchAnalytics(signal),
    []
  );

  return { data, loading, error, refetch };
}