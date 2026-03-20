import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../lib/backend-url.js';

async function readApiError(response, fallbackMessage) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const error = new Error(payload?.error ?? fallbackMessage);
  error.status = response.status;
  error.payload = payload;
  throw error;
}

export function useHouseholds() {
  const [households, setHouseholds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHouseholds = useCallback(async () => {
    try {
      setLoading(true);
      const [householdRes, locationRes] = await Promise.all([
        fetch(apiUrl('/api/households')),
        fetch(apiUrl('/api/locations')),
      ]);
      if (!householdRes.ok) throw new Error('Failed to fetch households');
      const householdData = await householdRes.json();
      setHouseholds(householdData);
      if (locationRes.ok) {
        const locationData = await locationRes.json();
        setLocations(locationData);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLocation = async ({ name, address }) => {
    const response = await fetch(apiUrl('/api/locations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address })
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to create location');
    }
    const location = await response.json();
    setLocations(prev => [...prev, location]);
    return location;
  };

  const getLocation = async (locationId) => {
    const response = await fetch(apiUrl(`/api/locations/${locationId}`));
    if (!response.ok) {
      await readApiError(response, 'Failed to fetch location');
    }
    return response.json();
  };

  const updateLocation = async (locationId, updates) => {
    const response = await fetch(apiUrl(`/api/locations/${locationId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to update location');
    }
    const location = await response.json();
    setLocations(prev => prev.map(item => (
      item.location_id === locationId ? { ...item, ...location } : item
    )));
    setHouseholds(prev => prev.map((household) => (
      household.location_id === locationId
        ? {
            ...household,
            location_name: location.name,
            address_summary: location.address_summary,
            location_details: location,
          }
        : household
    )));
    return location;
  };

  const deleteLocation = async (locationId) => {
    const response = await fetch(apiUrl(`/api/locations/${locationId}`), {
      method: 'DELETE',
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to delete location');
    }
    const result = await response.json();
    setLocations(prev => prev.filter(item => item.location_id !== locationId));
    return result;
  };

  const createHousehold = async (name, locationInput) => {
    let locationId = locationInput?.location_id ?? null;
    if (!locationId) {
      const location = await createLocation(locationInput);
      locationId = location.location_id;
    }

    const response = await fetch(apiUrl('/api/households'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location_id: locationId })
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to create household');
    }
    const household = await response.json();
    setHouseholds(prev => [...prev, household]);
    return household;
  };

  const updateHousehold = async (householdId, updates) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to update household');
    }
    const household = await response.json();
    setHouseholds(prev => prev.map(item => (
      item.household_id === householdId ? household : item
    )));
    return household;
  };

  const deleteHousehold = async (householdId) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}`), {
      method: 'DELETE'
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to delete household');
    }
    setHouseholds(prev => prev.filter(h => h.household_id !== householdId));
  };

  const getHousehold = async (householdId) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}`));
    if (!response.ok) throw new Error('Failed to fetch household');
    return response.json();
  };

  const addMember = async (householdId, memberData) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}/members`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to add member');
    }
    return response.json();
  };

  const updateMember = async (householdId, memberId, updates) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}/members/${memberId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to update member');
    }
    return response.json();
  };

  const removeMember = async (householdId, memberId) => {
    const response = await fetch(apiUrl(`/api/households/${householdId}/members/${memberId}`), {
      method: 'DELETE'
    });
    if (!response.ok) {
      await readApiError(response, 'Failed to remove member');
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  return {
    households,
    locations,
    loading,
    error,
    createHousehold,
    createLocation,
    getLocation,
    updateLocation,
    deleteLocation,
    updateHousehold,
    deleteHousehold,
    getHousehold,
    addMember,
    updateMember,
    removeMember,
    refresh: fetchHouseholds
  };
}
