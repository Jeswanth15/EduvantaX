// src/components/SchoolAdmin.js
import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getTeachersBySchool,
  getStudentsBySchool,
  getAllAnnouncements,
  getAllClassrooms,
  createAnnouncement,
  deleteAnnouncement
} from "../utils/api";
import { FaUsers, FaUserGraduate, FaBullhorn, FaPlus, FaTrash, FaClock, FaUniversity } from "react-icons/fa";

const SchoolAdmin = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;
  const schoolName = decoded?.schoolName || "Your School";

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    classroomId: "",
  });

  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [teacherRes, studentRes, announcementRes, classroomRes] = await Promise.all([
          getTeachersBySchool(schoolId),
          getStudentsBySchool(schoolId),
          getAllAnnouncements(),
          getAllClassrooms(schoolId),
        ]);

        setTeachers(teacherRes.data);
        setStudents(studentRes.data);
        setAnnouncements(
          announcementRes.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
        );
        setClassrooms(classroomRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  const approvedTeachers = teachers.filter(t => t.approvalStatus === "APPROVED");
  const approvedStudents = students.filter(s => s.approvalStatus === "APPROVED");

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert("Title and message are required!");
      return;
    }

    try {
      await createAnnouncement({
        ...newAnnouncement,
        userId: decoded.userId,
        schoolId: decoded.schoolId,
        classroomId: newAnnouncement.classroomId || null,
      });

      alert("Announcement created!");
      setNewAnnouncement({ title: "", message: "", classroomId: "" });

      const res = await getAllAnnouncements();
      setAnnouncements(res.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)));
    } catch (err) {
      console.error(err);
      alert("Failed to create announcement!");
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await deleteAnnouncement(announcementId);
      alert("Announcement deleted!");
      const res = await getAllAnnouncements();
      setAnnouncements(res.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)));
    } catch (err) {
      console.error(err);
      alert("Failed to delete announcement!");
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontWeight: "500" }}>
          Synchronizing administrative data...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>School Administration</h1>
          <p style={styles.schoolTag}><FaUniversity /> {schoolName}</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid-cols-2" style={{marginBottom: "36px"}}>
        <div className="premium-card" style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <FaUsers style={{ color: "var(--accent-color)" }} />
            <h3>Teachers</h3>
          </div>
          <div style={styles.summaryStats}>
            <div style={styles.statLine}>
              <span style={styles.statLabel}>Direct Total</span>
              <span style={styles.statValue}>{teachers.length}</span>
            </div>
            <div style={styles.statLine}>
              <span style={styles.statLabel}>Active (Approved)</span>
              <span style={{ ...styles.statValue, color: "var(--success-color)" }}>{approvedTeachers.length}</span>
            </div>
          </div>
        </div>

        <div className="premium-card" style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <FaUserGraduate style={{ color: "var(--accent-color)" }} />
            <h3>Students</h3>
          </div>
          <div style={styles.summaryStats}>
            <div style={styles.statLine}>
              <span style={styles.statLabel}>Direct Total</span>
              <span style={styles.statValue}>{students.length}</span>
            </div>
            <div style={styles.statLine}>
              <span style={styles.statLabel}>Active (Approved)</span>
              <span style={{ ...styles.statValue, color: "var(--success-color)" }}>{approvedStudents.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* CREATE ANNOUNCEMENT */}
        <div className="premium-card" style={styles.formCard}>
          <h3 style={styles.sectionTitle}><FaPlus size={14} /> Create Announcement</h3>
          <div style={styles.form}>
            <input
              className="modern-input"
              placeholder="Announcement Title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            />
            <textarea
              className="modern-input"
              placeholder="Type your message here..."
              rows={3}
              style={{ resize: "none" }}
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
            />
            <div style={styles.formFooter}>
              <select
                className="modern-input"
                style={{ width: "auto", flex: 1, marginTop: 0 }}
                value={newAnnouncement.classroomId}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, classroomId: e.target.value })}
              >
                <option value="">Global (Entire School)</option>
                {classrooms.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name} - {cls.section}
                  </option>
                ))}
              </select>
              <button className="modern-btn btn-primary" onClick={handleCreateAnnouncement}>
                Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT LIST */}
        <div style={styles.announcementFeed}>
          <h3 style={styles.feedTitle}><FaBullhorn /> Recent Shared Announcements</h3>
          {announcements.length === 0 ? (
            <div className="premium-card" style={styles.empty}>No recent announcements.</div>
          ) : (
            <div style={styles.feedList}>
              {announcements.map((a) => (
                <div className="premium-card" key={a.announcementId} style={styles.feedCard}>
                  <div style={styles.feedCardTop}>
                    <h4 style={styles.feedCardTitle}>{a.title}</h4>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteAnnouncement(a.announcementId)}
                      title="Delete Announcement"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                  <p style={styles.feedCardMsg}>{a.message}</p>
                  <div style={styles.feedCardFooter}>
                    <span style={styles.audienceTag}>{a.classroomId ? "Targeted" : "Broadcast"}</span>
                    <div style={styles.timestamp}>
                      <FaClock size={11} /> {new Date(a.postedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "36px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "6px",
  },
  schoolTag: {
    color: "var(--accent-color)",
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  schoolTag: {
    color: "var(--accent-color)",
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  summaryCard: {
    padding: "24px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    fontSize: "16px",
  },
  summaryStats: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  statValue: {
    fontWeight: "700",
    fontSize: "18px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "20px",
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formFooter: {
    display: "flex",
    gap: "12px",
  },
  feedTitle: {
    fontSize: "18px",
    margin: "32px 0 20px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-secondary)",
  },
  feedList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  feedCard: {
    padding: "20px",
    border: "1px solid var(--border-color)",
    boxShadow: "none",
  },
  feedCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  feedCardTitle: {
    margin: 0,
    fontSize: "16px",
    color: "var(--primary-color)",
  },
  deleteBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "var(--error-color)",
    border: "none",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  feedCardMsg: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    marginBottom: "16px",
  },
  feedCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  audienceTag: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: "var(--background-color)",
    padding: "4px 8px",
    borderRadius: "4px",
    color: "var(--text-muted)",
  },
  timestamp: {
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
};

export default SchoolAdmin;
