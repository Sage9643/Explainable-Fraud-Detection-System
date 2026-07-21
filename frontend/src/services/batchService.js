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

/**
 * Fetches the scored CSV as a blob and triggers a browser save, instead of
 * a plain <a href> navigation. Same GET /api/batch/{id}/download endpoint -
 * the only thing that changes is how the frontend consumes the response -
 * which lets the caller know definitively whether the export succeeded or
 * failed (a plain link click gives no such signal), so a real success/error
 * toast can be shown.
 */
export async function downloadBatchResults(batchId) {
  const response = await api.get(`/api/batch/${batchId}/download`, { responseType: "blob" });

  const disposition = response.headers["content-disposition"] || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : `FraudLens_Batch_${batchId}.csv`;

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);

  return filename;
}