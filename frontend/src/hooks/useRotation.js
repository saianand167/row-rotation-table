import { useState, useEffect, useCallback } from 'react';
import { fetchRotation } from '../utils/api';

const POLL_INTERVAL = 60000; // 60 seconds

export function useRotation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchRotation();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rotation:', err);
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return { data, loading, error, refetch: load };
}
