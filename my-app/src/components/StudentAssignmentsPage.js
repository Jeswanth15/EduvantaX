// src/components/StudentAssignmentsPage.js
import React, { useEffect, useState } from "react";
import {
  getAssignmentsByClassroom,
  getAllClassSubjects,
} from "../utils/api";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaBook, FaClock, FaChevronRight, FaPaperclip, FaExclamationCircle
} from "react-icons/fa";

const StudentAssignmentsPage = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;
  const role = decoded?.role;

  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId || role !== "STUDENT") return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [assRes, csRes] = await Promise.all([
          getAssignmentsByClassroom(classroomId),
          getAllClassSubjects(),
        ]);

        setAssignments(assRes.data || []);
        const cs = (csRes.data || []).filter(
          (c) => c.classroomId === classroomId
        );
        setClassSubjects(cs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classroomId, role]);

  const getSubjectName = (subjectId) => {
    const sub = classSubjects.find((s) => s.subjectId === subjectId);
    return sub ? sub.subjectName : "General";
  };

  if (loading) return <div style={styles.loading}>Loading your assignments...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Assignments</h1>
        <p style={styles.subtitle}>Tasks and coursework for your active classes</p>
      </div>

      {assignments.length === 0 ? (
        <div className="premium-card" style={styles.emptyState}>
          <FaExclamationCircle size={40} style={{ opacity: 0.2, marginBottom: "16px" }} />
          <h3>No Assignments Assigned</h3>
          <p>You're all caught up! Check back later for new tasks.</p>
        </div>
      ) : (
        <div className="grid-auto-fill">
          {assignments.map((a) => (
            <div
              key={a.assignmentId}
              className="premium-card hover-lift"
              style={styles.card}
              onClick={() => navigate(`/student/assignments/${a.assignmentId}/submission`)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.badge}>{getSubjectName(a.subjectId)}</div>
                <div style={styles.dateInfo}>
                  <FaClock size={12} /> Due: {a.dueDate}
                </div>
              </div>

              <h3 style={styles.assignmentTitle}>{a.title}</h3>
              <p style={styles.description}>{a.description}</p>

              <div style={styles.cardFooter}>
                <div style={styles.attachmentInfo}>
                  {a.fileLink && (
                    <div style={styles.attachmentBadge}>
                      <FaPaperclip size={12} /> Resource Included
                    </div>
                  )}
                </div>
                <div style={styles.actionBtn}>
                  Open Task <FaChevronRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "14px",
  },
  card: {
    padding: "24px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    color: "var(--primary-color)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  dateInfo: {
    fontSize: "13px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  assignmentTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  description: {
    margin: 0,
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFooter: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "var(--primary-color)",
    fontWeight: "600",
  },
  actionBtn: {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--primary-color)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 40px",
    color: "var(--text-muted)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-muted)",
  }
};

export default StudentAssignmentsPage;
