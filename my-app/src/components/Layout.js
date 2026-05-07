import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { logout as authLogout, getDecodedToken } from "../utils/authHelper";

const NAV_LABELS = {
  "/": "Home",
  "/profile": "Profile",
  "/admin": "Admin Dashboard",
  "/schooladmin": "School Dashboard",
  "/schooladmin/pending-users": "User Approvals",
  "/schooladmin/classrooms": "Classrooms",
  "/schooladmin/subjects": "Subjects",
  "/schooladmin/assign-subject": "Teaching Assignments",
  "/schooladmin/enrollments": "Enrollments",
  "/schooladmin/timetables": "Master Timetable",
  "/schooladmin/substitutions": "Daily Substitutions",
  "/schooladmin/calendar": "School Calendar",
  "/schooladmin/syllabus": "Syllabus Hub",
  "/schooladmin/exams": "Exam Schedules",
  "/schooladmin/marks": "Marks Register",
  "/schooladmin/attendance": "Attendance",
  "/schooladmin/assignments": "Assignments",
  "/schooladmin/transport": "Transport Management",
  "/schooladmin/student-transport": "Student Transport",
  "/teacher": "Teacher Dashboard",
  "/teacher/attendance": "Attendance",
  "/teacher/assignments": "Assignments",
  "/teacher/syllabus": "Syllabus",
  "/teacher/teaching-logs": "Teaching Logs",
  "/teacher/exams": "Exams",
  "/teacher/marks": "Marks Entry",
  "/student": "Student Dashboard",
  "/student/timetable": "My Timetable",
  "/student/exams": "My Exams",
  "/student/marks": "My Marks",
  "/student/assignments": "Assignments",
  "/student/attendance": "Attendance",
  "/student/syllabus": "Syllabus",
  "/student/substitutions": "Substitutions",
  "/student/practice": "Practice Zone",
  "/student/bus-tracking": "Bus Tracking",
  "/driver/portal": "Driver Portal",
};

const ROLE_CONFIGS = {
  SCHOOLADMIN: { color: "#60a5fa", label: "School Admin", emoji: "🏫" },
  TEACHER:     { color: "#a78bfa", label: "Teacher",      emoji: "📚" },
  STUDENT:     { color: "#34d399", label: "Student",      emoji: "🎓" },
  DRIVER:      { color: "#fb923c", label: "Driver",       emoji: "🚌" },
  ADMIN:       { color: "#f472b6", label: "Admin",        emoji: "🛡️" },
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const decoded = getDecodedToken();
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());

  const userRole = decoded?.role || "";
  const config = ROLE_CONFIGS[userRole] || { color: "#60a5fa", label: userRole, emoji: "👤" };

  const pageLabel = NAV_LABELS[location.pathname] ||
    location.pathname.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" › ");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "var(--bg-primary)",
      fontFamily: "var(--font-sans)",
    }}>
      <Sidebar />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Top Header Bar ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 300,
          height: 60,
          display: "flex", alignItems: "center",
          padding: "0 28px",
          gap: 16,
          background: scrolled
            ? "var(--glass-bg-heavy)"
            : "var(--surface-1)",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: "1px solid var(--border-subtle)",
          boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
          transition: "all 0.25s ease",
        }}>
          {/* Spacer for hamburger */}
          <div style={{ width: 54, flexShrink: 0 }} />

          {/* Breadcrumb / Page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: config.color,
                boxShadow: `0 0 8px ${config.color}`,
                flexShrink: 0,
              }} />
              <h1 style={{
                fontSize: 15, fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0, letterSpacing: "-0.01em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{pageLabel}</h1>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>

            {/* Clock */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              padding: "5px 12px", borderRadius: 8,
              background: "var(--surface-2)",
              border: "1px solid var(--border-subtle)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, fontFamily: "var(--font-mono)" }}>{timeStr}</span>
              <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 500 }}>{dateStr}</span>
            </div>

            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 8,
                background: "var(--surface-2)", border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-3)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back
            </button>

            {/* Role badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px 6px 8px", borderRadius: 8,
              background: `${config.color}12`,
              border: `1px solid ${config.color}25`,
            }}>
              <span style={{ fontSize: 14 }}>{config.emoji}</span>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500, lineHeight: 1 }}>Signed in as</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: config.color, lineHeight: 1.3 }}>{config.label}</div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={authLogout}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8,
                background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.18)",
                color: "#fb7185", fontSize: 12.5, fontWeight: 700,
                cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.14)"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,63,94,0.08)"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.18)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main
          className="fade-in"
          style={{
            flex: 1,
            padding: "32px 28px",
            maxWidth: 1320,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </main>

        {/* ── Footer ── */}
        <footer style={{
          padding: "14px 28px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface-1)",
        }}>
          <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontWeight: 500 }}>
            © 2026 NexusEdu Platform — All rights reserved
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontWeight: 500 }}>System Operational</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
