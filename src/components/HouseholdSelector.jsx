import { useEffect, useState } from 'react';
import { useHouseholds } from '../hooks/useHouseholds.js';
import { LocationManager } from './LocationManager.jsx';
import { MemberManager } from './MemberManager.jsx';

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 16,
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--bg3)',
};

const inputStyle = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border2)',
  background: 'var(--bg4)',
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  fontSize: 12,
  outline: 'none',
};

export function HouseholdSelector({ currentHouseholdId, onSelect }) {
  const {
    households,
    locations,
    loading,
    error,
    createHousehold,
    deleteHousehold,
    getLocation,
    updateLocation,
    deleteLocation,
    updateHousehold,
  } = useHouseholds();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [createError, setCreateError] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [reassignError, setReassignError] = useState('');
  const [editHouseholdName, setEditHouseholdName] = useState('');
  const [editHouseholdError, setEditHouseholdError] = useState('');
  const [householdSaved, setHouseholdSaved] = useState(false);

  const currentHousehold = households.find((household) => household.household_id === currentHouseholdId) ?? null;

  useEffect(() => {
    setSelectedLocationId(currentHousehold?.location_id ?? '');
    setReassignError('');
    setEditHouseholdName(currentHousehold?.name ?? '');
    setEditHouseholdError('');
    setHouseholdSaved(false);
  }, [currentHousehold?.location_id, currentHousehold?.name]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const household = await createHousehold(newName, {
        name: locationName,
        address: {
          line1,
          line2: line2 || null,
          city,
          region,
          postal_code: postalCode,
          country,
        },
      });
      setNewName('');
      setLocationName('');
      setLine1('');
      setLine2('');
      setCity('');
      setRegion('');
      setPostalCode('');
      setCountry('');
      setShowCreateForm(false);
      onSelect(household.household_id);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleHouseholdReassign = async () => {
    if (!currentHouseholdId || !selectedLocationId || selectedLocationId === currentHousehold?.location_id) {
      return;
    }

    setReassignError('');
    try {
      await updateHousehold(currentHouseholdId, { location_id: selectedLocationId });
    } catch (err) {
      setReassignError(err.message);
    }
  };

  const handleHouseholdSave = async (event) => {
    event.preventDefault();
    if (!currentHouseholdId) return;

    const trimmedName = editHouseholdName.trim();
    if (!trimmedName || trimmedName === currentHousehold?.name) {
      return;
    }

    setEditHouseholdError('');
    setHouseholdSaved(false);
    try {
      await updateHousehold(currentHouseholdId, { name: trimmedName });
      setHouseholdSaved(true);
    } catch (err) {
      setEditHouseholdError(err.message);
    }
  };

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>Loading households...</div>;
  if (error) return <div style={{ color: '#DC503C', fontSize: 13, padding: 20, textAlign: 'center' }}>Error: {error}</div>;

  return (
    <div data-testid="household-selector" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: 'var(--cream)', margin: 0 }}>Households</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="btn-new-household"
          style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(78,205,196,0.3)',
            background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: 1,
          }}
        >
          {showCreateForm ? 'CANCEL' : '+ NEW'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} data-testid="form-create-household" style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {createError && (
            <div style={{ color: '#DC503C', fontSize: 12 }}>{createError}</div>
          )}
          <input
            type="text"
            placeholder="Household name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            data-testid="input-household-name"
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Location name"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            data-testid="input-household-location"
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Address line 1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            data-testid="input-household-address-line1"
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Address line 2 (optional)"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            data-testid="input-household-address-line2"
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            data-testid="input-household-city"
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="State / Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            data-testid="input-household-region"
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Postal code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            data-testid="input-household-postal-code"
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            data-testid="input-household-country"
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <button type="submit" data-testid="btn-create-household" style={{
            padding: '10px 0', borderRadius: 10, border: '1px solid rgba(78,205,196,0.3)',
            background: 'rgba(78,205,196,0.12)', color: 'var(--teal)', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500, letterSpacing: 1,
          }}>
            CREATE HOUSEHOLD
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {households.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
            No households yet. Create one to get started.
          </div>
        )}
        {households.map(household => (
          <div
            key={household.household_id}
            data-testid={`household-row-${household.household_id}`}
            onClick={() => onSelect(household.household_id)}
            style={{
              padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
              background: household.household_id === currentHouseholdId ? 'rgba(78,205,196,0.08)' : 'var(--bg3)',
              border: `1px solid ${household.household_id === currentHouseholdId ? 'rgba(78,205,196,0.3)' : 'var(--border)'}`,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--cream)' }}>
                {household.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {(household.location_name ?? household.address_summary ?? household.location ?? 'No location')} &middot; {household.member_count} members
              </div>
            </div>
            {household.household_id !== currentHouseholdId && (
              <button
                data-testid={`btn-delete-household-${household.household_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${household.name}?`)) {
                    deleteHousehold(household.household_id);
                  }
                }}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {currentHouseholdId && (
        <>
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <div data-testid="household-details-editor" style={panelStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: 'var(--cream)' }}>
                Edit Household
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>
                Update the selected household name here, then manage its location and members below.
              </div>
            </div>

            <form onSubmit={handleHouseholdSave} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--muted)', fontSize: 11, letterSpacing: 1 }}>
                HOUSEHOLD NAME
                <input
                  data-testid="input-edit-household-name"
                  type="text"
                  value={editHouseholdName}
                  onChange={(event) => setEditHouseholdName(event.target.value)}
                  style={inputStyle}
                />
              </label>
              <button
                data-testid="btn-save-household"
                type="submit"
                disabled={!editHouseholdName.trim() || editHouseholdName.trim() === currentHousehold?.name}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(78,205,196,0.3)',
                  background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: 0.5,
                  opacity: !editHouseholdName.trim() || editHouseholdName.trim() === currentHousehold?.name ? 0.6 : 1,
                }}
              >
                Save Household
              </button>
              {editHouseholdError && (
                <div data-testid="household-details-error" style={{ color: '#DC503C', fontSize: 12 }}>
                  {editHouseholdError}
                </div>
              )}
              {householdSaved && !editHouseholdError && (
                <div data-testid="household-details-success" style={{ color: 'var(--teal)', fontSize: 12 }}>
                  Household updated.
                </div>
              )}
            </form>

            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--cream)' }}>
                Household Location
              </div>
              <select
                data-testid="select-household-location"
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(event.target.value)}
                style={inputStyle}
              >
                {locations.map((location) => (
                  <option key={location.location_id} value={location.location_id}>
                    {location.name} ({location.address_summary ?? 'No summary'})
                  </option>
                ))}
              </select>
              <button
                data-testid="btn-update-household-location"
                onClick={handleHouseholdReassign}
                disabled={!selectedLocationId || selectedLocationId === currentHousehold?.location_id}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(78,205,196,0.3)',
                  background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: 0.5,
                  opacity: !selectedLocationId || selectedLocationId === currentHousehold?.location_id ? 0.6 : 1,
                }}
              >
                Update Location
              </button>
              {reassignError && (
                <div data-testid="household-location-error" style={{ color: '#DC503C', fontSize: 12 }}>
                  {reassignError}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <MemberManager householdId={currentHouseholdId} />
          </div>
        </>
      )}

      <LocationManager
        locations={locations}
        households={households}
        getLocation={getLocation}
        updateLocation={updateLocation}
        deleteLocation={deleteLocation}
      />
    </div>
  );
}
