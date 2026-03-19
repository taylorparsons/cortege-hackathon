import { useState } from "react";
import { apiUrl } from "../lib/backend-url.js";

const EVENT_TYPES = [
  "inbound_call",
  "inbound_sms",
  "inbound_email",
  "financial_transaction",
  "contact_request",
  "login_attempt",
];

const MEMBERS = [
  { id: "member_001", label: "member_001 — Alex" },
  { id: "member_002", label: "member_002 — Mom" },
  { id: "member_003", label: "member_003 — Taylor" },
];

const EXAMPLE_PAYLOADS = {
  inbound_call: {
    from: "+1-800-555-0199",
    caller_name: "IRS Collections",
    duration_seconds: 0,
    voicemail: false,
  },
  inbound_sms: {
    from: "+1-555-123-4567",
    body: "Your account has been suspended. Click here to verify: http://bank-secure-login.net",
  },
  inbound_email: {
    from: "support@chase-alertcenter.com",
    subject: "Urgent: Verify your account",
    domain_age_days: 3,
    spf_pass: false,
  },
  financial_transaction: {
    amount: 2400,
    currency: "USD",
    recipient: "unknown",
    method: "wire_transfer",
    initiated_by: "phone_request",
  },
  contact_request: {
    platform: "instagram",
    username: "j_smith_real99",
    account_age_days: 2,
    mutual_connections: 0,
  },
  login_attempt: {
    service: "gmail",
    ip: "185.220.101.45",
    location: "Kyiv, UA",
    success: false,
  },
};

/**
 * EventInjector — Manually inject CoreEvents into the backend.
 */
export function EventInjector() {
  const [type, setType]           = useState(EVENT_TYPES[0]);
  const [target, setTarget]       = useState(MEMBERS[0].id);
  const [payloadStr, setPayloadStr] = useState(JSON.stringify(EXAMPLE_PAYLOADS[EVENT_TYPES[0]], null, 2));
  const [status, setStatus]       = useState(null); // null | { ok, msg }
  const [loading, setLoading]     = useState(false);

  function handleTypeChange(newType) {
    setType(newType);
    setPayloadStr(JSON.stringify(EXAMPLE_PAYLOADS[newType] ?? {}, null, 2));
    setStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    let payload;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      setStatus({ ok: false, msg: "Invalid JSON in payload field" });
      return;
    }

    const event = {
      type,
      source: "manual_injection",
      target_member: target,
      timestamp: new Date().toISOString(),
      payload,
    };

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/events'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus({ ok: true, msg: `Event injected — id: ${data.id ?? "ok"}` });
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { fontSize: 10, color: "var(--muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, display: "block" };
  const selectStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: "var(--bg4)", border: "1px solid var(--border)",
    color: "var(--text)", fontSize: 12, fontFamily: "var(--sans)",
    outline: "none", cursor: "pointer",
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: "var(--sans)", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Event type */}
      <div>
        <label style={labelStyle}>Event Type</label>
        <select value={type} onChange={e => handleTypeChange(e.target.value)} style={selectStyle}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Target member */}
      <div>
        <label style={labelStyle}>Target Member</label>
        <select value={target} onChange={e => setTarget(e.target.value)} style={selectStyle}>
          {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* Payload */}
      <div>
        <label style={labelStyle}>Payload (JSON)</label>
        <textarea
          value={payloadStr}
          onChange={e => setPayloadStr(e.target.value)}
          rows={7}
          style={{
            ...selectStyle,
            resize: "vertical", fontFamily: "monospace", fontSize: 11,
            lineHeight: 1.5, color: "var(--muted)",
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 20px", borderRadius: 8, cursor: loading ? "default" : "pointer",
          border: "1px solid rgba(78,205,196,0.35)",
          background: loading ? "var(--bg4)" : "rgba(78,205,196,0.1)",
          color: loading ? "var(--muted)" : "#4ECDC4",
          fontSize: 12, fontFamily: "var(--sans)", fontWeight: 500,
          letterSpacing: 0.5, transition: "all 0.2s",
        }}
      >
        {loading ? "Injecting…" : "Inject Event"}
      </button>

      {/* Feedback */}
      {status && (
        <div style={{
          padding: "8px 12px", borderRadius: 8, fontSize: 11,
          background: status.ok ? "rgba(78,205,196,0.07)" : "rgba(220,80,60,0.08)",
          border: `1px solid ${status.ok ? "rgba(78,205,196,0.2)" : "rgba(220,80,60,0.2)"}`,
          color: status.ok ? "#4ECDC4" : "#DC503C",
        }}>
          {status.ok ? "✓ " : "✗ "}{status.msg}
        </div>
      )}
    </form>
  );
}

export default EventInjector;
