import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
  getAllClassrooms,
  getAllSubjects,
  getAllClassSubjects,
  createOrUpdateExamSchedule,
  getAllExamSchedules,
  deleteExamSchedule,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const ExamSchedulePage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);

  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  const [form, setForm] = useState({
    examDate: "",
    startTime: "",
    endTime: "",
    roomNo: "",
  });

  const subjectById = useMemo(() => {
    const map = new Map();
    subjects.forEach((s) => map.set(Number(s.subjectId), s));
    return map;
  }, [subjects]);

  const classById = useMemo(() => {
    const map = new Map();
    classrooms.forEach((c) => map.set(Number(c.classId), c));
    return map;
  }, [classrooms]);

  const subjectsForSelectedClasses = useMemo(() => {
    if (!selectedClassIds.length) return [];
    const set = new Map();
    classSubjects.forEach((cs) => {
      if (selectedClassIds.includes(Number(cs.classroomId))) {
        set.set(cs.subjectId, {
          subjectId: Number(cs.subjectId),
          subjectName: cs.subjectName,
        });
      }
    });
    return [...set.values()];
  }, [selectedClassIds, classSubjects]);

  // Fetch everything
  useEffect(() => {
    if (!schoolId) return;

    const load = async () => {
      try {
        const [cls, subs, cs, exams] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllSubjects(),
          getAllClassSubjects(),
          getAllExamSchedules(),
        ]);

        setClassrooms(cls.data || []);
        setSubjects(subs.data || []);
        setClassSubjects(cs.data || []);
        setExamSchedules(exams.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [schoolId]);

  const handleClassroomsChange = (e) => {
    const list = [...e.target.selectedOptions].map((opt) => Number(opt.value));
    setSelectedClassIds(list);
    setSelectedSubjectIds([]);
  };

  const toggleSubject = (id) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!selectedClassIds.length) return alert("Select at least one class");
    if (!selectedSubjectIds.length) return alert("Select at least one subject");
    if (!form.examDate || !form.startTime || !form.endTime)
      return alert("Fill date and time");

    try {
      const tasks = [];
      for (let classId of selectedClassIds) {
        for (let subjectId of selectedSubjectIds) {
          tasks.push(
            createOrUpdateExamSchedule({
              classroomId: classId,
              subjectId,
              ...form,
            })
          );
        }
      }
      await Promise.all(tasks);
      alert("Exam created!");

      const res = await getAllExamSchedules();
      setExamSchedules(res.data || []);

      setForm({ examDate: "", startTime: "", endTime: "", roomNo: "" });
      setSelectedSubjectIds([]);
    } catch (err) {
      console.error(err);
      alert("Error creating exam");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await deleteExamSchedule(id);
      const res = await getAllExamSchedules();
      setExamSchedules(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="exam-schedule-view">
      <div className="exam-wrapper">
          <h2 className="exam-title">📘 Exam Schedule</h2>

          <div className="exam-layout">

            {/* LEFT FILTERS */}
            <aside className="exam-filters">
              <h3>Filters</h3>

              <label>Classrooms</label>
              <select
                multiple
                value={selectedClassIds}
                onChange={handleClassroomsChange}
                className="input"
                style={{ height: 140 }}
              >
                {classrooms.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>

              <label style={{ marginTop: 15 }}>Subjects</label>

              {selectedClassIds.length === 0 && (
                <p className="muted">Select classes first</p>
              )}

              {selectedClassIds.length > 0 && (
                <div className="subject-grid">
                  {subjectsForSelectedClasses.map((sub) => (
                    <div key={sub.subjectId} className="subject-chip">
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.includes(sub.subjectId)}
                        onChange={() => toggleSubject(sub.subjectId)}
                      />
                      <span>{sub.subjectName}</span>
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* RIGHT SIDE CONTENT */}
            <main className="exam-content">

              {/* CREATE CARD */}
              <div className="card">
                <h3>➕ Create Exam</h3>

                <div className="grid">
                  <div>
                    <label>Date</label>
                    <input
                      type="date"
                      value={form.examDate}
                      onChange={(e) =>
                        setForm({ ...form, examDate: e.target.value })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) =>
                        setForm({ ...form, startTime: e.target.value })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) =>
                        setForm({ ...form, endTime: e.target.value })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label>Room No</label>
                    <input
                      type="text"
                      placeholder="A-203"
                      value={form.roomNo}
                      onChange={(e) =>
                        setForm({ ...form, roomNo: e.target.value })
                      }
                      className="input"
                    />
                  </div>
                </div>

                <button className="btn" onClick={handleCreate}>
                  Save Exam
                </button>
              </div>

              {/* UPCOMING EXAMS */}
              <div className="exam-list">
                <h3>Upcoming Exams</h3>

                {examSchedules.length === 0 && (
                  <p className="muted">No exams yet</p>
                )}

                {examSchedules.map((exam) => (
                  <div key={exam.examScheduleId} className="exam-card">
                    <h4>{exam.subjectName}</h4>

                    <div className="info">
                      <p><strong>Date:</strong> {exam.examDate}</p>
                      <p>
                        <strong>Time:</strong> {exam.startTime} -{" "}
                        {exam.endTime}
                      </p>
                      <p><strong>Room:</strong> {exam.roomNo}</p>
                    </div>

                    <button
                      className="delete"
                      onClick={() => handleDelete(exam.examScheduleId)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

            </main>
          </div>
        </div>

      {/* STYLES */}
      <style>{`
        :root {
          --primary: #0a4275;
          --surface: #f3f5f9;
          --card: #fff;
          --muted: #777;
        }

        .exam-flex {
          display: flex;
        }

        .exam-main {
          flex: 1;
          background: var(--surface);
          min-height: 100vh;
        }

        .exam-wrapper {
          padding: 20px;
          max-width: 1200px;
          margin: auto;
        }

        .exam-title {
          text-align: center;
          color: var(--primary);
          font-size: 28px;
          margin-bottom: 20px;
        }

        .exam-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
        }

        .exam-filters {
          background: var(--card);
          padding: 18px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          height: fit-content;
        }

        .exam-filters h3 {
          margin-bottom: 15px;
        }

        .input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          margin-top: 5px;
        }

        .subject-grid {
          margin-top: 10px;
          display: grid;
          gap: 10px;
        }

        .subject-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #eef3ff;
          border: 1px solid #d6e1ff;
          border-radius: 6px;
        }

        .exam-content .card {
          background: var(--card);
          padding: 18px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          margin-bottom: 25px;
        }

        .grid {
          display: grid;
          gap: 15px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .btn {
          margin-top: 15px;
          padding: 12px;
          width: 100%;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }

        .exam-list h3 {
          margin-bottom: 15px;
        }

        .exam-card {
          background: var(--card);
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 10px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }

        .exam-card h4 {
          margin-bottom: 10px;
          color: var(--primary);
        }

        .info p {
          margin: 4px 0;
        }

        .delete {
          margin-top: 10px;
          background: #d9534f;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .muted {
          color: var(--muted);
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .exam-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ExamSchedulePage;
