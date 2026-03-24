import { useState, useEffect } from "react";
import { EventFeed } from "./components/EventFeed.jsx";
import { AgentStatus } from "./components/AgentStatus.jsx";
import { ScenarioRunner } from "./components/ScenarioRunner.jsx";
import { EventInjector } from "./components/EventInjector.jsx";
import { MemoryViewer } from "./components/MemoryViewer.jsx";
import { FraudCasePanel } from "./components/FraudCasePanel.jsx";
import { useCortegeData } from './hooks/useCortegeData.js';
import { useCompanionDetail } from './hooks/useCompanionDetail.js';
import { getAgentDisplay, getStageIndex, formatStageName, DEPTH_STAGES } from './lib/companion-display.js';
import { HouseholdSelector } from './components/HouseholdSelector.jsx';
import { useHouseholdContext } from './context/HouseholdContext.jsx';
import { BrokerStatus } from './components/BrokerStatus.jsx';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');`;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
${FONTS}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #111009;
  --bg2:       #1A1814;
  --bg3:       #221F19;
  --bg4:       #2C2820;
  --border:    rgba(255,245,225,0.07);
  --border2:   rgba(255,245,225,0.13);
  --text:      #F0EAD8;
  --muted:     #8C8272;
  --muted2:    #6A5F50;
  --amber:     #E8A838;
  --teal:      #4ECDC4;
  --slate:     #7B9EC9;
  --cream:     #F7F0DC;
  --serif:     'Cormorant Garamond', serif;
  --sans:      'Outfit', sans-serif;
}

html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--sans); }

/* ── LAYOUT ── */
.app { min-height: 100vh; background: var(--bg); overflow-x: hidden; }

/* ── NAV ── */
.nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; height: 60px;
  background: rgba(17,16,9,0.9); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
}
.nav-brand { display: flex; align-items: center; gap: 12px; }
.nav-wordmark { font-family: var(--serif); font-size: 22px; font-weight: 500; color: var(--cream); letter-spacing: 4px; }
.nav-badge {
  font-family: var(--sans); font-size: 9px; font-weight: 500; letter-spacing: 2px;
  color: var(--teal); border: 1px solid rgba(78,205,196,0.3);
  background: rgba(78,205,196,0.07); padding: 3px 8px; border-radius: 20px;
}
.nav-tabs { display: flex; gap: 4px; }
.nav-tab {
  font-family: var(--sans); font-size: 12px; font-weight: 400;
  color: var(--muted); padding: 7px 16px; border-radius: 8px;
  border: none; background: transparent; cursor: pointer; transition: all 0.2s;
  letter-spacing: 0.3px;
}
.nav-tab:hover { color: var(--text); background: var(--bg3); }
.nav-tab.active { color: var(--cream); background: var(--bg4); }
.nav-status { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); }
.pulse-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); animation: breathe 3s ease-in-out infinite; }
@keyframes breathe { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }

/* ── MAIN ── */
.main { padding: 40px 40px; max-width: 1320px; margin: 0 auto; }

/* ── SECTION TITLE ── */
.section-eyebrow {
  font-family: var(--sans); font-size: 10px; font-weight: 500; letter-spacing: 3px;
  color: var(--muted); text-transform: uppercase; margin-bottom: 8px;
}
.section-title { font-family: var(--serif); font-size: 28px; font-weight: 400; color: var(--cream); margin-bottom: 24px; }

/* ── HOUSEHOLD HEADER ── */
.household-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px; background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; margin-bottom: 32px;
}
.hh-left { display: flex; align-items: center; gap: 16px; }
.hh-crest {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(232,168,56,0.15), rgba(78,205,196,0.1));
  border: 1px solid rgba(255,245,225,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.hh-name { font-family: var(--serif); font-size: 22px; font-weight: 500; color: var(--cream); }
.hh-sub { font-size: 11px; color: var(--muted); margin-top: 2px; letter-spacing: 0.3px; }
.hh-stats { display: flex; gap: 28px; }
.hh-stat { text-align: right; }
.hh-stat-val { font-family: var(--serif); font-size: 22px; color: var(--amber); }
.hh-stat-lbl { font-size: 10px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-top: 1px; }

/* ── COMPANION GRID ── */
.companion-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 36px; }

/* ── COMPANION CARD ── */
.companion-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 20px; padding: 0; cursor: pointer;
  transition: all 0.3s; overflow: hidden; position: relative;
}
.companion-card:hover { border-color: var(--border2); transform: translateY(-2px); }
.companion-card.selected { border-color: var(--c-ring) !important; }

