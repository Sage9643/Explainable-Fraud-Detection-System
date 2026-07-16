import { useEffect, useState } from "react";
import { fetchHistory } from "../services/historyService.js";

const PAGE_SIZE = 20;

export function useHistory({ riskBand, search }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter/search changes reset pagination back to page 1.
  useEffect(() => {
    setPage(1);
  }, [riskBand, search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchHistory({ page, pageSize: PAGE_SIZE, riskBand, search });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, riskBand, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return { data, loading, error, page, setPage, totalPages, pageSize: PAGE_SIZE };
}