/**
 * EventFeed — Live feed of CoreEvents from the backend WebSocket.
 * Props: events (array), wsConnected (boolean)
 */
export function EventFeed({ events = [], wsConnected = false }) {
  const TYPE_COLORS = {
    inbound_call:          { bg: "rgba(78,205,196,0.12)",  color: "#4ECDC4",  label: "CALL" },
    inbound_sms:           { bg: "rgba(123,158,201,0.12)", color: "#7B9EC9",  label: "SMS" },
    inbound_email:         { bg: "rgba(155,127,212,0.12)", color: "#9B7FD4",  label: "EMAIL" },
    financial_transaction: { bg: "rgba(232,168,56,0.15)",  color: "#E8A838",  label: "FINANCE" },
    contact_request:       { bg: "rgba(78,205,196,0.1)",   color: "#4ECDC4",  label: "CONTACT" },
    login_attempt:         { bg: "rgba(220,80,60,0.12)",   color: "#DC503C",  label: "LOGIN" },
    default:               { bg: "rgba(140,130,114,0.1)",  color: "#8C8272",  label: "EVENT" },
  };

  function typeStyle(type) {
    return TYPE_COLORS[type] ?? TYPE_COLORS.default;
  }

  function relativeTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 5000)  return "just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }

  function payloadSummary(payload) {
    if (!payload || typeof payload !== "object") return "";
    const keys = Object.keys(payload).slice(0, 3);
    return keys.map(k => {
      const v = payload[k];
      const str = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}: ${str.length > 30 ? str.slice(0, 30) + "…" : str}`;
    }).join(" · ");
  }

  const dotColor = wsConnected ? "#4ECDC4" : "#E8A838";
  const dotAnim  = wsConnected
    ? { animation: "efBreathe 2s ease-in-out infinite" }
    : {};

  return (
    <div data-testid="event-feed" style={{ fontFamily: "var(--sans)" }}>
      <style>{`
        @keyframes efBreathe {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.8); }
        }
        @keyframes efPulse {
          0%,100% { opacity:0.4; }
          50%      { opacity:1; }
        }
      `}</style>

      {/* Connection status bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", marginBottom: 12,
        background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: 10, fontSize: 11, color: "var(--muted)",
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: dotColor, flexShrink: 0, ...dotAnim,
        }} />
        <span style={{ color: wsConnected ? "#4ECDC4" : "#E8A838" }}>
          {wsConnected ? "Live — connected to backend" : "Offline — waiting for backend"}
        </span>
        <span style={{ marginLeft: "auto" }}>{events.length} event{events.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Feed */}
      <div style={{
        maxHeight: 400, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {events.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            color: "var(--muted2)", fontSize: 12, letterSpacing: 1,
            animation: "efPulse 2.5s ease-in-out infinite",
          }}>
            Waiting for events…
          </div>
        ) : (
          events.map((ev, i) => {
            const ts = typeStyle(ev.type);
            return (
              <div key={ev.id ?? i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--bg3)", border: "1px solid var(--border)",
                transition: "background 0.15s",
              }}>
                {/* Type badge */}
                <div style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 9,
                  fontWeight: 600, letterSpacing: 1.5, flexShrink: 0,
                  background: ts.bg, color: ts.color,
                  border: `1px solid ${ts.color}30`,
                  marginTop: 1,
                }}>
                  {ts.label}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
                      {ev.source ?? "unknown"}
                    </span>
                    {ev.target_member && (
                      <>
                        <span style={{ color: "var(--muted2)", fontSize: 11 }}>→</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{ev.target_member}</span>
                      </>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted2)", flexShrink: 0 }}>
                      {relativeTime(ev.timestamp)}
                    </span>
                  </div>
                  {ev.payload && (
                    <div style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.4 }}>
                      {payloadSummary(ev.payload)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EventFeed;
