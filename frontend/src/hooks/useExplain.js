import { useCallback, useState } from "react";
import { explainTransaction } from "../services/explainabilityService.js";

export function useExplain() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const explain = useCallback(async (transaction) => {
    setLoading(true);
    setError(null);
    try {
      const data = await explainTransaction(transaction);
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

  return { result, loading, error, explain, reset };
}