import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/backend-url.js';

/**
 * Fetches activity for a selected companion.
 * Only fetches when companionId changes (detail panel opened).
 * Memory is handled separately by MemoryViewer component.
 */
export function useCompanionDetail(companionId) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companionId) {
      setActivity([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(apiUrl(`/api/companions/${companionId}/activity?limit=20`))
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(actData => {
        if (!cancelled) {
          setActivity(Array.isArray(actData) ? actData : []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [companionId]);

  return { activity, loading };
}
