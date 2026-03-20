import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../lib/backend-url.js';

export function useHouseholds() {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHouseholds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/households'));
      if (!response.ok) throw new Error('Failed to fetch households');
      const data = await response.json();
      setHouseholds(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHousehold = async (name, location) => {
    const response = await fetch(apiUrl('/api/households'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location })
    });
    if (!response.ok) throw new Error('Failed to create household');
    const household = await response.json();
    setHouseholds(prev => [...prev, household]);
    return household;
  };

  const deleteHousehold = async (householdId) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}`), {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete household');
    setHouseholds(prev => prev.filter(h => h.household_id !== householdId));
  };

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  return {
    households,
    loading,
    error,
    createHousehold,
    deleteHousehold,
    refresh: fetchHouseholds
  };
}
