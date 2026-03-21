import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../lib/backend-url.js';

const EVIDENCE_TYPES = [
  { value: 'message_excerpt', label: 'Message Excerpt' },
  { value: 'suspicious_url', label: 'Suspicious URL' },
  { value: 'screenshot_note', label: 'Screenshot Note' },
];

function normalizePhone(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed.startsWith('+')
    ? `+${trimmed.slice(1).replace(/\D/g, '')}`
    : trimmed.replace(/\D/g, '');
}

function eventBelongsToHousehold(event, household) {
  if (!event || !household) return false;
  if (event.source === 'twilio' && household.twilio_number) {
    return normalizePhone(event.payload?.to) === normalizePhone(household.twilio_number);
  }
  if (event.target_member && Array.isArray(household.members)) {
    return household.members.some((member) => member.id === event.target_member);
  }
  return false;
}

function eventLabel(event, memberNames) {
  const caller = event?.payload?.from ?? 'Unknown caller';
  const target = event?.target_member ? memberNames.get(event.target_member) ?? event.target_member : 'household';
  const time = event?.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return `${caller} -> ${target}${time ? ` (${time})` : ''}`;
}

function severityColor(severity) {
  if (severity === 'high') return '#DC503C';
  if (severity === 'medium') return '#E8A838';
  return '#4ECDC4';
}

export function FraudCasePanel({ household = null }) {
  const [recentEvents, setRecentEvents] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [evidenceType, setEvidenceType] = useState('message_excerpt');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const memberNames = useMemo(() => new Map(
    (household?.members ?? []).map((member) => [member.id, member.name])
  ), [household?.members]);

  useEffect(() => {
    async function loadData() {
      if (!household?.household_id) {
        setRecentEvents([]);
        setCases([]);
        setSelectedEventId('');
        return;
      }

      try {
        const [eventsRes, casesRes] = await Promise.all([
          fetch(apiUrl('/api/events?limit=20')),
          fetch(apiUrl(`/api/fraud-cases?household_id=${encodeURIComponent(household.household_id)}`)),
        ]);

        const rawEvents = eventsRes.ok ? await eventsRes.json() : [];
        const filteredEvents = rawEvents.filter((event) => event.source === 'twilio')
          .filter((event) => eventBelongsToHousehold(event, household));
        setRecentEvents(filteredEvents);
        setSelectedEventId((current) => {
          if (filteredEvents.some((event) => event.id === current)) return current;
          return filteredEvents[0]?.id ?? '';
        });

        const fraudCases = casesRes.ok ? await casesRes.json() : [];
        setCases(Array.isArray(fraudCases) ? fraudCases : []);
      } catch {
        setRecentEvents([]);
        setCases([]);
        setSelectedEventId('');
      }
    }

    loadData();
  }, [household]);

  async function handleCreateCase(event) {
    event.preventDefault();
    if (!household?.household_id || !selectedEventId || !content.trim()) {
      setStatus({ ok: false, msg: 'Select a call and enter evidence text first.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(apiUrl('/api/fraud-cases'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: household.household_id,
          event_id: selectedEventId,
          evidence: {
            type: evidenceType,
            content: content.trim(),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create fraud case');
      }

      setCases((prev) => [data, ...prev]);
      setContent('');
      setStatus({ ok: true, msg: `Case ${data.case_id} created.` });
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    fontSize: 10,
    color: 'var(--muted)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  };
  const fieldStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    background: 'var(--bg4)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'var(--sans)',
    outline: 'none',
  };

  return (
    <div data-testid="fraud-case-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
        Link one recent household call to one evidence item and turn it into a demo-ready fraud case.
      </div>

      {recentEvents.length === 0 ? (
        <div data-testid="fraud-case-empty" style={{ color: 'var(--muted2)', fontSize: 12 }}>
          No recent Twilio calls for this household yet. Trigger or receive one live call first.
        </div>
      ) : (
        <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Recent Household Call</label>
            <select
              data-testid="select-fraud-case-event"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              style={fieldStyle}
            >
              {recentEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {eventLabel(event, memberNames)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Evidence Type</label>
            <select
              data-testid="select-fraud-case-evidence-type"
              value={evidenceType}
              onChange={(event) => setEvidenceType(event.target.value)}
              style={fieldStyle}
            >
              {EVIDENCE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Evidence Text</label>
            <textarea
              data-testid="textarea-fraud-case-evidence"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              placeholder="Paste the suspicious message, URL, or screenshot notes here."
              style={{
                ...fieldStyle,
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          <button
            type="submit"
            data-testid="btn-create-fraud-case"
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              cursor: loading ? 'default' : 'pointer',
              border: '1px solid rgba(232,168,56,0.35)',
              background: loading ? 'var(--bg4)' : 'rgba(232,168,56,0.1)',
              color: loading ? 'var(--muted)' : '#E8A838',
              fontSize: 12,
              fontFamily: 'var(--sans)',
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Creating…' : 'Create Fraud Case'}
          </button>

          {status && (
            <div
              data-testid="fraud-case-status"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11,
                background: status.ok ? 'rgba(78,205,196,0.07)' : 'rgba(220,80,60,0.08)',
                border: `1px solid ${status.ok ? 'rgba(78,205,196,0.2)' : 'rgba(220,80,60,0.2)'}`,
                color: status.ok ? '#4ECDC4' : '#DC503C',
              }}
            >
              {status.msg}
            </div>
          )}
        </form>
      )}

      <div data-testid="fraud-case-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cases.length === 0 ? (
          <div style={{ color: 'var(--muted2)', fontSize: 12 }}>No fraud cases for this household yet.</div>
        ) : (
          cases.map((fraudCase) => (
            <div
              key={fraudCase.case_id}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg3)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--cream)' }}>
                  {fraudCase.case_id}
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    border: `1px solid ${severityColor(fraudCase.analysis.severity)}40`,
                    color: severityColor(fraudCase.analysis.severity),
                  }}
                >
                  {fraudCase.analysis.severity}
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                {fraudCase.analysis.rationale}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(fraudCase.analysis.signals ?? []).map((signal) => (
                  <div
                    key={signal}
                    style={{
                      padding: '3px 7px',
                      borderRadius: 999,
                      background: 'rgba(255,245,225,0.05)',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                      fontSize: 10,
                    }}
                  >
                    {signal}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text)' }}>
                {fraudCase.analysis.recommended_action}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FraudCasePanel;
