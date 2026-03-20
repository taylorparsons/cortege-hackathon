import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/backend-url.js';
import { useHouseholdContext } from '../context/HouseholdContext.jsx';

/**
 * Fetches activity for a selected companion.
 * Only fetches when companionId changes (detail panel opened).
 * Memory is handled separately by MemoryViewer component.
 */
export function useCompanionDetail(companionId) {
  const { currentHouseholdId } = useHouseholdContext();
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companionId) {
      setActivity([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const query = currentHouseholdId
      ? `?limit=20&household_id=${encodeURIComponent(currentHouseholdId)}`
      : '?limit=20';

    fetch(apiUrl(`/api/companions/${companionId}/activity${query}`))
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(actData => {
        if (!cancelled) {
          setActivity(Array.isArray(actData) ? actData : []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [companionId, currentHouseholdId]);

  return { activity, loading };
}
