import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAllClassrooms,
  getAllSubjects,
  getTeachersBySchool,
  createClassSubject,
  getAllClassSubjects,
  deleteClassSubject,
  updateClassSubject,
} from "../utils/api";

const AssignSubjectPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit state: which row is being edited & the chosen teacher
  const [editingId, setEditingId] = useState(null);
  const [editTeacher, setEditTeacher] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const fetchData = async () => {
      try {
        const [c, s, t, a] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllSubjects(),
          getTeachersBySchool(schoolId),
          getAllClassSubjects(),
        ]);
        setClassrooms(c.data.filter((x) => x.schoolId === schoolId));
        setSubjects(s.data);
        setTeachers(t.data.filter((x) => x.approvalStatus === "APPROVED"));
        setAssignments(a.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolId]);

  const handleAssign = async () => {
    if (!selectedClass || !selectedSubject)
      return alert("Select classroom and subject first.");
    try {
      await createClassSubject({
        classroomId: Number(selectedClass),
        subjectId: Number(selectedSubject),
        teacherId: selectedTeacher ? Number(selectedTeacher) : null,
      });
      const updated = await getAllClassSubjects();
      setAssignments(updated.data);
      setSelectedClass("");
      setSelectedSubject("");
      setSelectedTeacher("");
    } catch (err) {
      alert("Failed to create assignment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await deleteClassSubject(id);
      setAssignments(assignments.filter((a) => a.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    // pre-fill with current teacher (or empty = unassigned)
    setEditTeacher(a.teacherId ? String(a.teacherId) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTeacher("");
  };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      const tid = editTeacher ? Number(editTeacher) : null;
      const res = await updateClassSubject(id, tid);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? res.data : a))
      );
      setEditingId(null);
      setEditTeacher("");
    } catch (err) {
      alert("Failed to update facilitator");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 100, color: "var(--text-tertiary)" }}>
        Loading assignments...
      </div>
    );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            margin: "0 0 6px",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Subject Allocation Matrix
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
          Bind academic subjects and facilitating personnel to specific classrooms.
        </p>
      </div>

      {/* Create new assignment */}
      <div
        style={{
          background: "var(--surface-1)",
          borderRadius: 24,
          padding: 32,
          marginBottom: 40,
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 20px" }}>
          Establish New Linkage
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            alignItems: "end",
          }}
        >
          {/* Classroom */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
              }}
            >
              Target Classroom
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-input"
              style={{ width: "100%", borderRadius: 12 }}
            >
              <option value="">-- Choose Classroom --</option>
              {classrooms.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.name} {c.section ? `— ${c.section}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
              }}
            >
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="form-input"
              style={{ width: "100%", borderRadius: 12 }}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
              }}
            >
              Facilitator (Optional)
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="form-input"
              style={{ width: "100%", borderRadius: 12 }}
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            style={{
              padding: 16,
              background: "var(--primary-color)",
              color: "white",
              borderRadius: 12,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Assign
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div
        style={{
          background: "var(--surface-1)",
          borderRadius: 24,
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
            Active Assignments
          </h3>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Classroom", "Subject", "Facilitator (Teacher)", "Actions"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "16px 24px",
                    textAlign: i === 3 ? "right" : "left",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    borderBottom: "1px solid var(--border-subtle)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: 60, textAlign: "center", color: "var(--text-tertiary)" }}
                >
                  No assignments yet.
                </td>
              </tr>
            ) : (
              assignments.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    animation: `pageEnter 0.3s ease ${i * 20}ms both`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Classroom */}
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--text-primary)",
                    }}
                  >
                    {a.classroomName}{" "}
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {a.classroomSection ? `| ${a.classroomSection}` : ""}
                    </span>
                  </td>

                  {/* Subject */}
                  <td
                    style={{
                      padding: "16px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {a.subjectName}
                  </td>

                  {/* Facilitator cell — normal view OR edit mode */}
                  <td style={{ padding: "12px 24px", fontSize: 13 }}>
                    {editingId === a.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <select
                          value={editTeacher}
                          onChange={(e) => setEditTeacher(e.target.value)}
                          className="form-input"
                          style={{ borderRadius: 8, fontSize: 13, padding: "6px 10px" }}
                        >
                          <option value="">-- Unassigned --</option>
                          {teachers.map((t) => (
                            <option key={t.userId} value={t.userId}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveEdit(a.id)}
                          disabled={saving}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "var(--primary-color)",
                            color: "white",
                            border: "none",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.7 : 1,
                          }}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: "transparent",
                            border: "1px solid var(--border-light)",
                            color: "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontWeight: 600,
                          color: a.teacherName && a.teacherName !== "N/A"
                            ? "var(--primary-color)"
                            : "#f59e0b",
                        }}
                      >
                        {a.teacherName && a.teacherName !== "N/A"
                          ? a.teacherName
                          : "Unassigned"}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px 24px", textAlign: "right" }}>
                    {editingId !== a.id && (
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        {/* Edit / change facilitator */}
                        <button
                          onClick={() => startEdit(a)}
                          title="Change Facilitator"
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "transparent",
                            border: "1px solid var(--border-light)",
                            color: "var(--text-secondary)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--surface-2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          ✏️ Edit Teacher
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(a.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "transparent",
                            border: "1px solid #fecaca",
                            color: "#ef4444",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fef2f2")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignSubjectPage;
