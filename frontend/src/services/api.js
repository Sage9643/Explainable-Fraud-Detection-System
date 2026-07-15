import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized shape normalization: backend errors always come back as
    // { error, detail, request_id } (see utils/error_handlers.py), so every
    // hook can rely on this without re-parsing per call site.
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(new Error(detail));
  }
);

export default api;
