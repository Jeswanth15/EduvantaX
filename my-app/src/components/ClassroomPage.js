import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAllClassrooms,
  createClassroom,
  getTeachersBySchool,
  deleteClassroom,
} from "../utils/api";

import "./../styles/ClassroomPage.css";

const ClassroomPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const fetchClassrooms = async () => {
    try {
      const res = await getAllClassrooms(schoolId);
      setClassrooms(res.data.filter((c) => c.schoolId === schoolId));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await getTeachersBySchool(schoolId);
      setTeachers(res.data.filter((t) => t.approvalStatus === "APPROVED"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchClassrooms();
      fetchTeachers();
    }
  }, [schoolId]);

  const handleCreate = async () => {
    if (!name) return alert("Class name is required");

    try {
      await createClassroom({
        name,
        section,
        schoolId,
        classTeacherId: teacherId ? Number(teacherId) : null,
      });

      setName("");
      setSection("");
      setTeacherId("");

      fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert("Failed to create classroom");
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    try {
      await deleteClassroom(classId);
      fetchClassrooms();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  return (
    <div className="classroom-page-wrapper">
      <div className="classroom-content" style={{ padding: '20px' }}>
        <h1 className="title">Manage Classrooms</h1>

        {/* CREATE FORM */}
        <div className="premium-card" style={{ padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create Classroom</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Class Name</label>
              <input
                type="text"
                placeholder="e.g. Grade 10"
                className="modern-input"
                style={{ margin: 0 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Section</label>
              <input
                type="text"
                placeholder="e.g. A"
                className="modern-input"
                style={{ margin: 0 }}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Class Teacher</label>
              <select
                className="modern-input"
                style={{ margin: 0 }}
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">Assign Teacher (optional)</option>
                {teachers.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="modern-btn btn-primary" onClick={handleCreate} style={{ height: '42px' }}>
              Create Class
            </button>
          </div>
        </div>

        {/* CLASSROOM LIST */}
        <h2 className="subtitle">Existing Classrooms</h2>

        {classrooms.length === 0 ? (
          <div className="premium-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No classrooms found.
          </div>
        ) : (
          <div className="classroom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {classrooms.map((c) => (
              <div key={c.classId} className="premium-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'var(--primary-color)' }}>
                    {c.name} {c.section && `- ${c.section}`}
                  </h3>

                  <p className="teacher" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    <strong>Teacher:</strong> {c.classTeacherName || "Not Assigned"}
                  </p>
                </div>

                <button
                  className="modern-btn btn-outline"
                  style={{ color: '#ef4444', borderColor: '#fecaca', width: 'auto', alignSelf: 'flex-start' }}
                  onClick={() => handleDelete(c.classId)}
                >
                  Remove Class
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomPage;
