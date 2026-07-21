import { useEffect, useState } from "react";
import { useAsyncData } from "./useAsyncData.js";
import { fetchHistory } from "../services/historyService.js";

const PAGE_SIZE = 20;

export function useHistory({ riskBand, search }) {
  const [page, setPage] = useState(1);

  // Filter/search changes reset pagination back to page 1.
  useEffect(() => {
    setPage(1);
  }, [riskBand, search]);

  const { data, loading, error, refetch } = useAsyncData(
    (signal) => fetchHistory({ page, pageSize: PAGE_SIZE, riskBand, search }, signal),
    [page, riskBand, search]
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return { data, loading, error, page, setPage, totalPages, pageSize: PAGE_SIZE, refetch };
}