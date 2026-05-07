import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDecodedToken, logout } from "../utils/authHelper";
import { useTranslation } from "react-i18next";

const ROLE_CONFIGS = {
  SCHOOLADMIN: {
    color: "#60a5fa", glow: "rgba(96,165,250,0.25)",
    sections: [
      {
        label: "Management", icon: "⚙️", links: [
          { to: "/schooladmin", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { to: "/schooladmin/pending-users", label: "User Approvals", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M19 8v6M22 11h-6" },
          { to: "/schooladmin/classrooms", label: "Classrooms", icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
          { to: "/schooladmin/subjects", label: "Subjects", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
          { to: "/schooladmin/assign-subject", label: "Teaching Assignments", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
          { to: "/schooladmin/enrollments", label: "Enrollments", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
        ],
      },
      {
        label: "Academics", icon: "📖", links: [
          { to: "/schooladmin/timetables", label: "Timetables", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
          { to: "/schooladmin/substitutions", label: "Substitutions", icon: "M8 7h12m0 0-4-4m4 4-4 4M4 17h12m0 0-4-4m4 4-4 4" },
          { to: "/schooladmin/calendar", label: "Calendar", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
          { to: "/schooladmin/syllabus", label: "Syllabus Hub", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" },
          { to: "/schooladmin/exams", label: "Exam Schedules", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M12 12h.01M12 16h.01M8 12h.01M8 16h.01M16 12h.01" },
          { to: "/schooladmin/marks", label: "Marks Register", icon: "M9 12l2 2 4-4M7 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2M9 2h6v4H9z" },
          { to: "/schooladmin/attendance", label: "Attendance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM22 11l-4 4-2-2" },
          { to: "/schooladmin/assignments", label: "Assignments", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
        ],
      },
      {
        label: "Transport", icon: "🚌", links: [
          { to: "/schooladmin/transport", label: "Transport Mgmt", icon: "M8 6v6M15 6v6M2 12h19.6M18 18H2M5 18H2v-6l2-5h13l2 5v3M16.8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
          { to: "/schooladmin/student-transport", label: "Student Transport", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87" },
        ],
      },
    ],
  },
  TEACHER: {
    color: "#a78bfa", glow: "rgba(167,139,250,0.25)",
    sections: [
      {
        label: "Teaching", icon: "📚", links: [
          { to: "/teacher", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { to: "/teacher/attendance", label: "Attendance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" },
          { to: "/teacher/assignments", label: "Assignments", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8" },
          { to: "/teacher/syllabus", label: "Syllabus", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" },
          { to: "/teacher/teaching-logs", label: "Teaching Logs", icon: "M9 12h6M9 16h6M9 8h6M5 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" },
          { to: "/teacher/exams", label: "Exams", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M13 3h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" },
          { to: "/teacher/marks", label: "Marks Entry", icon: "M9 12l2 2 4-4M7 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2M9 2h6v4H9z" },
        ],
      },
    ],
  },
  STUDENT: {
    color: "#34d399", glow: "rgba(52,211,153,0.25)",
    sections: [
      {
        label: "My Learning", icon: "🎓", links: [
          { to: "/student", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { to: "/student/timetable", label: "My Timetable", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
          { to: "/student/exams", label: "My Exams", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" },
          { to: "/student/marks", label: "My Marks", icon: "M9 12l2 2 4-4M7 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" },
          { to: "/student/assignments", label: "Assignments", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
          { to: "/student/attendance", label: "My Attendance", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
          { to: "/student/syllabus", label: "View Syllabus", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" },
          { to: "/student/practice", label: "Practice Zone", icon: "M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3M6.343 6.343l-.707-.707M17.657 6.343l.707-.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M12 5a7 7 0 0 1 0 14 7 7 0 0 1 0-14z" },
          { to: "/student/bus-tracking", label: "Bus Tracking", icon: "M8 6v6M15 6v6M2 12h19.6M18 18H2M16.8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
        ],
      },
    ],
  },
  DRIVER: {
    color: "#fb923c", glow: "rgba(251,146,60,0.25)",
    sections: [
      {
        label: "Transport", icon: "🚌", links: [
          { to: "/driver/portal", label: "Driver Portal", icon: "M8 6v6M15 6v6M2 12h19.6M18 18H2M16.8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
        ],
      },
    ],
  },
  ADMIN: {
    color: "#f472b6", glow: "rgba(244,114,182,0.25)",
    sections: [
      {
        label: "System", icon: "🛡️", links: [
          { to: "/admin", label: "Admin Dashboard", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
        ],
      },
    ],
  },
};

const Sidebar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState("");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const decoded = getDecodedToken();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = decoded?.role || "";
  const schoolName = decoded?.schoolName || "EduPortal";
  const userName = decoded?.sub || decoded?.name || "User";
  const config = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.STUDENT;

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setIsOpen(false); // close drawer when resizing to desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On desktop sidebar is always visible; on mobile it's a drawer
  const sidebarVisible = isDesktop || isOpen;

  return (
    <>
      {/* Hamburger toggle — only on mobile */}
      {!isDesktop && (
        <button
          id="sidebar-toggle"
          onClick={() => setIsOpen(o => !o)}
          style={{
            position: "fixed", top: 16, left: 20, zIndex: 2100,
            width: 38, height: 38, borderRadius: 10,
            background: isOpen ? "rgba(37,99,235,0.9)" : "rgba(15,23,42,0.85)",
            backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)",
            color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s ease",
            boxShadow: isOpen ? "0 4px 16px rgba(37,99,235,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
          }}
          aria-label="Toggle navigation"
        >
          {isOpen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
      )}

      {/* Backdrop — only on mobile when open */}
      {!isDesktop && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1400,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
            animation: "fadeInOverlay 0.2s ease both",
          }}
        />
      )}

      {/* Sidebar panel */}
      <nav
        style={{
          position: isDesktop ? "sticky" : "fixed",
          top: 0,
          left: isDesktop ? 0 : (sidebarVisible ? 0 : -276),
          width: 276,
          height: isDesktop ? "100vh" : "100dvh",
          flexShrink: 0,
          background: "linear-gradient(180deg, #090e1a 0%, #0d1526 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          zIndex: isDesktop ? 100 : 1500,
          display: "flex", flexDirection: "column",
          transition: isDesktop ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: (!isDesktop && sidebarVisible) ? "8px 0 40px rgba(0,0,0,0.4)" : "none",
          overflowY: "auto", overflowX: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 20px 0",
          paddingTop: isDesktop ? 20 : 70,
        }}>
          {/* School badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 20,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${config.color}44, ${config.color}22)`,
              border: `1px solid ${config.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>
              🏫
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.5)", fontWeight: 500, marginBottom: 1 }}>Organization</div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: "white",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{schoolName}</div>
            </div>
          </div>

          {/* User pill */}
          <div
            onClick={() => { navigate("/profile"); setIsOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, cursor: "pointer",
              transition: "background 0.2s", marginBottom: 8,
              background: isActive("/profile") ? "rgba(255,255,255,0.07)" : "transparent",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = isActive("/profile") ? "rgba(255,255,255,0.07)" : "transparent"}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${config.color}, ${config.color}99)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "white",
              boxShadow: `0 2px 8px ${config.glow}`,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(226,232,240,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "1px 6px", borderRadius: 99,
                background: `${config.color}22`, border: `1px solid ${config.color}33`,
                fontSize: 9.5, fontWeight: 700, color: config.color, letterSpacing: "0.05em",
                marginTop: 1,
              }}>{userRole}</div>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="2" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0 16px" }} />
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
          {config.sections.map((section) => (
            <div key={section.label} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(100,116,139,0.7)", textTransform: "uppercase",
                padding: "0 8px", marginBottom: 6,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>{section.icon}</span> {section.label}
              </div>

              {section.links.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setHoveredLink(link.to)}
                    onMouseLeave={() => setHoveredLink("")}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px", borderRadius: 9, marginBottom: 2,
                      textDecoration: "none", fontSize: 13.5, fontWeight: active ? 700 : 500,
                      position: "relative", overflow: "hidden",
                      color: active ? "white" : "rgba(148,163,184,0.75)",
                      background: active
                        ? `linear-gradient(135deg, ${config.color}22, ${config.color}11)`
                        : hoveredLink === link.to ? "rgba(255,255,255,0.05)" : "transparent",
                      borderLeft: `2.5px solid ${active ? config.color : "transparent"}`,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {active && (
                      <div style={{
                        position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                        width: 2, height: "60%", background: config.color,
                        borderRadius: "0 2px 2px 0",
                        boxShadow: `0 0 8px ${config.glow}`,
                      }} />
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: active ? `${config.color}25` : "rgba(255,255,255,0.04)",
                      transition: "all 0.15s ease",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke={active ? config.color : "rgba(148,163,184,0.6)"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={link.icon} />
                      </svg>
                    </div>
                    <span style={{ flex: 1, lineHeight: 1.2 }}>{link.label}</span>
                    {active && (
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: config.color, flexShrink: 0,
                        boxShadow: `0 0 6px ${config.glow}`,
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={logout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 9, cursor: "pointer",
              background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.18)",
              color: "#fb7185", fontSize: 13.5, fontWeight: 600,
              fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.14)"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,63,94,0.08)"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.18)"; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(244,63,94,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>
            {t("sign_out")}
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
};

export default Sidebar;
