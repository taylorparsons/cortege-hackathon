/**
 * BrokerStatus — Live data broker scan status card.
 * Implements: FR-006 (20260323-warden-agent)
 *
 * Replaces the hardcoded "Household Data Broker Status" relay card.
 * Fetches from GET /api/warden/status and updates via warden:status_update WebSocket events.
 */

import { useState, useEffect } from "react";
import { apiUrl } from "../lib/backend-url.js";

const TAG_COLOR = "#4ECDC4";
const TAG_BG = "rgba(78,205,196,0.1)";

const STATUS_STYLE = {
  not_checked:       { color: "#888",    label: "not checked" },
  listed:            { color: "#E74C3C", label: "listed" },
  removal_pending:   { color: "#E8A838", label: "removal pending" },
  removal_confirmed: { color: "#2ECC71", label: "confirmed" },
  re_listed:         { color: "#E67E22", label: "re-listed!" },
  not_found:         { color: "#4ECDC4", label: "not found" },
  captcha_timeout:   { color: "#9B7FD4", label: "CAPTCHA timeout" },
  error:             { color: "#E74C3C", label: "error" },
};

function statusBadge(status) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.not_checked;
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10,
      padding: "1px 6px",
      borderRadius: 3,
      background: `${s.color}22`,
      color: s.color,
      border: `1px solid ${s.color}44`,
      fontFamily: "var(--mono, monospace)",
    }}>{s.label}</span>
  );
}

export function BrokerStatus({ householdId, version }) {
  const [scanStatus, setScanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!householdId) { setLoading(false); return; }

    const url = apiUrl(`/api/warden/status?household_id=${householdId}`);
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setScanStatus(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [householdId, version]);

  const handleScanNow = async () => {
    if (!householdId || scanning) return;
    setScanning(true);
    try {
      await fetch(apiUrl("/api/warden/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household_id: householdId }),
      });
    } catch (err) {
      console.error("[BrokerStatus] Scan trigger failed:", err);
    } finally {
      setScanning(false);
    }
  };

  // Build summary lines from scan status
  const summaryLines = buildSummaryLines(scanStatus);
  const agg = scanStatus?.aggregate ?? {};
  const headerLine = agg.total_brokers
    ? `${agg.total_brokers} brokers monitored — ${agg.removal_confirmed ?? 0} confirmed, ${agg.removal_pending ?? 0} pending, ${agg.listed ?? 0} listed`
    : "Awaiting first scan";

  const hasCaptchaNeeded = false; // populated by CaptchaAssist via parent hook

  return (
    <div className="relay-card" data-testid="broker-status-card">
      <div className="relay-header">
        <span
          className="relay-tag"
          style={{ background: TAG_BG, color: TAG_COLOR, border: `1px solid ${TAG_COLOR}30` }}
        >
          Data Exposure
        </span>
        {!loading && (
          <button
            data-testid="btn-scan-now"
            onClick={handleScanNow}
            disabled={scanning}
            style={{
              marginLeft: "auto",
              fontSize: 10,
              padding: "2px 8px",
              background: "rgba(78,205,196,0.1)",
              border: `1px solid ${TAG_COLOR}44`,
              borderRadius: 3,
              color: TAG_COLOR,
              cursor: scanning ? "default" : "pointer",
              opacity: scanning ? 0.6 : 1,
            }}
            title="Trigger scan now"
          >
            {scanning ? "Queuing…" : "Scan Now"}
          </button>
        )}
      </div>

      <div
        className="relay-title"
        style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--cream)", marginBottom: 12 }}
      >
        Household Data Broker Status
      </div>

      <div className="relay-body">
        {loading && (
          <div data-testid="broker-status-loading" style={{ fontSize: 12, color: "var(--muted)" }}>Loading scan data…</div>
        )}
        {error && (
          <div data-testid="broker-status-error" style={{ fontSize: 12, color: "#E74C3C" }}>WARDEN unavailable</div>
        )}
        {!loading && !error && (
          <>
            <div data-testid="broker-status-summary" style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 12, color: "var(--muted)" }}>
              <span style={{ color: TAG_COLOR, flexShrink: 0 }}>·</span>
              <span>{headerLine}</span>
            </div>
            {summaryLines.map((line, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 12, color: "var(--muted)", alignItems: "flex-start" }}>
                <span style={{ color: TAG_COLOR, flexShrink: 0 }}>·</span>
                <span style={{ flex: 1 }}>
                  <span style={{ color: "var(--cream)", marginRight: 6 }}>{line.memberName}:</span>
                  {line.brokerSummary}
                  {line.badges.map((b, j) => (
                    <span key={j} style={{ marginLeft: 6 }}>{statusBadge(b.status)}</span>
                  ))}
                </span>
              </div>
            ))}
            {summaryLines.length === 0 && (
              <div data-testid="broker-status-empty" style={{ fontSize: 12, color: "var(--muted)" }}>
                No scan data yet — click <em>Scan Now</em> to start.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSummaryLines(scanStatus) {
  if (!scanStatus?.members) return [];

  return Object.entries(scanStatus.members).map(([memberId, memberData]) => {
    const brokers = memberData.brokers ?? {};
    const entries = Object.entries(brokers);

    // Group by status
    const confirmed = entries.filter(([, b]) => b.status === "removal_confirmed").map(([id]) => id);
    const pending   = entries.filter(([, b]) => b.status === "removal_pending").map(([id]) => id);
    const listed    = entries.filter(([, b]) => b.status === "listed" || b.status === "re_listed").map(([id]) => id);

    let parts = [];
    if (confirmed.length) parts.push(`${confirmed.length} confirmed`);
    if (pending.length)   parts.push(`${pending.length} pending`);
    if (listed.length)    parts.push(`${listed.length} listed`);
    const brokerSummary = parts.join(", ") || "no data";

    // Show top 3 notable badges
    const notable = entries
      .filter(([, b]) => b.status !== "not_checked" && b.status !== "not_found")
      .slice(0, 3)
      .map(([, b]) => ({ status: b.status }));

    return {
      memberName: memberId, // display name comes from parent; memberId is used as fallback
      brokerSummary,
      badges: notable,
    };
  });
}

export default BrokerStatus;