.cc-top {
  padding: 24px 24px 18px;
  position: relative;
}
.cc-orb-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.cc-orb {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: 22px; font-weight: 300;
  position: relative; flex-shrink: 0;
  transition: box-shadow 0.3s;
}
.cc-orb.breathing { animation: orbBreathe 4s ease-in-out infinite; }
@keyframes orbBreathe {
  0%,100% { box-shadow: 0 0 0 0 var(--c-glow), 0 0 20px var(--c-glow); }
  50% { box-shadow: 0 0 0 8px transparent, 0 0 32px var(--c-glow); }
}
.cc-meta { flex: 1; min-width: 0; }
.cc-greek { font-family: var(--sans); font-size: 10px; letter-spacing: 2px; color: var(--muted); margin-bottom: 2px; }
.cc-name { font-family: var(--serif); font-size: 20px; font-weight: 500; color: var(--cream); line-height: 1.1; }
.cc-role { font-size: 11px; color: var(--muted); margin-top: 1px; }

.cc-paired {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg3); border: 1px solid var(--border);
  padding: 5px 12px; border-radius: 20px; font-size: 12px; color: var(--text);
  margin-bottom: 14px;
}
.cc-paired-dot { width: 6px; height: 6px; border-radius: 50%; }

.cc-stats { display: flex; gap: 12px; }
.cc-stat {
  flex: 1; background: var(--bg3); border-radius: 10px; padding: 10px 12px;
  border: 1px solid var(--border);
}
.cc-stat-val { font-family: var(--serif); font-size: 20px; font-weight: 400; }
.cc-stat-lbl { font-size: 9px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }

