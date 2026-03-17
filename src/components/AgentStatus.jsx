/**
 * AgentStatus — Real-time agent processing status.
 * Props: companions (array), processingStates (Map<instanceId, boolean>)
 */
export function AgentStatus({ companions = [], processingStates = new Map() }) {
  const STAGE_COLORS = {
    "Baseline":           "#7B9EC9",
    "Pattern Recognition":"#4ECDC4",
    "Predictive":         "#9B7FD4",
    "Cortege Mode":       "#E8A838",
  };

  function stageColor(stage) {
    return STAGE_COLORS[stage] ?? "#8C8272";
  }

  function depthPercent(score) {
    if (typeof score !== "number") return 0;
    return Math.min(100, Math.max(0, Math.round(score * 100)));
  }

  return (
    <div style={{ fontFamily: "var(--sans)" }}>
      <style>{`
        @keyframes asSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {companions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)", fontSize: 12 }}>
          No companions loaded
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {companions.map((c) => {
            const instanceId = c.instanceId ?? c.id;
            const isProcessing = processingStates.get(instanceId) ?? false;
            const sc = stageColor(c.stage);
            const pct = depthPercent(c.depthScore);

            return (
              <div key={instanceId} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                background: "var(--bg3)", border: "1px solid var(--border)",
              }}>
                {/* Processing indicator */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isProcessing ? `${sc}18` : "var(--bg4)",
                  border: `1.5px solid ${isProcessing ? sc : "var(--border)"}`,
                  animation: isProcessing ? "asSpin 1s linear infinite" : "none",
                  transition: "all 0.3s",
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: isProcessing ? sc : "var(--muted2)",
                    transition: "background 0.3s",
                  }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--cream)", fontWeight: 500 }}>
                      {c.name ?? c.agentName ?? instanceId}
                    </span>
                    {c.memberId && (
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>→ {c.memberId}</span>
                    )}
                    <span style={{
                      marginLeft: "auto", fontSize: 9, letterSpacing: 1.5,
                      padding: "2px 8px", borderRadius: 6,
                      background: `${sc}15`, color: sc,
                      border: `1px solid ${sc}30`,
                    }}>
                      {c.stage ?? "Baseline"}
                    </span>
                  </div>

                  {/* Depth bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: "var(--bg4)", overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${pct}%`,
                        background: sc,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Status label */}
                <div style={{
                  fontSize: 10, color: isProcessing ? sc : "var(--muted2)",
                  letterSpacing: 0.5, flexShrink: 0, minWidth: 60, textAlign: "right",
                  transition: "color 0.3s",
                }}>
                  {isProcessing ? "Processing…" : "Idle"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AgentStatus;
