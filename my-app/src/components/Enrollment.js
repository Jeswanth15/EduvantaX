import React, { useEffect, useState } from "react";
import {
  getStudentsBySchool,
  getAllClassrooms,
  enrollStudent,
  getAllEnrollments,
  deleteEnrollment,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const Enrollment = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    if (!schoolId) return;

    const loadData = async () => {
      try {
        const s = await getStudentsBySchool(schoolId);
        const c = await getAllClassrooms(schoolId);
        const e = await getAllEnrollments();

        setStudents(s.data.filter((x) => x.approvalStatus === "APPROVED"));
        setClassrooms(c.data);
        setEnrollments(e.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [schoolId]);

  const handleEnroll = async () => {
    if (selectedStudents.length === 0 || !selectedClass)
      return alert("Select at least one student and a class");

    try {
      for (const id of selectedStudents) {
        await enrollStudent({
          studentId: Number(id),
          classroomId: Number(selectedClass),
        });
      }

      alert("Enrollment successful!");

      const updated = await getAllEnrollments();
      setEnrollments(updated.data);

      setSelectedStudents([]);
      setSelectedClass("");
    } catch (err) {
      console.error(err);
      alert("Error enrolling students");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this enrollment?")) return;

    try {
      await deleteEnrollment(id);
      setEnrollments((prev) =>
        prev.filter((item) => item.enrollmentId !== id)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete enrollment");
    }
  };

  return (
    <div className="enrollment-page-wrapper">
      <div className="content-wrapper">
          <h2 className="page-title">Manage Enrollments</h2>

          {/* ENROLL FORM */}
          <div className="form-card">
            <h3>Enroll Students</h3>

            <div className="form-grid">
              <select
                multiple
                value={selectedStudents}
                onChange={(e) =>
                  setSelectedStudents(
                    Array.from(e.target.selectedOptions, (opt) => opt.value)
                  )
                }
                size={5}
              >
                <option disabled>Select Students</option>
                {students.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Classroom</option>
                {classrooms.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="selected-count">
              Selected Students: <b>{selectedStudents.length}</b>
            </p>

            <button className="create-btn" onClick={handleEnroll}>
              Enroll Selected Students
            </button>
          </div>

          {/* ENROLLMENT TABLE */}
          <h3 className="section-title">Enrollment Records</h3>

          <div className="table-box">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Classroom</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.enrollmentId}>
                    <td>{e.enrollmentId}</td>
                    <td>
                      {students.find((s) => s.userId === e.studentId)?.name ||
                        e.studentId}
                    </td>
                    <td>
                      {classrooms.find((c) => c.classId === e.classroomId)
                        ?.name || e.classroomId}
                    </td>
                    <td>{e.enrollmentDate}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(e.enrollmentId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* --- CSS --- */}
      <style>{`
        .page-container {
          display: flex;
          width: 100%;
        }

        .content-area {
          flex: 1;
          background: #f3f5f9;
          min-height: 100vh;
        }

        .content-wrapper {
          padding: 25px;
        }

        .page-title {
          text-align: center;
          font-size: 28px;
          color: #0a4275;
          margin-bottom: 25px;
        }

        .form-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          max-width: 450px;
          margin: auto;
          margin-bottom: 40px;
        }

        .form-grid {
          display: grid;
          gap: 12px;
        }

        select {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        .create-btn {
          width: 100%;
          margin-top: 15px;
          background: #0a4275;
          color: white;
          padding: 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 16px;
        }

        .create-btn:hover {
          background: #06315a;
        }

        .selected-count {
          margin-top: 8px;
          color: #555;
        }

        .section-title {
          text-align: center;
          margin-bottom: 15px;
          color: #333;
          font-size: 22px;
        }

        .table-box {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }

        .styled-table {
          width: 100%;
          border-collapse: collapse;
        }

        .styled-table th {
          background: #0a4275;
          color: white;
          padding: 12px;
        }

        .styled-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .delete-btn {
          background: #e53935;
          padding: 6px 12px;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .delete-btn:hover {
          background: #b71c1c;
        }

        @media (max-width: 900px) {
          .content-area { margin-left: 0; }
        }

        @media (max-width: 480px) {
          .page-title { font-size: 22px; }
          .form-card { padding: 15px; }
        }
      `}</style>
    </div>
  );
};

export default Enrollment;
