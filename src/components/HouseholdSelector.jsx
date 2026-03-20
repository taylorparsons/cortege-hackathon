import { useState } from 'react';
import { useHouseholds } from '../hooks/useHouseholds.js';

export function HouseholdSelector({ currentHouseholdId, onSelect }) {
  const { households, loading, error, createHousehold, deleteHousehold } = useHouseholds();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const household = await createHousehold(newName, newLocation);
      setNewName('');
      setNewLocation('');
      setShowCreateForm(false);
      onSelect(household.household_id);
    } catch (err) {
      console.error('Failed to create household:', err);
    }
  };

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>Loading households...</div>;
  if (error) return <div style={{ color: '#DC503C', fontSize: 13, padding: 20, textAlign: 'center' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: 'var(--cream)', margin: 0 }}>Households</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
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
        <form onSubmit={handleCreate} style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input
            type="text"
            placeholder="Household name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13,
              outline: 'none',
            }}
          />
          <button type="submit" style={{
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
                {household.location} &middot; {household.member_count} members
              </div>
            </div>
            {household.household_id !== currentHouseholdId && (
              <button
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
    </div>
  );
}
