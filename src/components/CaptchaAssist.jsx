/**
 * CaptchaAssist — Modal for CAPTCHA resolution.
 * Implements: FR-007 (20260323-warden-agent)
 *
 * Triggered by warden:captcha_required WebSocket event.
 * Shows screenshot, broker URL, and "Mark as Resolved" button.
 */

import { apiUrl } from "../lib/backend-url.js";

const ACCENT = "#E8A838";

export function CaptchaAssist({ session, onResolved, onDismiss }) {
  if (!session) return null;

  const handleResolve = async () => {
    try {
      await fetch(apiUrl(`/api/warden/captcha/${session.sessionId}/resolve`), { method: "POST" });
      onResolved?.(session.sessionId);
    } catch (err) {
      console.error("[CaptchaAssist] Resolve failed:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss?.(); }}
    >
      <div
        style={{
          background: "var(--card-bg, #1a1a2e)",
          border: `1px solid ${ACCENT}44`,
          borderRadius: 12,
          padding: 28,
          maxWidth: 560,
          width: "90vw",
          boxShadow: `0 8px 40px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            background: `${ACCENT}22`,
            border: `1px solid ${ACCENT}44`,
            borderRadius: 4,
            padding: "2px 10px",
            fontSize: 11,
            color: ACCENT,
            fontFamily: "var(--mono, monospace)",
            textTransform: "uppercase",
          }}>
            CAPTCHA Assist · L3
          </span>
          <span style={{ fontSize: 12, color: "var(--muted, #888)", marginLeft: "auto" }}>
            {session.expiresAt ? `Expires ${new Date(session.expiresAt).toLocaleTimeString()}` : ""}
          </span>
        </div>

        <div style={{ fontFamily: "var(--serif, Georgia)", fontSize: 18, color: "var(--cream, #f5f5f0)", marginBottom: 8 }}>
          {session.brokerName} blocked automated access
        </div>
        <div style={{ fontSize: 12, color: "var(--muted, #888)", marginBottom: 20 }}>
          WARDEN needs you to solve the bot challenge on <strong style={{ color: "var(--cream, #f5f5f0)" }}>{session.brokerName}</strong> to continue the opt-out for member <strong style={{ color: "var(--cream, #f5f5f0)" }}>{session.memberId}</strong>.
        </div>

        {/* Screenshot */}
        {session.screenshotBase64 && (
          <div style={{ marginBottom: 16, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <img
              src={`data:image/png;base64,${session.screenshotBase64}`}
              alt="Blocked browser page"
              style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        )}

        {/* Steps */}
        <div style={{ fontSize: 12, color: "var(--muted, #888)", marginBottom: 20, lineHeight: 1.7 }}>
          <div style={{ marginBottom: 6, color: "var(--cream, #f5f5f0)", fontWeight: 500 }}>How to resolve:</div>
          <div>1. Open the opt-out page in your browser</div>
          <div>2. Complete the "I am not a robot" challenge</div>
          <div>3. Return here and click <em>Mark as Resolved</em> — WARDEN will continue automatically</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {session.optOutUrl && (
            <a
              href={session.optOutUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                fontSize: 13,
                color: "var(--cream, #f5f5f0)",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Open {session.brokerName} →
            </a>
          )}
          <button
            onClick={handleResolve}
            style={{
              padding: "8px 20px",
              background: `${ACCENT}22`,
              border: `1px solid ${ACCENT}66`,
              borderRadius: 6,
              fontSize: 13,
              color: ACCENT,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Mark as Resolved
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--muted, #888)",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaptchaAssist;
