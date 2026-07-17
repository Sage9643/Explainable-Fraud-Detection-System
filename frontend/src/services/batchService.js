import api from "./api.js";

/**
 * Dedicated service for batch prediction. Mirrors historyService.js and
 * dashboardService.js - keeps endpoint paths and request shaping out of the
 * hook/page.
 */
export async function uploadBatch(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Backend scoring itself is now vectorized (a few seconds even for the
  // full ~285k-row Kaggle dataset - see batch_service.py). This timeout is
  // sized for the upload transfer of a ~150MB file over a slow connection,
  // not for backend processing time, which is why it's generous rather than
  // a fix for the processing speed itself.
  const response = await api.post("/api/batch/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600000,
  });
  return response.data;
}

export function getBatchDownloadUrl(batchId) {
  const baseURL = api.defaults.baseURL;
  return `${baseURL}/api/batch/${batchId}/download`;
}