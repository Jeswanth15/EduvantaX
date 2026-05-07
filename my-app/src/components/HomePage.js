import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole, getUserName, logout } from "../utils/authHelper";

const ROLE_META = {
  ADMIN:       { label: "Admin",        color: "#f472b6", bg: "rgba(244,114,182,0.12)", icon: "🛡️",  route: "/admin",         desc: "System Administration" },
  SCHOOLADMIN: { label: "School Admin", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: "🏫",  route: "/schooladmin",   desc: "School Management Portal" },
  PRINCIPAL:   { label: "Principal",    color: "#eab308", bg: "rgba(234,179,8,0.12)",   icon: "👩‍🏫", route: "/schooladmin",   desc: "School Management Portal" },
  TEACHER:     { label: "Teacher",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "📚",  route: "/teacher",       desc: "Teaching & Academics" },
  STUDENT:     { label: "Student",      color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: "🎓",  route: "/student",       desc: "Learning Dashboard" },
  DRIVER:      { label: "Driver",       color: "#fb923c", bg: "rgba(251,146,60,0.12)",  icon: "🚌",  route: "/driver/portal", desc: "Transport Portal" },
};

const ProgressRing = ({ pct = 75, color = "#60a5fa", size = 80 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProg(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - prog/100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const role = getUserRole();
  const name = getUserName();
  const [step, setStep] = useState(0); // 0=greeting, 1=loading, 2=redirecting
  const [dots, setDots] = useState("");
  const meta = ROLE_META[role?.toUpperCase()] || ROLE_META.STUDENT;

  useEffect(() => {
    if (!role) { navigate("/login"); return; }
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1800);
    const t3 = setTimeout(() => navigate(meta.route), 2600);
    return () => [t1,t2,t3].forEach(clearTimeout);
  }, [role, navigate, meta.route]);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length < 3 ? d + "." : ""), 450);
    return () => clearInterval(iv);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "20%", left: "15%",
        width: 360, height: 360, borderRadius: "50%",
        background: `radial-gradient(circle, ${meta.color}15 0%, transparent 70%)`,
        filter: "blur(50px)", pointerEvents: "none", animation: "float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "15%", right: "10%",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", animation: "float 10s ease-in-out infinite reverse",
      }} />

      {/* Main card */}
      <div style={{
        position: "relative",
        background: "var(--surface-1)",
        border: "1px solid var(--border-light)",
        borderRadius: 28,
        padding: "48px 44px",
        width: "100%", maxWidth: 480,
        boxShadow: "var(--shadow-xl)",
        animation: "scaleIn 0.5s var(--ease-spring) both",
        textAlign: "center",
        overflow: "hidden",
      }}>

        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 2,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
          borderRadius: "0 0 4px 4px",
        }} />

        {/* Role ring */}
        <div style={{
          position: "relative", width: 88, height: 88,
          margin: "0 auto 24px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ProgressRing pct={step >= 1 ? 100 : 20} color={meta.color} size={88} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: meta.bg, border: `1.5px solid ${meta.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
              boxShadow: `0 4px 16px ${meta.color}30`,
              animation: step >= 2 ? "pulse-glow 1s ease-in-out infinite" : "none",
            }}>
              {meta.icon}
            </div>
          </div>
        </div>

        {/* Greeting */}
        <p style={{ fontSize: 14, color: "var(--text-tertiary)", fontWeight: 500, marginBottom: 6 }}>
          {greeting} 👋
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.03em" }}>
          {name || "Welcome back"}
        </h1>

        {/* Role badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 99,
          background: meta.bg, border: `1px solid ${meta.color}30`,
          fontSize: 12.5, fontWeight: 700, color: meta.color,
          marginBottom: 36,
        }}>
          {meta.icon} {meta.label} · {meta.desc}
        </div>

        {/* Status */}
        <div style={{
          padding: "18px 24px",
          background: "var(--surface-2)",
          borderRadius: 14, border: "1px solid var(--border-subtle)",
          marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: step >= 2 ? meta.color : "#f59e0b",
              boxShadow: step >= 2 ? `0 0 8px ${meta.color}` : "0 0 8px #f59e0b",
              animation: "pulse-glow 1.5s ease-in-out infinite",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
              {step === 0 ? "Initializing session…" : step === 1 ? `Loading ${meta.label.toLowerCase()} dashboard${dots}` : `Redirecting to your portal${dots}`}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 4, background: "var(--border-light)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
              width: step === 0 ? "15%" : step === 1 ? "65%" : "100%",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: `0 0 8px ${meta.color}80`,
            }} />
          </div>
        </div>

        {/* Footer row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 20, borderTop: "1px solid var(--border-subtle)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "var(--text-tertiary)",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secured session
          </div>
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", color: "var(--text-tertiary)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-sans)", padding: "4px 8px", borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fb7185"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
