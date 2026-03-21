import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";

import {
  getAllClassrooms,
  getAllSubjects,
  getTeachersBySchool,
  createClassSubject,
  getAllClassSubjects,
  deleteClassSubject,
} from "../utils/api";

// =======================
// STYLES
// =======================

const container = {
  padding: "20px",
  width: "100%",
  maxWidth: "1100px",
  margin: "0 auto",
  fontFamily: "Segoe UI, sans-serif",
};

const title = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0a4275",
  textAlign: "center",
  marginBottom: "30px",
};

const formBox = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  marginBottom: "30px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "15px",
};

const input = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const assignButton = {
  padding: "12px",
  background: "#0a4275",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  width: "100%",
};

const cardTable = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  marginTop: "30px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  background: "#0a4275",
  color: "white",
  padding: "12px",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee",
};

const deleteBtn = {
  background: "#e03532",
  padding: "8px 12px",
  borderRadius: "6px",
  color: "white",
  border: "none",
  cursor: "pointer",
  transition: "0.2s",
};

deleteBtn[":hover"] = {
  background: "#b71c1c",
};

// =======================
// COMPONENT
// =======================

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

  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        const [classRes, subRes, teachRes, assignRes] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllSubjects(),
          getTeachersBySchool(schoolId),
          getAllClassSubjects(),
        ]);

        setClassrooms(classRes.data);
        setSubjects(subRes.data);
        setTeachers(teachRes.data);
        setAssignments(assignRes.data);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchData();
  }, [schoolId]);

  const handleAssign = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select class and subject");
      return;
    }

    try {
      await createClassSubject({
        classroomId: Number(selectedClass),
        subjectId: Number(selectedSubject),
        teacherId: selectedTeacher ? Number(selectedTeacher) : null,
      });

      alert("Assigned!");

      const updated = await getAllClassSubjects();
      setAssignments(updated.data);

      setSelectedClass("");
      setSelectedSubject("");
      setSelectedTeacher("");
    } catch (err) {
      alert("Failed to assign");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete assignment?")) return;

    try {
      await deleteClassSubject(id);
      setAssignments(assignments.filter((a) => a.id !== id));
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
  };

  return (
    <div className="assign-subject-page-wrapper">
      <div style={container}>
        <h2 style={title}>Assign Subjects</h2>

        {/* FORM */}
        <div className="premium-card" style={{ padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Classroom</label>
              <select
                className="modern-input"
                style={{ margin: 0 }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classrooms.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.name} — {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Subject</label>
              <select
                className="modern-input"
                style={{ margin: 0 }}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Teacher</label>
              <select
                className="modern-input"
                style={{ margin: 0 }}
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Assign Teacher (optional)</option>
                {teachers.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="modern-btn btn-primary" onClick={handleAssign} style={{ width: 'auto' }}>
            Assign Subject to Class
          </button>
        </div>

        {/* TABLE */}
        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0 }}>Assigned Subjects</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'rgba(30, 136, 229, 0.05)' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left' }}>Class</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Subject</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Teacher</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: '600' }}>
                    {a.classroomName} - {a.classroomSection}
                  </td>
                  <td style={{ padding: '16px' }}>{a.subjectName}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{a.teacherName || "N/A"}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      className="modern-btn btn-outline"
                      style={{ color: '#ef4444', borderColor: '#fecaca', padding: '6px 12px' }}
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subjects assigned yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignSubjectPage;
