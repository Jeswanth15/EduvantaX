import React, { useState, useEffect } from "react";
import { getUserRole, getUserName } from "../utils/authHelper";

const STAT_CARDS = [
  {
    icon: "🏫",
    label: "Total Schools",
    value: "12",
    delta: "+2 this month",
    deltaUp: true,
    grad: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    glow: "rgba(37,99,235,0.3)",
  },
  {
    icon: "👥",
    label: "Active Users",
    value: "3,842",
    delta: "+148 this week",
    deltaUp: true,
    grad: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    glow: "rgba(124,58,237,0.3)",
  },
  {
    icon: "🖥️",
    label: "System Uptime",
    value: "99.97%",
    delta: "Last 30 days",
    deltaUp: true,
    grad: "linear-gradient(135deg, #059669, #047857)",
    glow: "rgba(5,150,105,0.3)",
  },
  {
    icon: "⚠️",
    label: "Active Alerts",
    value: "3",
    delta: "2 critical",
    deltaUp: false,
    grad: "linear-gradient(135deg, #f59e0b, #d97706)",
    glow: "rgba(245,158,11,0.3)",
  },
];

const TOOLS = [
  {
    icon: "🗄️",
    title: "Database Management",
    desc: "View and manage raw system data, run diagnostics, and export reports.",
    action: "Manage →",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.18)",
  },
  {
    icon: "⚙️",
    title: "System Settings",
    desc: "Configure global application parameters, feature flags, and integrations.",
    action: "Configure →",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.18)",
  },
  {
    icon: "🔐",
    title: "Security Audit",
    desc: "Review system logs, user access patterns, and security patches.",
    action: "Audit Logs →",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.18)",
  },
  {
    icon: "📊",
    title: "Analytics Hub",
    desc: "Cross-school usage reports, engagement metrics, and data exports.",
    action: "View Reports →",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.18)",
  },
  {
    icon: "📧",
    title: "Notifications",
    desc: "Manage system-wide email templates, push alerts, and digest settings.",
    action: "Configure →",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.18)",
  },
  {
    icon: "🔄",
    title: "Backup & Recovery",
    desc: "Schedule automated backups, restore points, and disaster recovery.",
    action: "Manage →",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.18)",
  },
];

const StatCard = ({ icon, label, value, delta, deltaUp, grad, glow, delay }) => {
  const [displayed, setDisplayed] = useState(0);
  const target = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  const isNumeric = !isNaN(target) && target > 1;

  useEffect(() => {
    if (!isNumeric) return;
    let start = null;
    const dur = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setDisplayed(Math.round(target * ease));
      if (prog < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), delay || 0);
    return () => clearTimeout(t);
  }, [target, delay, isNumeric]);

  const displayVal = isNumeric
    ? value.includes(",")
      ? displayed.toLocaleString()
      : value.includes("%")
        ? value
        : displayed
    : value;

  return (
    <div style={{
      background: grad, borderRadius: 20,
      padding: "24px 22px",
      boxShadow: `0 12px 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
      display: "flex", flexDirection: "column", gap: 12,
      position: "relative", overflow: "hidden",
      animation: `pageEnter 0.5s var(--ease-out) ${delay || 0}ms both`,
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 90, height: 90, borderRadius: "50%",
        background: "rgba(255,255,255,0.07)",
      }} />
      <div style={{
        position: "absolute", bottom: -30, right: 20,
        width: 60, height: 60, borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
      }} />

      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>

      <div>
        <div style={{
          fontSize: 32, fontWeight: 900, color: "white",
          lineHeight: 1, letterSpacing: "-0.04em",
          fontFamily: "'Outfit', sans-serif",
        }}>{displayVal}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginTop: 4 }}>{label}</div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 99,
        background: "rgba(255,255,255,0.12)",
        width: "fit-content",
      }}>
        <span style={{ fontSize: 11, color: "white", opacity: 0.9, fontWeight: 600 }}>
          {deltaUp ? "▲" : "▼"} {delta}
        </span>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const role = getUserRole();
  const name = getUserName();
  const [hoveredTool, setHoveredTool] = useState(null);

  if (role !== "ADMIN") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: 400, gap: 16, textAlign: "center",
      }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Access Denied</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Hero Welcome Banner ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        borderRadius: 24, padding: "40px 44px", marginBottom: 36,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: -40, right: 80, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.15) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: 100, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(244,114,182,0.25), rgba(244,114,182,0.1))",
            border: "1.5px solid rgba(244,114,182,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, boxShadow: "0 8px 24px rgba(244,114,182,0.3)",
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(244,114,182,0.8)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>System Administrator</div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.03em", fontFamily: "'Outfit', sans-serif" }}>
              Welcome back, {name || "Administrator"}
            </h1>
            <p style={{ color: "rgba(148,163,184,0.8)", fontSize: 14, margin: "6px 0 0", fontWeight: 400 }}>
              You have full access to system backend. All actions are logged and audited.
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ color: "#34d399", fontSize: 12.5, fontWeight: 600 }}>All systems operational</span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-cols-4">
        {STAT_CARDS.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 80} />
        ))}
      </div>

      {/* ── Tools Grid ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>System Tools</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>Configure, monitor, and maintain the platform</p>
          </div>
        </div>

        <div className="grid-cols-3">
          {TOOLS.map((tool, i) => (
            <div
              key={tool.title}
              onMouseEnter={() => setHoveredTool(i)}
              onMouseLeave={() => setHoveredTool(null)}
              style={{
                background: hoveredTool === i ? tool.bg : "var(--surface-1)",
                border: `1px solid ${hoveredTool === i ? tool.border : "var(--border-light)"}`,
                borderRadius: 16, padding: "22px 22px 20px",
                transition: "all 0.25s ease",
                transform: hoveredTool === i ? "translateY(-3px)" : "translateY(0)",
                boxShadow: hoveredTool === i ? `0 12px 32px ${tool.border}` : "var(--shadow-sm)",
                cursor: "pointer",
                animation: `pageEnter 0.5s var(--ease-out) ${i * 60}ms both`,
              }}
            >
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 13,
                  background: hoveredTool === i ? `${tool.color}20` : "var(--surface-2)",
                  border: `1px solid ${hoveredTool === i ? tool.border : "var(--border-subtle)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, transition: "all 0.2s ease",
                  boxShadow: hoveredTool === i ? `0 4px 16px ${tool.border}` : "none",
                }}>{tool.icon}</div>
                {hoveredTool === i && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tool.color} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{tool.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.5 }}>{tool.desc}</p>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 7,
                background: hoveredTool === i ? `${tool.color}18` : "var(--surface-2)",
                border: `1px solid ${hoveredTool === i ? tool.border : "var(--border-subtle)"}`,
                color: hoveredTool === i ? tool.color : "var(--text-secondary)",
                fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans)", transition: "all 0.2s ease",
              }}>{tool.action}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
