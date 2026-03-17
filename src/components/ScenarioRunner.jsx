import { useState, useEffect } from "react";

const BASE = "http://localhost:3001";

const KNOWN_SCENARIOS = [
  { name: "grandparent-scam", label: "Grandparent Scam", desc: "5-event AI voice clone + wire transfer attempt targeting Mom" },
  { name: "normal-day",       label: "Normal Day",       desc: "Baseline behavior sequence — routine communications" },
];

/**
 * ScenarioRunner — Run demo scenarios against the backend.
 */
export function ScenarioRunner() {
  const [agents, setAgents]     = useState([]);
  const [results, setResults]   = useState({});   // name → { loading, data, error }
  const [backendOk, setBackendOk] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/agents`)
      .then(r => r.json())
      .then(data => { setAgents(data); setBackendOk(true); })
      .catch(() => setBackendOk(false));
  }, []);

  async function runScenario(name) {
    setResults(prev => ({ ...prev, [name]: { loading: true, data: null, error: null } }));
    try {
      const res = await fetch(`${BASE}/api/scenarios/${name}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResults(prev => ({ ...prev, [name]: { loading: false, data, error: null } }));
    } catch (err) {
      setResults(prev => ({ ...prev, [name]: { loading: false, data: null, error: err.message } }));
    }
  }

  if (backendOk === false) {
    return (
      <div style={{
        padding: "20px 24px", borderRadius: 12,
        background: "rgba(220,80,60,0.08)", border: "1px solid rgba(220,80,60,0.2)",
        color: "#DC503C", fontSize: 12,
      }}>
        Backend offline — start the server on port 3001 to run scenarios
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--sans)" }}>
      {/* Agents row */}
      {agents.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {agents.map(a => (
            <span key={a} style={{
              fontSize: 10, letterSpacing: 1.5, padding: "3px 10px",
              borderRadius: 6, background: "rgba(78,205,196,0.1)",
              color: "#4ECDC4", border: "1px solid rgba(78,205,196,0.25)",
            }}>
              {a}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {KNOWN_SCENARIOS.map(s => {
          const r = results[s.name] ?? {};
          return (
            <div key={s.name} style={{
              padding: "16px 18px", borderRadius: 12,
              background: "var(--bg3)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--cream)", fontWeight: 500, marginBottom: 3 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.desc}</div>
                </div>

                <button
                  onClick={() => runScenario(s.name)}
                  disabled={r.loading}
                  style={{
                    padding: "8px 18px", borderRadius: 8, cursor: r.loading ? "default" : "pointer",
                    border: "1px solid rgba(78,205,196,0.3)",
                    background: r.loading ? "var(--bg4)" : "rgba(78,205,196,0.1)",
                    color: r.loading ? "var(--muted)" : "#4ECDC4",
                    fontSize: 12, fontFamily: "var(--sans)",
                    transition: "all 0.2s",
                  }}
                >
                  {r.loading ? "Running…" : "Run"}
                </button>
              </div>

              {/* Result */}
              {r.data && (
                <div style={{
                  marginTop: 10, padding: "8px 12px", borderRadius: 8,
                  background: "rgba(78,205,196,0.07)", border: "1px solid rgba(78,205,196,0.2)",
                  fontSize: 11, color: "#4ECDC4",
                }}>
                  ✓ Scenario complete — {r.data.eventsEmitted ?? r.data.events_emitted ?? "?"} events emitted
                </div>
              )}
              {r.error && (
                <div style={{
                  marginTop: 10, padding: "8px 12px", borderRadius: 8,
                  background: "rgba(220,80,60,0.08)", border: "1px solid rgba(220,80,60,0.2)",
                  fontSize: 11, color: "#DC503C",
                }}>
                  Error: {r.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScenarioRunner;
