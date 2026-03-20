import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../lib/backend-url.js';
import { useHouseholdContext } from '../context/HouseholdContext.jsx';

const COMPANION_MAP = { child: 'scout', senior: 'anchor', adult: 'sentinel' };
const PROFILE_TYPES = ['child', 'senior', 'adult'];

const PROFILE_COLORS = {
  child: { bg: 'rgba(78,205,196,0.12)', color: '#4ECDC4', border: 'rgba(78,205,196,0.3)' },
  senior: { bg: 'rgba(232,168,56,0.12)', color: '#E8A838', border: 'rgba(232,168,56,0.3)' },
  adult: { bg: 'rgba(123,158,201,0.12)', color: '#7B9EC9', border: 'rgba(123,158,201,0.3)' },
};

function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatPhone(phone) {
  if (!phone) return '';
  if (phone.length === 12 && phone.startsWith('+1')) {
    return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
  }
  return phone;
}

const inputStyle = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)',
  background: 'var(--bg4)', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 12,
  outline: 'none', width: '100%',
};

const btnStyle = {
  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border2)',
  background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer',
  fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500, letterSpacing: 0.5,
};

export function MemberManager({ householdId }) {
  const { bumpMemberVersion } = useHouseholdContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newProfileType, setNewProfileType] = useState('adult');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editProfileType, setEditProfileType] = useState('adult');

  const fetchMembers = useCallback(async () => {
    if (!householdId) return;
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/api/households/${householdId}`));
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await fetch(apiUrl(`/api/households/${householdId}/members`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone || undefined,
          date_of_birth: newDob || undefined,
          profile_type: newProfileType,
          companion: COMPANION_MAP[newProfileType],
        }),
      });
      setNewName(''); setNewPhone(''); setNewDob(''); setNewProfileType('adult');
      setShowAddForm(false);
      await fetchMembers();
      bumpMemberVersion();
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleEdit = async (memberId) => {
    try {
      await fetch(apiUrl(`/api/households/${householdId}/members/${memberId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone || undefined,
          date_of_birth: editDob || undefined,
          profile_type: editProfileType,
          companion: COMPANION_MAP[editProfileType],
        }),
      });
      setEditingId(null);
      await fetchMembers();
      bumpMemberVersion();
    } catch (err) {
      console.error('Failed to update member:', err);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this household?`)) return;
    try {
      await fetch(apiUrl(`/api/households/${householdId}/members/${memberId}`), {
        method: 'DELETE',
      });
      await fetchMembers();
      bumpMemberVersion();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditPhone(member.phone ?? '');
    setEditDob(member.date_of_birth ?? '');
    setEditProfileType(member.profile_type ?? 'adult');
  };

  if (!householdId) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--cream)' }}>
          Members
        </div>
        <button
          data-testid="btn-add-member"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            ...btnStyle,
            border: '1px solid rgba(78,205,196,0.3)',
            background: 'rgba(78,205,196,0.08)',
            color: 'var(--teal)',
            letterSpacing: 1,
          }}
        >
          {showAddForm ? 'CANCEL' : '+ ADD MEMBER'}
        </button>
      </div>

      {showAddForm && (
        <form data-testid="form-add-member" onSubmit={handleAdd} style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <input
            data-testid="input-member-name"
            type="text" placeholder="Name" value={newName}
            onChange={(e) => setNewName(e.target.value)} required
            style={inputStyle}
          />
          <input
            data-testid="input-member-phone"
            type="tel" placeholder="Phone (e.g. +15551234567)" value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            style={inputStyle}
          />
          <input
            data-testid="input-member-dob"
            type="date" value={newDob}
            onChange={(e) => setNewDob(e.target.value)}
            style={inputStyle}
          />
          <select
            data-testid="select-profile-type"
            value={newProfileType}
            onChange={(e) => setNewProfileType(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {PROFILE_TYPES.map(t => (
              <option key={t} value={t}>{t} (companion: {COMPANION_MAP[t]})</option>
            ))}
          </select>
          <button data-testid="btn-submit-member" type="submit" style={{
            ...btnStyle,
            border: '1px solid rgba(78,205,196,0.3)',
            background: 'rgba(78,205,196,0.12)',
            color: 'var(--teal)',
            padding: '9px 0', width: '100%',
          }}>
            ADD MEMBER
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>
          Loading members...
        </div>
      ) : members.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>
          No members yet. Add one to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {members.map(member => {
            const pc = PROFILE_COLORS[member.profile_type] ?? PROFILE_COLORS.adult;
            const age = computeAge(member.date_of_birth);

            if (editingId === member.id) {
              return (
                <div key={member.id} data-testid={`member-row-${member.id}`} style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <input data-testid="input-member-name" type="text" value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={inputStyle} />
                  <input data-testid="input-member-phone" type="tel" placeholder="Phone" value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={inputStyle} />
                  <input data-testid="input-member-dob" type="date" value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    style={inputStyle} />
                  <select data-testid="select-profile-type" value={editProfileType}
                    onChange={(e) => setEditProfileType(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {PROFILE_TYPES.map(t => (
                      <option key={t} value={t}>{t} (companion: {COMPANION_MAP[t]})</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button data-testid="btn-submit-member" type="button" onClick={() => handleEdit(member.id)} style={{
                      ...btnStyle, flex: 1,
                      border: '1px solid rgba(78,205,196,0.3)',
                      background: 'rgba(78,205,196,0.12)',
                      color: 'var(--teal)',
                    }}>Save</button>
                    <button type="button" onClick={() => setEditingId(null)} style={{
                      ...btnStyle, flex: 1,
                    }}>Cancel</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={member.id} data-testid={`member-row-${member.id}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--bg3)', border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>
                      {member.name}
                    </span>
                    {age !== null && (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {age} yrs
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, letterSpacing: 1, padding: '2px 8px', borderRadius: 6,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                      fontWeight: 600,
                    }}>
                      {member.profile_type?.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: 9, letterSpacing: 1, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(155,127,212,0.1)', color: '#9B7FD4',
                      border: '1px solid rgba(155,127,212,0.3)',
                    }}>
                      {member.companion?.toUpperCase()}
                    </span>
                    {member.phone && (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {formatPhone(member.phone)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  data-testid={`btn-edit-member-${member.id}`}
                  onClick={() => startEdit(member)}
                  style={{ ...btnStyle, padding: '5px 10px', fontSize: 10 }}
                >
                  Edit
                </button>
                <button
                  data-testid={`btn-remove-member-${member.id}`}
                  onClick={() => handleRemove(member.id, member.name)}
                  style={{
                    ...btnStyle, padding: '5px 10px', fontSize: 10,
                    color: '#DC503C', border: '1px solid rgba(220,80,60,0.3)',
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MemberManager;
