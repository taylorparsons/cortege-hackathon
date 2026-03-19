import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

/**
 * Fetches activity + memory for a selected companion.
 * Only fetches when companionId changes (detail panel opened).
 */
export function useCompanionDetail(companionId) {
  const [activity, setActivity] = useState([]);
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companionId) {
      setActivity([]);
      setMemory(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/api/companions/${companionId}/activity?limit=20`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch(`${API_BASE}/api/companions/${companionId}/memory`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([actData, memData]) => {
      if (!cancelled) {
        setActivity(Array.isArray(actData) ? actData : []);
        setMemory(memData);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [companionId]);

  return { activity, memory, loading };
}
