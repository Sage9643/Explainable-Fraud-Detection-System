import api from "./api.js";

/**
 * Dedicated service for prediction history. Mirrors dashboardService.js -
 * keeps the endpoint path and query-param shape out of the hook/page.
 */
export async function fetchHistory({ page = 1, pageSize = 20, riskBand = null, search = null } = {}) {
  const params = { page, page_size: pageSize };
  if (riskBand) params.risk_band = riskBand;
  if (search) params.search = search;

  const response = await api.get("/api/history", { params });
  return response.data;
}