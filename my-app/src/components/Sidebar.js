import React, { useState } from "react";
import { FaBars, FaSignOutAlt, FaUser } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { getDecodedToken, logout } from "../utils/authHelper";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const decoded = getDecodedToken();
  const location = useLocation();

  const userRole = decoded?.role;
  const schoolName = decoded?.schoolName || "EduPortal";

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? "white" : "rgba(255, 255, 255, 0.7)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    padding: "12px 18px",
    background: isActive(path) ? "rgba(255, 255, 255, 0.1)" : "transparent",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    fontWeight: isActive(path) ? "600" : "400",
    transition: "var(--transition-fast)",
    marginBottom: "4px",
  });

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          top: 18,
          left: 20,
          zIndex: 2000,
          backgroundColor: "transparent",
          color: isOpen ? "white" : "var(--primary-color)",
          border: "none",
          cursor: "pointer",
          transition: "0.3s",
        }}
      >
        <FaBars size={22} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(4px)",
            zIndex: 1400,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-280px",
          width: "280px",
          height: "100%",
          backgroundColor: "var(--primary-color)",
          color: "white",
          transition: "cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
          paddingTop: "80px",
          zIndex: 1500,
          overflowY: "auto",
          boxShadow: "10px 0 30px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 25px 30px 25px" }}>
          <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.5, marginBottom: "8px" }}>{t("organization")}</h2>
          <h3 style={{ color: "white", fontSize: "18px", margin: 0 }}>{schoolName}</h3>
        </div>

        <div style={{ flex: 1, padding: "0 15px" }}>
          <h2 style={styles.sectionTitle}>{t("main_menu")}</h2>
          <Link to="/" style={linkStyle("/")} onClick={closeSidebar}>{t("dashboard")}</Link>
          <Link to="/profile" style={linkStyle("/profile")} onClick={closeSidebar}><FaUser style={{ marginRight: 10 }} /> {t("profile")}</Link>

          {/* SCHOOL ADMIN */}
          {userRole === "SCHOOLADMIN" && (
            <>
              <h2 style={styles.sectionTitle}>{t("management")}</h2>
              <Link to="/schooladmin/pending-users" style={linkStyle("/schooladmin/pending-users")} onClick={closeSidebar}>{t("user_approvals")}</Link>
              <Link to="/schooladmin/classrooms" style={linkStyle("/schooladmin/classrooms")} onClick={closeSidebar}>{t("classrooms")}</Link>
              <Link to="/schooladmin/subjects" style={linkStyle("/schooladmin/subjects")} onClick={closeSidebar}>{t("subjects_catalog")}</Link>
              <Link to="/schooladmin/assign-subject" style={linkStyle("/schooladmin/assign-subject")} onClick={closeSidebar}>{t("teaching_assignments")}</Link>
              <Link to="/schooladmin/enrollments" style={linkStyle("/schooladmin/enrollments")} onClick={closeSidebar}>{t("student_enrollments")}</Link>

              <h2 style={styles.sectionTitle}>{t("academics")}</h2>
              <Link to="/schooladmin/timetables" style={linkStyle("/schooladmin/timetables")} onClick={closeSidebar}>{t("master_timetable")}</Link>
              <Link to="/schooladmin/substitutions" style={linkStyle("/schooladmin/substitutions")} onClick={closeSidebar}>Daily Substitutions</Link>
              <Link to="/schooladmin/calendar" style={linkStyle("/schooladmin/calendar")} onClick={closeSidebar}>{t("school_calendar")}</Link>
              <Link to="/schooladmin/syllabus" style={linkStyle("/schooladmin/syllabus")} onClick={closeSidebar}>{t("syllabus_hub")}</Link>
              <Link to="/schooladmin/exams" style={linkStyle("/schooladmin/exams")} onClick={closeSidebar}>{t("exam_schedules")}</Link>
              <Link to="/schooladmin/marks" style={linkStyle("/schooladmin/marks")} onClick={closeSidebar}>{t("marks_register")}</Link>
              <Link to="/schooladmin/attendance" style={linkStyle("/schooladmin/attendance")} onClick={closeSidebar}>{t("attendance")}</Link>
              <Link to="/schooladmin/transport" style={linkStyle("/schooladmin/transport")} onClick={closeSidebar}>Transport Mgmt</Link>
              <Link to="/schooladmin/student-transport" style={linkStyle("/schooladmin/student-transport")} onClick={closeSidebar}>Student Transport</Link>
            </>
          )}

          {/* TEACHER */}
          {userRole === "TEACHER" && (
            <>
              <h2 style={styles.sectionTitle}>{t("teaching")}</h2>
              <Link to="/teacher/attendance" style={linkStyle("/teacher/attendance")} onClick={closeSidebar}>{t("attendance")}</Link>
              <Link to="/teacher/assignments" style={linkStyle("/teacher/assignments")} onClick={closeSidebar}>{t("assignments")}</Link>
              <Link to="/teacher/syllabus" style={linkStyle("/teacher/syllabus")} onClick={closeSidebar}>{t("syllabus")}</Link>
              <Link to="/teacher/teaching-logs" style={linkStyle("/teacher/teaching-logs")} onClick={closeSidebar}>{t("teaching_logs")}</Link>
              <Link to="/teacher/exams" style={linkStyle("/teacher/exams")} onClick={closeSidebar}>{t("exams")}</Link>
              <Link to="/teacher/marks" style={linkStyle("/teacher/marks")} onClick={closeSidebar}>{t("marks_entry")}</Link>
            </>
          )}

          {/* DRIVER */}
          {userRole === "DRIVER" && (
            <>
              <h2 style={styles.sectionTitle}>Transport</h2>
              <Link to="/driver/portal" style={linkStyle("/driver/portal")} onClick={closeSidebar}>Driver Portal</Link>
            </>
          )}

          {/* STUDENT */}
          {userRole === "STUDENT" && (
            <>
              <h2 style={styles.sectionTitle}>{t("my_learning")}</h2>
              <Link to="/student/timetable" style={linkStyle("/student/timetable")} onClick={closeSidebar}>{t("my_timetable")}</Link>
              <Link to="/student/exams" style={linkStyle("/student/exams")} onClick={closeSidebar}>{t("my_exams")}</Link>
              <Link to="/student/marks" style={linkStyle("/student/marks")} onClick={closeSidebar}>{t("my_marks")}</Link>
              <Link to="/student/assignments" style={linkStyle("/student/assignments")} onClick={closeSidebar}>{t("my_assignments")}</Link>
              <Link to="/student/attendance" style={linkStyle("/student/attendance")} onClick={closeSidebar}>{t("my_attendance")}</Link>
              <Link to="/student/syllabus" style={linkStyle("/student/syllabus")} onClick={closeSidebar}>{t("view_syllabus")}</Link>
              <Link to="/student/bus-tracking" style={linkStyle("/student/bus-tracking")} onClick={closeSidebar}>Bus Tracking</Link>
            </>
          )}
        </div>

        <div style={{ padding: "20px 15px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={logout}
            style={styles.logoutBtn}
          >
            <FaSignOutAlt style={{ marginRight: 10 }} /> {t("sign_out")}
          </button>
        </div>
      </div>
    </>
  );
};

const styles = {
  sectionTitle: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: "rgba(255, 255, 255, 0.4)",
    margin: "24px 18px 12px 18px",
    fontWeight: "700",
  },
  logoutBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    padding: "12px 18px",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#fca5a5",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "var(--transition-fast)",
  }
};

export default Sidebar;
