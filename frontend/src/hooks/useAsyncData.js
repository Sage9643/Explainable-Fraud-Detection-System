import { useCallback, useEffect, useState } from "react";

/**
 * Generic fetch-on-mount hook shared by useDashboardStats, useAnalytics, and
 * useHistory. Extracted because all three previously hand-rolled the exact
 * same loading/error/data state machine - this is the single place that
 * pattern lives now.
 *
 * fetchFn is intentionally NOT part of the dependency array: callers pass a
 * fresh closure on every render, and re-running the effect only when `deps`
 * changes (plus an explicit refetch()) is the desired behavior, not a bug.
 *
 * An AbortController is created per effect run and its signal is passed to
 * fetchFn. This matters specifically because React 18 StrictMode (see
 * main.jsx) intentionally mounts every component twice in development -
 * without cancellation, the first, throwaway mount's request would still
 * complete as a real, wasted network call, doubling request volume on every
 * page load and occasionally exhausting the browser's per-origin connection
 * limit (surfacing as a client-side "Network Error" even though the
 * *other* duplicate request succeeds and shows 200 in the server logs).
 */
export function useAsyncData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn(controller.signal);
        if (!cancelled) setData(result);
      } catch (err) {
        // A request this effect itself aborted (StrictMode's discarded
        // first mount, or deps changing before the previous request
        // finished) is expected and must never be surfaced as a real
        // error. Checked via the controller's own signal rather than
        // inspecting err.name/err.code, since api.js's interceptor
        // rewraps every rejection into a plain Error and does not
        // preserve axios's cancellation metadata.
        if (controller.signal.aborted) {
          return;
        }
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, loading, error, refetch };
}