import api from "./api.js";

/**
 * Dedicated service for the dashboard's data source. Kept separate from the
 * generic axios instance in api.js so the Dashboard page/hook never needs
 * to know the endpoint path directly.
 */
export async function fetchDashboardStats(signal) {
  const response = await api.get("/api/dashboard", { signal });
  return response.data;
}