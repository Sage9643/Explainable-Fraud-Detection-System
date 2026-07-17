import { useCallback, useState } from "react";
import { uploadBatch } from "../services/batchService.js";

export function useBatchPredict() {
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file) => {
    setStatus("uploading");
    setError(null);
    try {
      const data = await uploadBatch(file);
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, upload, reset };
}