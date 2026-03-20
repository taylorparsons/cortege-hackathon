import { useState } from 'react';

const inputStyle = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border2)',
  background: 'var(--bg4)',
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  fontSize: 12,
  outline: 'none',
  width: '100%',
};

const btnStyle = {
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid var(--border2)',
  background: 'var(--bg3)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: 0.5,
};

export function LocationManager({
  locations,
  households,
  getLocation,
  updateLocation,
  deleteLocation,
}) {
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
  });

  const usageCount = (locationId) => households.filter(
    (household) => household.location_id === locationId
  ).length;

  const startEdit = async (location) => {
    setError('');
    const fullLocation = await getLocation(location.location_id);
    setEditingId(location.location_id);
    setForm({
      name: fullLocation.name ?? '',
      line1: fullLocation.address?.line1 ?? '',
      line2: fullLocation.address?.line2 ?? '',
      city: fullLocation.address?.city ?? '',
      region: fullLocation.address?.region ?? '',
      postalCode: fullLocation.address?.postal_code ?? '',
      country: fullLocation.address?.country ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setSaving(true);
    setError('');
    try {
      await updateLocation(editingId, {
        name: form.name,
        address: {
          line1: form.line1,
          line2: form.line2 || null,
          city: form.city,
          region: form.region,
          postal_code: form.postalCode,
          country: form.country,
        },
      });
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location) => {
    setError('');
    if (!confirm(`Delete location "${location.name}"?`)) {
      return;
    }

    try {
      await deleteLocation(location.location_id);
    } catch (err) {
      if (err.status === 409 && Array.isArray(err.payload?.households)) {
        const names = err.payload.households.map((household) => household.name).join(', ');
        setError(`Reassign households before deleting: ${names}`);
        return;
      }
      setError(err.message);
    }
  };

  return (
    <div
      data-testid="location-manager"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        borderTop: '1px solid var(--border)',
        paddingTop: 14,
      }}
    >
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--cream)' }}>
        Saved Locations
      </div>

      {error && (
        <div data-testid="location-manager-error" style={{ color: '#DC503C', fontSize: 12 }}>
          {error}
        </div>
      )}

      {locations.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>No saved locations yet.</div>
      ) : (
        locations.map((location) => (
          <div
            key={location.location_id}
            data-testid={`location-row-${location.location_id}`}
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {editingId === location.location_id ? (
              <>
                <input
                  data-testid="input-location-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Location name"
                  style={inputStyle}
                />
                <input
                  data-testid="input-location-address-line1"
                  value={form.line1}
                  onChange={(event) => setForm((current) => ({ ...current, line1: event.target.value }))}
                  placeholder="Address line 1"
                  style={inputStyle}
                />
                <input
                  data-testid="input-location-address-line2"
                  value={form.line2}
                  onChange={(event) => setForm((current) => ({ ...current, line2: event.target.value }))}
                  placeholder="Address line 2"
                  style={inputStyle}
                />
                <input
                  data-testid="input-location-city"
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="City"
                  style={inputStyle}
                />
                <input
                  data-testid="input-location-region"
                  value={form.region}
                  onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                  placeholder="State / Region"
                  style={inputStyle}
                />
                <input
                  data-testid="input-location-postal-code"
                  value={form.postalCode}
                  onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
                  placeholder="Postal code"
                  style={inputStyle}
                />
                <input
                  data-testid="input-location-country"
                  value={form.country}
                  onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                  placeholder="Country"
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    data-testid="btn-save-location"
                    onClick={saveEdit}
                    disabled={saving}
                    style={{
                      ...btnStyle,
                      flex: 1,
                      border: '1px solid rgba(78,205,196,0.3)',
                      background: 'rgba(78,205,196,0.12)',
                      color: 'var(--teal)',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ ...btnStyle, flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--cream)' }}>
                      {location.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {location.address_summary ?? 'No address summary'} &middot; {usageCount(location.location_id)} household(s)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      data-testid={`btn-edit-location-${location.location_id}`}
                      onClick={() => startEdit(location)}
                      style={btnStyle}
                    >
                      Edit
                    </button>
                    <button
                      data-testid={`btn-delete-location-${location.location_id}`}
                      onClick={() => handleDelete(location)}
                      style={btnStyle}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
