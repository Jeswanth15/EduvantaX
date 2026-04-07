// src/components/AssignmentsPage.js
import React, { useEffect, useState } from "react";
import {
  getAllClassSubjects,
  getAllClassrooms,
  createAssignment,
  getAssignmentsBySubject,
} from "../utils/api";
import {
  FaPlus, FaBook, FaCalendarAlt, FaFileAlt, FaFilter,
  FaChevronRight, FaPaperclip, FaClock
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const userId = decoded?.userId;
  const schoolId = decoded?.schoolId;
  const role = decoded?.role;

  const [classrooms, setClassrooms] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [filteredClassSubjects, setFilteredClassSubjects] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [classroomsRes, subjectsRes] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllClassSubjects()
        ]);

        setClassrooms(classroomsRes.data || []);
        const allSubjects = subjectsRes.data || [];
        setClassSubjects(allSubjects);

        if (role === "TEACHER") {
          setFilteredClassSubjects(allSubjects.filter((cs) => cs.teacherId === userId));
        } else if (role === "STUDENT") {
          const studentClassId = decoded?.classroomId;
          setFilteredClassSubjects(allSubjects.filter((cs) => cs.classroomId === studentClassId));
          setSelectedClass(studentClassId);
        } else {
          setFilteredClassSubjects(allSubjects);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [schoolId, role, userId]);

  useEffect(() => {
    if (selectedSubject) {
      getAssignmentsBySubject(selectedSubject).then((res) =>
        setAssignments(res.data || [])
      );
    }
  }, [selectedSubject]);

  const subjectsForClass = filteredClassSubjects
    .filter((cs) => cs.classroomId === Number(selectedClass))
    .map((cs) => ({
      id: cs.subjectId,
      name: cs.subjectName,
    }));

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject || !newAssignment.title) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("classroomId", selectedClass);
      formData.append("subjectId", selectedSubject);
      formData.append("teacherId", userId);
      formData.append("title", newAssignment.title);
      formData.append("description", newAssignment.description);
      formData.append("dueDate", newAssignment.dueDate);
      if (file) formData.append("file", file);

      await createAssignment(formData);
      alert("Assignment created successfully");
      setNewAssignment({ title: "", description: "", dueDate: "" });
      setFile(null);

      const res = await getAssignmentsBySubject(selectedSubject);
      setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to create assignment");
    }
  };

  if (loading) return <div style={styles.loading}>Loading assignments...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Assignments</h1>
        <p style={styles.subtitle}>Manage and track coursework tasks</p>
      </div>

      <div className="grid-side-main" style={{alignItems: "start"}}>
        {/* LEFT: FILTERS & CREATE */}
        <div style={styles.sideCol}>
          <div className="premium-card" style={styles.card}>
            <h3 style={styles.sectionTitle}><FaFilter size={14} /> Filter Tasks</h3>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Select Class</label>
              <select
                className="modern-input"
                value={selectedClass}
                disabled={role === "STUDENT"}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSubject("");
                  setAssignments([]);
                }}
              >
                <option value="">-- Choose Class --</option>
                {[...new Set(filteredClassSubjects.map((cs) => cs.classroomId))]
                  .map((cid) => classrooms.find((c) => c.classId === cid))
                  .filter(Boolean)
                  .map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.name} {cls.section}
                    </option>
                  ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Select Subject</label>
              <select
                className="modern-input"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
              >
                <option value="">-- Choose Subject --</option>
                {subjectsForClass.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSubject && (role === "TEACHER" || role === "SCHOOLADMIN") && (
            <div className="premium-card" style={{ ...styles.card, marginTop: "24px" }}>
              <h3 style={styles.sectionTitle}><FaPlus size={14} /> New Assignment</h3>
              <form onSubmit={handleCreateAssignment} style={styles.form}>
                <input
                  className="modern-input"
                  placeholder="Assignment Title"
                  value={newAssignment.title}
                  required
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                />
                <textarea
                  className="modern-input"
                  placeholder="Task Description"
                  rows={4}
                  style={{ resize: "none" }}
                  value={newAssignment.description}
                  required
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                />
                <div style={styles.formRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}><FaCalendarAlt size={12} /> Due Date</label>
                    <input
                      type="date"
                      className="modern-input"
                      value={newAssignment.dueDate}
                      required
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div style={styles.fileUpload}>
                  <input
                    type="file"
                    id="assign-file"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <label htmlFor="assign-file" className="modern-btn btn-outline" style={{ width: "100%", margin: 0, cursor: "pointer" }}>
                    <FaPaperclip /> {file ? file.name.substring(0, 15) + "..." : "Attach File"}
                  </label>
                </div>
                <button type="submit" className="modern-btn btn-primary" style={{ width: "100%" }}>
                  Publish Assignment
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT: LIST */}
        <div style={styles.contentCol}>
          {!selectedSubject ? (
            <div className="premium-card" style={styles.emptyState}>
              <FaBook size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <h3>Choose a Subject</h3>
              <p>Select a class and subject from the left panel to view tasks.</p>
            </div>
          ) : (
            <div style={styles.listWrapper}>
              <h3 style={styles.listTitle}>
                <FaFileAlt /> {assignments.length} Tasks Found
              </h3>
              {assignments.length === 0 ? (
                <div className="premium-card" style={styles.emptyState}>
                  <p>No assignments posted for this subject yet.</p>
                </div>
              ) : (
                <div style={styles.taskGrid}>
                  {assignments.map((a) => (
                    <div key={a.assignmentId} className="premium-card hover-lift" style={styles.taskCard}>
                      <div style={styles.taskHeader}>
                        <h4 style={styles.taskTitle}>{a.title}</h4>
                        <div style={styles.statusTag}>Published</div>
                      </div>
                      <p style={styles.taskDesc}>{a.description}</p>
                      <div style={styles.taskFooter}>
                        <div style={styles.footerInfo}>
                          <span style={styles.dueInfo}>
                            <FaClock size={12} /> Due: <strong>{a.dueDate}</strong>
                          </span>
                          {a.fileLink && (
                            <a
                              href={`http://localhost:8080${a.fileLink}`}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.fileLink}
                            >
                              <FaPaperclip size={12} /> Resource
                            </a>
                          )}
                        </div>
                        <button
                          style={styles.actionBtn}
                          onClick={() => {
                            const path = role === "SCHOOLADMIN"
                              ? `/schooladmin/assignments/${a.assignmentId}/submissions`
                              : `/teacher/assignments/${a.assignmentId}/submissions`;
                            navigate(path);
                          }}
                        >
                          View Details <FaChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
  sideCol: {
    position: "sticky",
    top: "20px",
  },
  card: {
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-primary)",
  },
  filterGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "flex",
    gap: "12px",
  },
  listWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  listTitle: {
    fontSize: "18px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-primary)",
  },
  taskGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  taskCard: {
    padding: "20px",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  taskTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "700",
  },
  statusTag: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#059669",
  },
  taskDesc: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  taskFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  },
  footerInfo: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  dueInfo: {
    fontSize: "13px",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  fileLink: {
    fontSize: "13px",
    color: "var(--primary-color)",
    textDecoration: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  actionBtn: {
    background: "none",
    border: "none",
    color: "var(--primary-color)",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
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

export default AssignmentsPage;
