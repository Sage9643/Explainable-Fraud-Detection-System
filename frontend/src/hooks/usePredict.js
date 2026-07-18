import { useCallback, useState } from "react";
import { predictTransaction } from "../services/predictionService.js";

export function usePredict() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (transaction) => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictTransaction(transaction);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, predict, reset };
}