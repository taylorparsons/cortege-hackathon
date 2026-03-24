/**
 * AssociateDiscovery — Shows people discovered as "associated" on broker sites.
 * Implements: FR-008, FR-009 (20260323-warden-agent)
 *
 * Fetches from GET /api/warden/associates and displays each discovered person
 * with "Add to Household" and "Dismiss" actions.
 */

import { useState, useEffect } from "react";
import { apiUrl } from "../lib/backend-url.js";

const ACCENT = "#7B68EE"; // soft violet — distinct from Data Exposure teal
const ACCENT_BG = "rgba(123,104,238,0.1)";

export function AssociateDiscovery({ householdId, version, onMemberAdded }) {
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingActions, setPendingActions] = useState(new Set());

  useEffect(() => {
    if (!householdId) { setLoading(false); return; }
    const url = apiUrl(`/api/warden/associates?household_id=${householdId}`);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setAssociates(Array.isArray(data) ? data.filter((a) => !a.dismissed) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [householdId, version]);

  const handleAdd = async (assoc) => {
    if (pendingActions.has(assoc.id)) return;
    setPendingActions((prev) => new Set(prev).add(assoc.id));
    try {
      const res = await fetch(apiUrl(`/api/households/${householdId}/members`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: assoc.name }),
      });
      if (res.ok) {
        setAssociates((prev) => prev.filter((a) => a.id !== assoc.id));
        onMemberAdded?.();
      }
    } catch (err) {
      console.error("[AssociateDiscovery] Add failed:", err);
    } finally {
      setPendingActions((prev) => { const s = new Set(prev); s.delete(assoc.id); return s; });
    }
  };

  const handleDismiss = async (assoc) => {
    if (pendingActions.has(assoc.id)) return;
    setPendingActions((prev) => new Set(prev).add(assoc.id));
    try {
      await fetch(apiUrl(`/api/warden/associates/${assoc.id}/dismiss`), { method: "POST" });
      setAssociates((prev) => prev.filter((a) => a.id !== assoc.id));
    } catch (err) {
      console.error("[AssociateDiscovery] Dismiss failed:", err);
    } finally {
      setPendingActions((prev) => { const s = new Set(prev); s.delete(assoc.id); return s; });
    }
  };

  if (loading || associates.length === 0) return null;

  return (
    <div className="relay-card">
      <div className="relay-header">
        <span
          className="relay-tag"
          style={{ background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT}30` }}
        >
          Discovered Associates
        </span>
      </div>

      <div
        className="relay-title"
        style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--cream)", marginBottom: 12 }}
      >
        People Found on Broker Sites
      </div>

      <div className="relay-body">
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          WARDEN found these people listed alongside your household members. Add them to extend protection.
        </div>

        {associates.map((assoc) => {
          const isPending = pendingActions.has(assoc.id);
          return (
            <div
              key={assoc.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 12,
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 6,
              }}
            >
              <span style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }}>·</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--cream)", marginBottom: 2 }}>
                  {assoc.name}
                  {assoc.relationship && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)" }}>
                      — {assoc.relationship}
                    </span>
                  )}
                </div>
                {assoc.found_on?.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    Found on: {assoc.found_on.join(", ")}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleAdd(assoc)}
                  disabled={isPending}
                  style={{
                    padding: "3px 10px",
                    fontSize: 11,
                    background: `${ACCENT}22`,
                    border: `1px solid ${ACCENT}55`,
                    borderRadius: 4,
                    color: ACCENT,
                    cursor: isPending ? "default" : "pointer",
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => handleDismiss(assoc)}
                  disabled={isPending}
                  style={{
                    padding: "3px 8px",
                    fontSize: 11,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4,
                    color: "var(--muted)",
                    cursor: isPending ? "default" : "pointer",
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AssociateDiscovery;
