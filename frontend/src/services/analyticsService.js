import api from "./api.js";

/**
 * Dedicated service for model analytics. Mirrors dashboardService.js,
 * historyService.js, and batchService.js - keeps the endpoint path out of
 * the hook/page. GET /api/analytics takes no parameters: it's a single
 * static snapshot of the frozen model, not a filterable/paginated resource.
 */
export async function fetchAnalytics() {
  const response = await api.get("/api/analytics");
  return response.data;
}