.cc-bottom {
  padding: 14px 24px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg3);
}
.cc-last-label { font-size: 9px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
.cc-last-text { font-size: 11.5px; color: var(--muted); line-height: 1.5; }
.cc-last-text strong { color: var(--text); font-weight: 500; }
.cc-time { font-size: 10px; color: var(--muted2); margin-top: 4px; letter-spacing: 0.5px; }

/* ── DEPTH BAR ── */
.depth-row { display: flex; align-items: center; gap: 4px; margin-top: 14px; padding: 0 24px 20px; }
.depth-seg {
  flex: 1; height: 3px; border-radius: 2px;
  background: var(--bg4); transition: background 0.5s;
}
.depth-seg.filled { }
.depth-labels { display: flex; justify-content: space-between; padding: 4px 24px 0; }
.depth-lbl { font-size: 9px; color: var(--muted2); }

/* ── DETAIL PANEL ── */
.detail-panel {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 20px; overflow: hidden; margin-bottom: 36px;
  animation: slideIn 0.25s ease;
}
@keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.dp-header {
  display: flex; align-items: center; gap: 20px;
  padding: 28px 32px; border-bottom: 1px solid var(--border);
}
.dp-orb {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: 28px; font-weight: 300;
  flex-shrink: 0;
}
.dp-title-block { flex: 1; }
.dp-super { font-size: 10px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
.dp-name { font-family: var(--serif); font-size: 30px; font-weight: 500; color: var(--cream); }
.dp-role { font-size: 13px; color: var(--muted); margin-top: 2px; }
.dp-stage-badge {
  padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 500;
  letter-spacing: 0.5px;
}

/* ── CONTROLS ── */
.controls-row {
  display: flex; gap: 12px; padding: 20px 32px; background: var(--bg3);
  border-bottom: 1px solid var(--border);
}
.control-btn {
  flex: 1; padding: 16px 12px; border-radius: 14px;
  border: 1px solid; cursor: pointer; transition: all 0.2s;
  text-align: center; font-family: var(--sans);
}
.control-btn:hover { transform: translateY(-1px); }
.ctrl-icon { font-size: 20px; margin-bottom: 6px; }
.ctrl-name { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
.ctrl-desc { font-size: 10px; margin-top: 3px; opacity: 0.7; }

/* ── DEPTH CURVE ── */
.depth-section { padding: 24px 32px; border-bottom: 1px solid var(--border); }
.depth-stages { display: flex; gap: 0; align-items: stretch; }
.depth-stage {
  flex: 1; padding: 16px 18px; position: relative;
  border-right: 1px solid var(--border);
}
.depth-stage:last-child { border-right: none; }
.ds-marker { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ds-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ds-days { font-size: 10px; color: var(--muted); letter-spacing: 1px; }
.ds-label { font-family: var(--serif); font-size: 15px; font-weight: 500; color: var(--cream); margin-bottom: 4px; }
.ds-desc { font-size: 11px; color: var(--muted); line-height: 1.5; }
.ds-check { margin-top: 10px; font-size: 10px; letter-spacing: 0.5px; }

/* ── ACTIVITY LOG ── */
.activity-section { padding: 24px 32px; }
.activity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.activity-title { font-family: var(--serif); font-size: 18px; color: var(--cream); }
.activity-tag {
  font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(255,245,225,0.05); border: 1px solid var(--border);
  color: var(--muted);
}
.activity-items { display: flex; flex-direction: column; gap: 2px; }
.activity-item {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 12px 16px; border-radius: 10px;
  transition: background 0.15s; cursor: default;
}
.activity-item:hover { background: var(--bg3); }
.ai-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.ai-body { flex: 1; min-width: 0; }
.ai-text { font-size: 12px; color: var(--muted); line-height: 1.55; }
.ai-time { font-size: 10px; color: var(--muted2); margin-top: 3px; }
.level-0 { background: rgba(78,205,196,0.08); }
.level-1 { background: rgba(123,158,201,0.08); }
.level-2 { background: rgba(232,168,56,0.08); }
.level-3 { background: rgba(232,168,56,0.12); }
.level-4 { background: rgba(220,80,60,0.1); }

/* ── GRAPH PANEL ── */
.graph-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 0 32px 24px; }
.graph-card {
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 18px;
}
.gc-val { font-family: var(--serif); font-size: 32px; font-weight: 400; line-height: 1; }
.gc-lbl { font-size: 10px; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }

/* ── HOUSEHOLD NETWORK VIEW ── */
.network-view { padding: 20px 0; }
.network-title { font-family: var(--serif); font-size: 20px; color: var(--cream); margin-bottom: 20px; }
.relay-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.relay-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; padding: 18px 20px;
}
.relay-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.relay-tag {
  font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
  padding: 3px 9px; border-radius: 10px; font-weight: 500;
}
.relay-title { font-family: var(--serif); font-size: 16px; color: var(--cream); }
.relay-body { font-size: 12px; color: var(--muted); line-height: 1.6; }

/* ── PHILOSOPHY VIEW ── */
.philosophy-view { }
.phil-hero {
  background: linear-gradient(135deg, var(--bg2), var(--bg3));
  border: 1px solid var(--border); border-radius: 20px;
  padding: 48px; text-align: center; margin-bottom: 24px;
}
.phil-headline {
  font-family: var(--serif); font-size: 38px; font-weight: 300;
  color: var(--cream); line-height: 1.3; margin-bottom: 16px;
}
.phil-sub { font-size: 14px; color: var(--muted); max-width: 520px; margin: 0 auto; line-height: 1.7; }
.compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.compare-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; padding: 24px;
}
.compare-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
.compare-title { font-family: var(--serif); font-size: 20px; color: var(--cream); margin-bottom: 14px; }
.compare-item {
  display: flex; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid var(--border); font-size: 12px; color: var(--muted);
}
.compare-item:last-child { border-bottom: none; }
.compare-item strong { color: var(--text); }

/* ── LIVE FEED TAB ── */
.live-feed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.live-panel {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 16px; padding: 22px 24px;
}
.live-panel-title {
  font-family: var(--serif); font-size: 17px; color: var(--cream);
  margin-bottom: 16px;
}

/* ── TOAST ── */
.toast-banner {
  position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
  z-index: 300; padding: 12px 24px; border-radius: 12px;
  background: rgba(220,80,60,0.92); border: 1px solid rgba(220,80,60,0.5);
  color: #fff; font-size: 13px; font-family: var(--sans);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  animation: toastIn 0.25s ease;
  max-width: 480px; text-align: center;
}
@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

/* ── PULSE DOT VARIANTS ── */
.pulse-dot-amber { width: 7px; height: 7px; border-radius: 50%; background: var(--amber); animation: breathe 2s ease-in-out infinite; }

/* ── SCROLL ── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 3px; }

/* ── MODAL OVERLAY ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px); z-index: 200;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal {
  background: var(--bg2); border: 1px solid var(--border2);
  border-radius: 20px; padding: 36px; max-width: 480px; width: 100%;
  text-align: center;
}
.modal-icon { font-size: 42px; margin-bottom: 16px; }
.modal-title { font-family: var(--serif); font-size: 26px; color: var(--cream); margin-bottom: 8px; }
.modal-body { font-size: 13px; color: var(--muted); line-height: 1.7; margin-bottom: 24px; }
.modal-btn {
  padding: 12px 32px; border-radius: 10px; border: 1px solid var(--border2);
  background: var(--bg3); color: var(--text); font-family: var(--sans);
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.modal-btn:hover { background: var(--bg4); }
`;

// ─── COMPANION CARD ───────────────────────────────────────────────────────────
function CompanionCard({ c, selected, onClick }) {
  const depthFilled = [c.days >= 1, c.days >= 30, c.days >= 90, c.days >= 365];

  return (
    <div
      className={`companion-card ${selected ? "selected" : ""}`}
      style={{ "--c-ring": c.ring, "--c-glow": c.glow }}
      onClick={onClick}
    >
      <div className="cc-top">
        <div className="cc-orb-wrap">
          <div className="cc-orb breathing"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${c.color}30, ${c.color}0a)`,
              border: `1.5px solid ${c.color}55`,
              color: c.color,
              "--c-glow": c.glow,
            }}>
            {c.greek}
          </div>
          <div className="cc-meta">
            <div className="cc-greek">{c.name} COMPANION</div>
            <div className="cc-name">{c.paired}</div>
            <div className="cc-role">{c.role}</div>
          </div>
        </div>

        <div className="cc-paired">
          <div className="cc-paired-dot" style={{ background: c.color }} />
          <span>Day {c.days} · {c.stage}</span>
        </div>

        <div className="cc-stats">
          <div className="cc-stat">
            <div className="cc-stat-val" style={{ color: c.color }}>{c.eventsProcessed ?? 0}</div>
            <div className="cc-stat-lbl">Processed</div>
          </div>
          <div className="cc-stat">
            <div className="cc-stat-val" style={{ color: c.color }}>{c.trustedContacts ?? 0}</div>
            <div className="cc-stat-lbl">Trusted</div>
          </div>
          <div className="cc-stat">
            <div className="cc-stat-val" style={{ color: "#DC503C" }}>{c.blockedContacts ?? 0}</div>
            <div className="cc-stat-lbl">Blocked</div>
          </div>
        </div>
      </div>

      {/* Depth bar */}
      <div className="depth-row">
        {depthFilled.map((filled, i) => (
          <div key={i} className={`depth-seg ${filled ? "filled" : ""}`}
            style={{ background: filled ? c.color : undefined, opacity: filled ? 1 : 0.15 }} />
        ))}
      </div>

      <div className="cc-bottom">
        <div className="cc-last-label">Last silent action</div>
        <div className="cc-last-text">
          {c.lastActionText.length > 72
            ? c.lastActionText.slice(0, 72) + "…"
            : c.lastActionText}
        </div>
        <div className="cc-time">{c.lastAction}</div>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ c, onControl }) {
  const levelColors = ["#4ECDC4", "#7B9EC9", "#E8A838", "#E8A838", "#DC503C"];
  const levelBgs = [
    "rgba(78,205,196,0.08)", "rgba(123,158,201,0.08)",
    "rgba(232,168,56,0.1)", "rgba(232,168,56,0.13)", "rgba(220,80,60,0.1)"
  ];

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="dp-header">
        <div className="dp-orb" style={{
          background: `radial-gradient(circle at 35% 35%, ${c.color}28, ${c.color}08)`,
          border: `1.5px solid ${c.color}44`, color: c.color
        }}>{c.greek}</div>
        <div className="dp-title-block">
          <div className="dp-super">{c.name} COMPANION · {c.role}</div>
          <div className="dp-name">Paired with {c.paired}</div>
          <div className="dp-role">Day {c.days} of relationship · {c.age}</div>
        </div>
        <div className="dp-stage-badge" style={{
          background: `${c.color}15`, border: `1px solid ${c.color}35`, color: c.color
        }}>{c.stage}</div>
      </div>

      {/* 3 Controls */}
      <div className="controls-row">
        {[
          { key: "navigate", icon: "🔍", name: "NAVIGATE", desc: "Verify a contact or link", color: c.color, bg: `${c.color}12`, bd: `${c.color}35` },
          { key: "emergency", icon: "🚨", name: "EMERGENCY", desc: "Full coordinated response", color: "#DC503C", bg: "rgba(220,80,60,0.1)", bd: "rgba(220,80,60,0.3)" },
          { key: "callhome", icon: "📞", name: "CALL HOME", desc: "Verify family voice print", color: "#4ECDC4", bg: "rgba(78,205,196,0.08)", bd: "rgba(78,205,196,0.3)" },
        ].map(btn => (
          <div key={btn.key} className="control-btn" onClick={() => onControl(btn)}
            style={{ background: btn.bg, borderColor: btn.bd, color: btn.color }}>
            <div className="ctrl-icon">{btn.icon}</div>
            <div className="ctrl-name">{btn.name}</div>
            <div className="ctrl-desc" style={{ color: btn.color + "aa" }}>{btn.desc}</div>
          </div>
        ))}
      </div>

      {/* Graph Stats */}
      <div className="graph-panel">
        {[
          { val: c.graph.trusted, lbl: "Trusted Contacts", color: "#4ECDC4" },
          { val: c.graph.monitored, lbl: "Under Monitoring", color: c.color },
          { val: c.graph.blocked, lbl: "Blocked All-Time", color: "#DC503C" },
        ].map((g, i) => (
          <div key={i} className="graph-card">
            <div className="gc-val" style={{ color: g.color }}>{g.val}</div>
            <div className="gc-lbl">{g.lbl}</div>
          </div>
        ))}
      </div>

      {/* Depth Curve */}
      <div className="depth-section">
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 14 }}>Companion Depth Curve</div>
        <div className="depth-stages">
          {DEPTH_STAGES.map((s, i) => {
            const reached = c.days >= [1, 30, 90, 365][i];
            const current = c.stageIdx === i;
            return (
              <div key={i} className="depth-stage" style={{ background: current ? `${s.color}09` : undefined }}>
                <div className="ds-marker">
                  <div className="ds-dot" style={{ background: reached ? s.color : "var(--muted2)" }} />
                  <span className="ds-days">{s.days}</span>
                </div>
                <div className="ds-label" style={{ color: reached ? "var(--cream)" : "var(--muted2)" }}>{s.label}</div>
                <div className="ds-desc">{s.desc}</div>
                <div className="ds-check" style={{ color: reached ? s.color : "var(--muted2)" }}>
                  {current ? "▸ Current stage" : reached ? "✓ Achieved" : "○ Ahead"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div className="activity-section">
        <div className="activity-header">
          <div className="activity-title">Silent Activity Log</div>
          <div className="activity-tag">Pull only · Never pushed</div>
        </div>
        <div className="activity-items">
          {c.recentActivity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="ai-icon" style={{ background: levelBgs[a.level] }}>{a.icon}</div>
              <div className="ai-body">
                <div className="ai-text">{a.text}</div>
                <div className="ai-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HOUSEHOLD NETWORK VIEW ───────────────────────────────────────────────────
function NetworkView({ householdId }) {
  return (
    <div className="network-view">
      <div className="relay-grid">
        {[
          {
            tag: "Household Signal", tagColor: "#7B9EC9", tagBg: "rgba(123,158,201,0.12)",
            title: "Cross-Companion Coordination",
            items: [
              "SENTINEL detected a coordinated attack (email + SMS + data re-listing) within 90 min — elevated ANCHOR and SCOUT to heightened monitoring automatically",
              "ANCHOR's deepfake intercept pattern shared as anonymized threat signature to all household companions",
              "No raw data crosses between companions — only non-attributable threat patterns"
            ]
          },
          {
            tag: "Parent Relay", tagColor: "#E8A838", tagBg: "rgba(232,168,56,0.12)",
            title: "SCOUT → Taylor Escalation Rules",
            items: [
              "Level 4 only: Confirmed predatory contact with secrecy language",
              "Level 4 only: Deepfake imagery of Alex detected in circulation",
              "Level 3+: Coordinated synthetic account swarm targeting Alex",
              "Never relayed: Normal social communications or low-signal anomalies"
            ]
          },
          null, // replaced by <BrokerStatus> below
          {
            tag: "Privacy Architecture", tagColor: "#9B7FD4", tagBg: "rgba(155,127,212,0.1)",
            title: "What CORTEGE Never Sees",
            items: [
              "Behavioral profiles live on-device only — no CORTEGE servers hold learned data",
              "Voice prints encrypted with device-derived key — CORTEGE cannot access them",
              "Alex's behavioral data is never shared with Taylor's companion, even anonymized",
              "One-tap full deletion available at any time — companion resets to Day 1"
            ]
          },
        ].filter(Boolean).map((r, i) => (
          <div key={i} className="relay-card">
            <div className="relay-header">
              <span className="relay-tag" style={{ background: r.tagBg, color: r.tagColor, border: `1px solid ${r.tagColor}30` }}>{r.tag}</span>
            </div>
            <div className="relay-title" style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--cream)", marginBottom: 12 }}>{r.title}</div>
            <div className="relay-body">
              {r.items.map((item, j) => (
                <div key={j} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 12, color: "var(--muted)" }}>
                  <span style={{ color: r.tagColor, flexShrink: 0 }}>·</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <BrokerStatus householdId={householdId} />
      </div>
    </div>
  );
}

// ─── PHILOSOPHY VIEW ──────────────────────────────────────────────────────────
function PhilosophyView() {
  return (
    <div className="philosophy-view">
      <div className="phil-hero">
        <div className="phil-headline">
          The best protection is the<br />
          <em>kind you never notice.</em>
        </div>
        <div className="phil-sub">
          CORTEGE doesn't hand you a threat feed and ask you to act.
          It works in the background, continuously, without asking for your attention.
          Its success metric is the opposite of every other app on your phone.
        </div>
      </div>

      <div className="compare-grid">
        <div className="compare-card">
          <div className="compare-label" style={{ color: "var(--muted)" }}>Alert Model</div>
          <div className="compare-title">The Security Dashboard</div>
          {[
            ["Your role", "Informed decision-maker"],
            ["Interface", "Full dashboard, threat feed, notifications"],
            ["Value moment", "When a threat is detected"],
            ["Family model", "One account, sub-profiles"],
            ["Personalization", "Account-level settings"],
            ["Relationship", "Flat — same on day 1 and day 365"],
          ].map(([k, v]) => (
            <div key={k} className="compare-item">
              <strong style={{ width: 130, flexShrink: 0 }}>{k}</strong>
              <span>{v}</span>
            </div>
          ))}
        </div>

        <div className="compare-card" style={{ borderColor: "rgba(78,205,196,0.2)" }}>
          <div className="compare-label" style={{ color: "#4ECDC4" }}>Companion Model</div>
          <div className="compare-title" style={{ fontFamily: "var(--serif)" }}>The Silent Escort</div>
          {[
            ["Your role", "Protected without involvement"],
            ["Interface", "Three controls only: Navigate, Emergency, Call Home"],
            ["Value moment", "Continuously — you never experience the threat"],
            ["Family model", "Each person paired with their own companion"],
            ["Personalization", "Deep behavioral memory — grows over time"],
            ["Relationship", "Deepens daily — Day 365 is radically safer than Day 1"],
          ].map(([k, v]) => (
            <div key={k} className="compare-item" style={{ borderBottomColor: "rgba(78,205,196,0.1)" }}>
              <strong style={{ width: 130, flexShrink: 0, color: "var(--text)" }}>{k}</strong>
              <span style={{ color: "#4ECDC4cc" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: "24px 28px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--muted)", lineHeight: 1.8, fontStyle: "italic" }}>
          "For your teenager, it's a watchful presence that keeps fake accounts and predatory contacts away from their social world.
          For your parents, it's the reason the grandparent scam call never gets through.
          For you, it's the reason you've never needed to use it. That's the point."
        </div>
      </div>
    </div>
  );
}

// ─── CONTROL MODAL ────────────────────────────────────────────────────────────
const CONTROL_MODALS = {
  navigate: {
    icon: "🔍",
    title: "NAVIGATE",
    body: "Drop a URL, phone number, or account handle. Your Companion will verify it silently and return a single verdict — safe or not safe. No explanation. No details. Just the answer you need."
  },
  emergency: {
    icon: "🚨",
    title: "EMERGENCY",
    body: "One tap activates full coordinated response across all agents: evidence capture, financial institution contact, household Companion alert, and local emergency services option. Everything starts simultaneously."
  },
  callhome: {
    icon: "📞",
    title: "CALL HOME",
    body: "Your Companion verifies the outbound connection is reaching the real person — using their enrolled voice print — before completing the call. Deepfake voice attacks often happen when someone is already scared."
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Formats an ISO timestamp as relative time */
function timeAgo(isoString) {
  if (!isoString) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 172800) return 'Yesterday';
  return `${Math.floor(seconds / 86400)} days ago`;
}

/** Maps event type to an emoji icon */
function eventTypeIcon(type) {
  const icons = {
    inbound_call: '📞',
    inbound_sms: '💬',
    inbound_email: '✉️',
    financial_transaction: '💳',
    contact_request: '👤',
    login_attempt: '🔐',
  };
  return icons[type] ?? '📋';
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function Cortege() {
  const [tab, setTab] = useState("household");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [showHouseholdSelector, setShowHouseholdSelector] = useState(false);

  // Household context
  const { currentHouseholdId, setCurrentHouseholdId } = useHouseholdContext();

  // API data
  const {
    household,
    companions,
    liveEvents,
    wsConnected,
    loading,
    error,
    toast,
    processingStates,
  } = useCortegeData();

  // Detail panel data
  const { activity, loading: detailLoading } = useCompanionDetail(selectedId);

  // Find selected companion from API data
  const selected = selectedId ? companions.find(c => c.id === selectedId) : null;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setSelectedId(null);
  }, [currentHouseholdId]);

  const totalEventsProcessed = companions.reduce((s, c) => s + (c.eventsProcessed ?? 0), 0);

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* NAV */}
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-wordmark">CORTEGE</div>
            <div className="nav-badge">COMPANIONS</div>
          </div>
          <div className="nav-tabs">
            {[
              { id: "household", label: "Household" },
              { id: "network", label: "Companion Network" },
              { id: "philosophy", label: "The Model" },
              { id: "livefeed", label: "Live Feed" },
            ].map(t => (
              <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} data-testid={`tab-${t.id}`} onClick={() => { setTab(t.id); setSelectedId(null); }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="nav-status">
            <button
              onClick={() => setShowHouseholdSelector(!showHouseholdSelector)}
              data-testid="btn-switch-household"
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border2)',
                background: 'var(--bg3)', color: 'var(--muted)', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: 0.5, marginRight: 12,
              }}
            >
              Switch Household
            </button>
            <div className={wsConnected ? "pulse-dot" : "pulse-dot-amber"} />
            <span>{wsConnected ? "All companions active" : "Backend offline"}</span>
            <span style={{ marginLeft: 8, color: "var(--muted2)" }}>{time}</span>
          </div>
        </nav>

        <div className="main">

          {tab === "household" && (
            <>
              {loading ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", fontSize: 13 }}>
                  Connecting to CORTEGE backend...
                </div>
              ) : error ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", fontSize: 13 }}>
                  {error} — start the backend with <code style={{ color: "var(--amber)" }}>npm run server</code>
                </div>
              ) : (
                <>
                  <div className="household-bar" data-testid="household-bar">
                    <div className="hh-left">
                      <div className="hh-crest">🏠</div>
                      <div>
                        <div className="hh-name" data-testid="household-name">{household?.name ?? 'Household'}</div>
                        <div className="hh-sub">
                          {household?.location ?? ''}{household?.location ? ' · ' : ''}
                          Cortege since {household?.created ? new Date(household.created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="hh-stats">
                      <div className="hh-stat">
                        <div className="hh-stat-val">{companions.length}</div>
                        <div className="hh-stat-lbl">Companions</div>
                      </div>
                      <div className="hh-stat">
                        <div className="hh-stat-val">{totalEventsProcessed}</div>
                        <div className="hh-stat-lbl">Events processed</div>
                      </div>
                      <div className="hh-stat">
                        <div className="hh-stat-val" style={{ color: "#4ECDC4" }}>0</div>
                        <div className="hh-stat-lbl">Reached family</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-eyebrow">
                    Companion Agents — {companions.length} active
                  </div>

                  {companions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>
                      No companions loaded yet. Run a scenario from the Live Feed tab.
                    </div>
                  ) : (
                    <div className="companion-grid" data-testid="companion-grid">
                      {companions.map(c => {
                        const display = getAgentDisplay(c.agentName);
                        const days = c.createdAt ? Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000) : 0;
                        return (
                          <CompanionCard
                            key={c.id}
                            c={{
                              ...c,
                              name: c.agentName?.toUpperCase() ?? c.id,
                              role: c.agentRole ?? c.agentName,
                              greek: c.designation ?? '',
                              paired: c.memberName ?? '',
                              color: display.color,
                              glow: display.glow,
                              ring: display.ring,
                              stage: formatStageName(c.stage),
                              stageIdx: getStageIndex(c.stage),
                              days,
                              lastAction: c.lastAction?.timestamp ? timeAgo(c.lastAction.timestamp) : 'No activity yet',
                              lastActionText: c.lastAction?.text ?? 'Waiting for events...',
                              eventsProcessed: c.eventsProcessed ?? 0,
                              trustedContacts: c.trustedContactCount ?? 0,
                              blockedContacts: c.blockedContactCount ?? 0,
                              threatLevel: c.lastAction?.threatLevel ?? 0,
                              graph: {
                                trusted: c.trustedContactCount ?? 0,
                                monitored: 0,
                                blocked: c.blockedContactCount ?? 0,
                              },
                              depth: {
                                day30: getStageIndex(c.stage) >= 1,
                                day90: getStageIndex(c.stage) >= 2,
                                day365: getStageIndex(c.stage) >= 3,
                              },
                            }}
                            selected={selectedId === c.id}
                            onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {selected && (
                    <div data-testid="detail-panel">
                      <DetailPanel
                        c={{
                          ...selected,
                          name: selected.agentName?.toUpperCase() ?? selected.id,
                          role: selected.agentRole ?? selected.agentName,
                          greek: selected.designation ?? '',
                          paired: selected.memberName ?? '',
                          age: '',
                          days: selected.createdAt ? Math.floor((Date.now() - new Date(selected.createdAt).getTime()) / 86400000) : 0,
                          ...getAgentDisplay(selected.agentName),
                          stage: formatStageName(selected.stage),
                          stageIdx: getStageIndex(selected.stage),
                          recentActivity: detailLoading ? [] : activity.map(evt => ({
                            time: timeAgo(evt.timestamp),
                            icon: eventTypeIcon(evt.type),
                            text: evt.payload?.assessment ?? evt.payload?.description ?? `${evt.type} event`,
                            level: evt.payload?.threat_level ?? 0,
                          })),
                          graph: {
                            trusted: selected.trustedContactCount ?? 0,
                            monitored: 0,
                            blocked: selected.blockedContactCount ?? 0,
                          },
                        }}
                        onControl={(btn) => setModal(CONTROL_MODALS[btn.key])}
                      />
                      <div style={{
                        background: "var(--bg2)", border: "1px solid var(--border)",
                        borderRadius: 20, padding: "24px 32px", marginBottom: 36,
                      }}>
                        <MemoryViewer
                          companionId={selectedId}
                          companionName={selected.agentName?.toUpperCase()}
                        />
                      </div>
                    </div>
                  )}

                  {!selected && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted2)", fontSize: 12, letterSpacing: 1 }}>
                      Select a companion above to view their activity log
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === "network" && (
            <>
              <div className="section-eyebrow">Household Signal Layer</div>
              <div className="section-title">How the Companions work together</div>
              <NetworkView householdId={currentHouseholdId} />
            </>
          )}

          {tab === "philosophy" && (
            <>
              <div className="section-eyebrow">Product Philosophy</div>
              <div className="section-title">Why Companions, Not Alerts</div>
              <PhilosophyView />
            </>
          )}

          {tab === "livefeed" && (
            <>
              <div className="section-eyebrow">Real-Time Backend</div>
              <div className="section-title">Live Feed</div>

              <div className="live-feed-grid">
                <div className="live-panel">
                  <div className="live-panel-title">Event Stream</div>
                  <EventFeed events={liveEvents} wsConnected={wsConnected} />
                </div>
                <div className="live-panel">
                  <div className="live-panel-title">Agent Status</div>
                  <AgentStatus
                    companions={companions.map(c => ({
                      ...c,
                      instanceId: c.id,
                      name: c.agentName?.toUpperCase(),
                      stage: formatStageName(c.stage),
                    }))}
                    processingStates={processingStates}
                  />
                </div>
              </div>

              <div className="live-feed-grid">
                <div className="live-panel">
                  <div className="live-panel-title">Scenario Runner</div>
                  <ScenarioRunner />
                </div>
                <div className="live-panel">
                  <div className="live-panel-title">Event Injector</div>
                  <EventInjector members={household?.members ?? []} />
                </div>
              </div>

              <div className="live-panel" style={{ marginBottom: 24 }}>
                <div className="live-panel-title">Household Fraud Case</div>
                <FraudCasePanel household={household} />
              </div>
            </>
          )}
        </div>
      </div>

      {showHouseholdSelector && (
        <div className="modal-overlay" data-testid="modal-household-selector" onClick={() => setShowHouseholdSelector(false)}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 20, padding: 28, maxWidth: 420, width: '100%',
            maxHeight: '80vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <HouseholdSelector
              currentHouseholdId={currentHouseholdId}
              onSelect={(id) => {
                setSelectedId(null);
                setCurrentHouseholdId(id);
                setShowHouseholdSelector(false);
              }}
            />
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">{modal.icon}</div>
            <div className="modal-title">{modal.title}</div>
            <div className="modal-body">{modal.body}</div>
            <button className="modal-btn" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-banner">{toast}</div>
      )}
    </>
  );
}
