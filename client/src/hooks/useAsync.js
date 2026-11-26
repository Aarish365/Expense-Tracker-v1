import { useCallback, useEffect, useState } from 'react';

/*
 * Small helper for "load data, show loading/error, reload when needed".
 * fn: an async function that returns the API response.
 * deps: values that should trigger a fresh request when they change.
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Could not load data');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
