import { useState, useEffect } from "react";

const BASE = "http://localhost:3001";

/**
 * MemoryViewer — Shows agent memory for a companion.
 * Props: companionId (string), companionName (string)
 */
export function MemoryViewer({ companionId, companionName }) {
  const [memory, setMemory]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function fetchMemory() {
    if (!companionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/companions/${companionId}/memory`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMemory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMemory(); }, [companionId]);

  const STAGE_COLORS = {
    baseline:            "#7B9EC9",
    pattern_recognition: "#4ECDC4",
    predictive:          "#9B7FD4",
    cortege_mode:        "#E8A838",
  };

  function stageColor(stage) {
    return STAGE_COLORS[stage?.toLowerCase().replace(/\s+/g, "_")] ?? "#8C8272";
  }

  function depthPct(score) {
    return Math.min(100, Math.max(0, Math.round((score ?? 0) * 100)));
  }

  const sectionTitle = (label) => (
    <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
      {label}
    </div>
  );

  if (!companionId) return null;

  return (
    <div style={{ fontFamily: "var(--sans)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--cream)", fontWeight: 500 }}>
          {companionName ?? companionId} — Memory
        </div>
        <button
          onClick={fetchMemory}
          disabled={loading}
          style={{
            padding: "5px 12px", borderRadius: 6, cursor: loading ? "default" : "pointer",
            border: "1px solid var(--border)", background: "var(--bg4)",
            color: loading ? "var(--muted2)" : "var(--muted)",
            fontSize: 11, fontFamily: "var(--sans)",
          }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 12,
          background: "rgba(220,80,60,0.08)", border: "1px solid rgba(220,80,60,0.2)",
          fontSize: 11, color: "#DC503C",
        }}>
          {error.includes("not found") || error.includes("404")
            ? "Backend offline or companion not found"
            : error}
        </div>
      )}

      {loading && !memory && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted2)", fontSize: 12 }}>
          Loading memory…
        </div>
      )}

      {memory && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stage + depth */}
          <div style={{
            padding: "14px 16px", borderRadius: 10,
            background: "var(--bg3)", border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 9, letterSpacing: 1.5, padding: "3px 10px", borderRadius: 6,
                background: `${stageColor(memory.stage)}15`,
                color: stageColor(memory.stage),
                border: `1px solid ${stageColor(memory.stage)}30`,
              }}>
                {memory.stage ?? "baseline"}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {memory.events_processed ?? 0} events processed
              </span>
            </div>

            {/* Depth bar */}
            <div style={{ marginBottom: 4, fontSize: 10, color: "var(--muted2)" }}>
              Depth score — {depthPct(memory.depth_score)}%
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--bg4)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${depthPct(memory.depth_score)}%`,
                background: stageColor(memory.stage),
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>

          {/* Counts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { val: memory.trusted_contacts?.length ?? 0,  label: "Trusted" },
              { val: memory.learned_patterns?.length ?? 0,  label: "Patterns" },
              { val: memory.threat_history?.length ?? 0,    label: "Threats" },
            ].map(({ val, label }) => (
              <div key={label} style={{
                padding: "12px 14px", borderRadius: 10, textAlign: "center",
                background: "var(--bg3)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--amber)" }}>{val}</div>
                <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Learned patterns */}
          {memory.learned_patterns?.length > 0 && (
            <div>
              {sectionTitle("Recent Learned Patterns")}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {memory.learned_patterns.slice(-3).reverse().map((p, i) => (
                  <div key={i} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "var(--bg3)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 500, marginBottom: 2 }}>
                      {p.key ?? p.pattern ?? "pattern"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
                      {p.observation ?? p.description ?? JSON.stringify(p)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threat history */}
          {memory.threat_history?.length > 0 && (
            <div>
              {sectionTitle("Recent Threat History")}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {memory.threat_history.slice(-3).reverse().map((t, i) => (
                  <div key={i} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "rgba(220,80,60,0.06)", border: "1px solid rgba(220,80,60,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#DC503C", fontWeight: 500, marginBottom: 2 }}>
                      {t.type ?? t.threat_type ?? "threat"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
                      {t.description ?? t.summary ?? JSON.stringify(t)}
                    </div>
                    {t.timestamp && (
                      <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 3 }}>
                        {new Date(t.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MemoryViewer;
