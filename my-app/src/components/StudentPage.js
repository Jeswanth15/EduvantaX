// src/components/StudentPage.js
import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAllAnnouncements,
  getAllClassSubjects,
  getTimetableByClass,
  getClassroomById,
  getCalendarBySchool,
} from "../utils/api";
import { useNavigate } from "react-router-dom";
import { FaBullhorn, FaCalendarAlt, FaTable, FaClock, FaRocket, FaUserGraduate, FaBuilding, FaBookOpen } from "react-icons/fa";

const StudentPage = () => {
  const decoded = getDecodedToken();
  const role = decoded?.role;
  const schoolId = decoded?.schoolId;
  const classroomId = decoded?.classroomId;
  const userName = decoded?.sub || "Student";
  const navigate = useNavigate();

  // Right Panel States
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const openRightPanel = (type) => {
    setRightPanelContent(type);
    if (type === "CALENDAR") loadCalendar();
    if (type === "TIMETABLE") loadTimetable();
    setRightPanelOpen(true);
  };

  const closeRightPanel = () => setRightPanelOpen(false);

  // ANNOUNCEMENTS
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllAnnouncements();
        let list = res.data || [];

        list = list.filter(
          (a) =>
            a.schoolId === schoolId &&
            (a.classroomId === null || a.classroomId === classroomId)
        );

        list.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

        setAnnouncements(list);
        setFiltered(list);
      } catch (err) {
        console.error("Error loading announcements:", err);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    if (schoolId) load();
  }, [schoolId, classroomId]);

  useEffect(() => {
    let arr = announcements;
    if (filter === "SCHOOL") arr = arr.filter((a) => a.classroomId === null);
    if (filter === "CLASS") arr = arr.filter((a) => a.classroomId === classroomId);
    setFiltered(arr);
  }, [filter, announcements, classroomId]);

  // TIMETABLE
  const [timetable, setTimetable] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [myClass, setMyClass] = useState(null);

  const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MAX_PERIODS = 7;

  const loadTimetable = async () => {
    try {
      const cls = await getClassroomById(classroomId);
      setMyClass(cls.data);

      const tt = await getTimetableByClass(classroomId);
      setTimetable(tt.data || []);

      const cs = await getAllClassSubjects();
      setClassSubjects(cs.data.filter((s) => s.classroomId === classroomId));
    } catch (err) {
      console.error("Error loading timetable:", err);
    }
  };

  const getSubject = (id) => {
    return classSubjects.find((s) => s.subjectId === id)?.subjectName || "-";
  };

  // CALENDAR
  const [calendar, setCalendar] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadCalendar = async () => {
    try {
      const res = await getCalendarBySchool(schoolId);
      setCalendar(res.data || []);
    } catch (err) {
      console.error("Error loading calendar:", err);
    }
  };

  const changeMonth = (o) => {
    const d = new Date(currentMonth);
    d.setMonth(currentMonth.getMonth() + o);
    setCurrentMonth(d);
  };

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const getCalendarDays = () => {
    const arr = [];
    const first = startOfMonth.getDay();
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      arr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }
    return arr;
  };

  const getDayStatus = (date) => {
    if (!date) return null;
    const id = date.toISOString().split("T")[0];
    return calendar.find((c) => c.date === id)?.status || null;
  };

  const getColor = (status) => {
    switch (status) {
      case "HOLIDAY": return "rgba(239, 68, 68, 0.1)";
      case "HALF_DAY": return "rgba(245, 158, 11, 0.1)";
      case "SUNDAY": return "rgba(107, 114, 128, 0.1)";
      case "WORKING": return "rgba(16, 185, 129, 0.1)";
      default: return "transparent";
    }
  };

  const getStatusBorder = (status) => {
    switch (status) {
      case "HOLIDAY": return "#ef4444";
      case "HALF_DAY": return "#f59e0b";
      case "SUNDAY": return "#6b7280";
      case "WORKING": return "#10b981";
      default: return "var(--border-color)";
    }
  };

  if (role !== "STUDENT") return <div style={styles.error}>Access Restricted</div>;

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontWeight: "500" }}>
          Preparing your learning space...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Student Portal</h1>
          <div style={styles.welcomeTag}>
            <FaUserGraduate style={{ marginRight: "8px" }} />
            Welcome back, {userName}!
          </div>
        </div>
        <div style={styles.headerActions}>
          <button className="modern-btn btn-outline" onClick={() => openRightPanel("TIMETABLE")}>
            <FaTable /> Timetable
          </button>
          <button className="modern-btn btn-primary" onClick={() => openRightPanel("CALENDAR")}>
            <FaCalendarAlt /> Calendar
          </button>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.mainCol}>
          <div className="premium-card" style={styles.feedSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><FaBullhorn style={{ marginRight: 10, color: "var(--primary-color)" }} /> Announcements</h3>
              <div style={styles.filterWrapper}>
                <select
                  style={styles.filterSelect}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="ALL">All Sources</option>
                  <option value="SCHOOL">School Wide</option>
                  <option value="CLASS">My Class</option>
                </select>
              </div>
            </div>

            <div style={styles.announcementList}>
              {filtered.length === 0 ? (
                <div style={styles.emptyFeed}>
                  <FaBullhorn size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
                  <p>No announcements right now. Check back later!</p>
                </div>
              ) : (
                filtered.map((a) => (
                  <div className="premium-card" key={a.announcementId} style={styles.announcementCard}>
                    <div style={styles.annHeader}>
                      <h4 style={styles.annTitle}>{a.title}</h4>
                      <span style={a.classroomId ? styles.classBadge : styles.schoolBadge}>
                        {a.classroomId ? "Class" : "School"}
                      </span>
                    </div>
                    <p style={styles.annBody}>{a.message}</p>
                    <div style={styles.annFooter}>
                      <FaClock size={12} style={{ marginRight: 6 }} />
                      {new Date(a.postedAt).toLocaleDateString()} at {new Date(a.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={styles.sideCol}>
          <div className="premium-card" style={styles.quickStatsCard}>
            <h3 style={styles.cardHeader}><FaRocket size={14} /> My Classroom</h3>
            <div style={styles.statsList}>
              <div style={styles.statItem}>
                <div style={styles.statIcon}><FaBuilding /></div>
                <div style={styles.statText}>
                  <span style={styles.statLabel}>Grade & Section</span>
                  <span style={styles.statValue}>{myClass?.className || "Loading..."}</span>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statIcon}><FaRocket /></div>
                <div style={styles.statText}>
                  <span style={styles.statLabel}>Assigned Room</span>
                  <span style={styles.statValue}>{myClass?.roomNumber || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card" style={styles.shortcutsCard}>
            <h3 style={styles.cardHeader}><FaBookOpen size={14} /> Quick Links</h3>
            <div style={styles.shortcutGrid}>
              <button style={styles.shortcutItem} onClick={() => navigate('/student/assignments')}>
                Assignments
              </button>
              <button style={styles.shortcutItem} onClick={() => navigate('/student/marks')}>
                My Grades
              </button>
            </div>
          </div>
        </div>
      </div>

      {rightPanelOpen && (
        <>
          <div style={styles.drawerBackdrop} onClick={closeRightPanel} />
          <div style={{
            ...styles.rightDrawer,
            transform: rightPanelOpen ? "translateX(0)" : "translateX(100%)",
            opacity: rightPanelOpen ? 1 : 0
          }}>
            <div style={styles.drawerHeader}>
              <h3 style={styles.drawerTitle}>
                {rightPanelContent === "TIMETABLE" ? "Academic Schedule" : "School Calendar"}
              </h3>
              <button className="modern-btn" style={styles.closeBtn} onClick={closeRightPanel}>✕</button>
            </div>

            <div style={styles.drawerBody}>
              {rightPanelContent === "TIMETABLE" && (
                <div style={styles.ttWrapper}>
                  <table style={styles.ttTable}>
                    <thead>
                      <tr>
                        <th style={styles.ttTh}>Period</th>
                        {DAY_KEYS.map((d) => <th key={d} style={styles.ttTh}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map((p) => (
                        <tr key={p}>
                          <td style={styles.ttTdPeriod}>P{p}</td>
                          {DAY_KEYS.map((d) => {
                            const slot = timetable.find(
                              (t) => t.dayOfWeek.toUpperCase().startsWith(d) && Number(t.periodNumber) === p
                            );
                            return (
                              <td key={`${d}_${p}`} style={styles.ttTd}>
                                <div style={styles.ttCellContent}>
                                  {slot ? getSubject(slot.subjectId) : "-"}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rightPanelContent === "CALENDAR" && (
                <div>
                  <div style={styles.calNav}>
                    <button className="modern-btn btn-outline" onClick={() => changeMonth(-1)}>◀</button>
                    <span style={styles.calMonthName}>
                      {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                    </span>
                    <button className="modern-btn btn-outline" onClick={() => changeMonth(1)}>▶</button>
                  </div>

                  <div style={styles.calGrid}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} style={styles.calDayHeader}>{d}</div>
                    ))}
                    {getCalendarDays().map((date, i) => {
                      const status = getDayStatus(date);
                      return (
                        <div key={i} style={{
                          ...styles.calCell,
                          background: getColor(status),
                          borderColor: getStatusBorder(status)
                        }}>
                          <span style={{
                            ...styles.calDateNum,
                            color: date?.getMonth() !== currentMonth.getMonth() ? "var(--text-muted)" : "var(--text-primary)"
                          }}>{date?.getDate()}</span>
                          {status && status !== "WORKING" && (
                            <span style={{ ...styles.calStatusLabel, color: getStatusBorder(status) }}>
                              {status.split("_")[0]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    paddingBottom: "40px",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    marginBottom: "8px",
  },
  welcomeTag: {
    display: "flex",
    alignItems: "center",
    color: "var(--primary-color)",
    fontSize: "15px",
    fontWeight: "600",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "32px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "0 4px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
  },
  filterWrapper: {
    position: "relative",
  },
  filterSelect: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--background-color)",
    color: "var(--text-secondary)",
    fontSize: "13px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
  },
  feedSection: {
    padding: "24px",
  },
  announcementList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  announcementCard: {
    padding: "24px",
    boxShadow: "none",
    border: "1px solid var(--border-color)",
    transition: "transform 0.2s",
  },
  annHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  annTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--primary-color)",
  },
  classBadge: {
    fontSize: "10px",
    fontWeight: "700",
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    color: "var(--primary-color)",
    padding: "4px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
  },
  schoolBadge: {
    fontSize: "10px",
    fontWeight: "700",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    color: "var(--text-secondary)",
    padding: "4px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
  },
  annBody: {
    margin: "0 0 16px 0",
    color: "var(--text-secondary)",
    fontSize: "15px",
    lineHeight: "1.6",
  },
  annFooter: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: "500",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-color)",
  },
  emptyFeed: {
    textAlign: "center",
    padding: "60px 40px",
    color: "var(--text-muted)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  quickStatsCard: {
    padding: "24px",
    marginBottom: "24px",
  },
  cardHeader: {
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-color)",
  },
  statsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "var(--background-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--primary-color)",
    fontSize: "16px",
  },
  statText: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    fontWeight: "700",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  shortcutsCard: {
    padding: "24px",
  },
  shortcutGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  shortcutItem: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    backgroundColor: "white",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  drawerBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(4px)",
    zIndex: 1400,
  },
  rightDrawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "550px",
    height: "100vh",
    backgroundColor: "var(--surface-color)",
    boxShadow: "-15px 0 45px rgba(0,0,0,0.15)",
    zIndex: 1500,
    padding: "40px",
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s",
    overflowY: "auto",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "20px",
  },
  drawerTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },
  closeBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--background-color)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    cursor: "pointer",
  },
  ttTable: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "4px",
  },
  ttTh: {
    textAlign: "center",
    padding: "12px 6px",
    color: "var(--text-muted)",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  ttTd: {
    padding: "4px",
    width: "14%",
  },
  ttCellContent: {
    minHeight: "44px",
    backgroundColor: "var(--background-color)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "600",
    textAlign: "center",
    padding: "8px 4px",
    color: "var(--text-secondary)",
  },
  ttTdPeriod: {
    padding: "12px",
    fontWeight: "800",
    color: "var(--primary-color)",
    textAlign: "center",
    fontSize: "14px",
  },
  calNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "32px",
  },
  calMonthName: {
    fontSize: "20px",
    fontWeight: "700",
    minWidth: "180px",
    textAlign: "center",
  },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "10px",
  },
  calDayHeader: {
    textAlign: "center",
    padding: "12px",
    fontSize: "12px",
    fontWeight: "800",
    color: "var(--text-muted)",
  },
  calCell: {
    height: "85px",
    padding: "10px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "2px solid transparent",
  },
  calDateNum: {
    fontWeight: "800",
    fontSize: "16px",
  },
  calStatusLabel: {
    fontSize: "10px",
    fontWeight: "800",
    textAlign: "right",
    textTransform: "uppercase",
  },
  error: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--error-color)",
  }
};

export default StudentPage;
