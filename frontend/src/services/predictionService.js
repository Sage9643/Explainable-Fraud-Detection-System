import api from "./api.js";

/**
 * Dedicated service for single-transaction prediction. Mirrors
 * dashboardService.js / historyService.js / batchService.js / analyticsService.js.
 */
export async function predictTransaction(transaction) {
  const response = await api.post("/api/predict", transaction);
  return response.data;
}