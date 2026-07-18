import api from "./api.js";

/**
 * Dedicated service for SHAP explainability. Mirrors predictionService.js
 * and every other feature-scoped service in this project.
 */
export async function explainTransaction(transaction) {
  const response = await api.post("/api/explain", transaction);
  return response.data;
}