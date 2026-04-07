import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAttendanceByStudent,
  getAllClassSubjects,
  getClassroomById,
} from "../utils/api";

const AttendanceStudent = () => {
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;
  const classroomId = decoded?.classroomId;

  const [attendance, setAttendance] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [myClass, setMyClass] = useState(null);

  // -----------------------------------------------------
  // LOAD CLASS + SUBJECTS
  // -----------------------------------------------------
  const loadClassSubjects = async () => {
    try {
      const cls = await getClassroomById(classroomId);
      setMyClass(cls.data);

      const cs = await getAllClassSubjects();
      const assigned = cs.data.filter((c) => c.classroomId === classroomId);
      setSubjects(assigned);
    } catch (err) {
      console.error("Error loading class/subjects", err);
    }
  };

  // -----------------------------------------------------
  // LOAD ATTENDANCE
  // -----------------------------------------------------
  const loadAttendance = async () => {
    try {
      const res = await getAttendanceByStudent(studentId);
      setAttendance(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId && classroomId) {
      loadAttendance();
      loadClassSubjects();
    }
  }, []);

  // -----------------------------------------------------
  // FILTER HANDLING (subject + date)
  // -----------------------------------------------------
  const applyFilters = () => {
    let data = [...attendance];

    // Filter by subject
    if (selectedSubject !== "ALL") {
      data = data.filter((a) => a.subjectId == selectedSubject);
    }

    // Filter by date range
    if (fromDate) {
      data = data.filter((a) => a.date >= fromDate);
    }
    if (toDate) {
      data = data.filter((a) => a.date <= toDate);
    }

    setFiltered(data);
  };

  const resetFilters = () => {
    setSelectedSubject("ALL");
    setFromDate("");
    setToDate("");
    setFiltered(attendance);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedSubject, fromDate, toDate, attendance]);

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>📘 My Attendance</h2>

      {/* CLASS INFO */}
      {myClass && (
        <p style={{ color: "#666", marginBottom: 20 }}>
          Class: <b>{myClass.name}</b> | Section: <b>{myClass.section}</b>
        </p>
      )}

      {/* FILTERS */}
      <div
        style={{
          background: "#f4f8ff",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <h4>🔎 Filters</h4>

        {/* SUBJECT FILTER */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontWeight: 600, marginRight: 10 }}>
            Subject:
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #bbb",
              width: 250,
            }}
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.subjectId}>
                {s.subjectName}
              </option>
            ))}
          </select>
        </div>

        {/* DATE FILTER */}
        <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
          <div>
            <label>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button onClick={resetFilters} style={resetBtn}>
            Reset
          </button>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      {loading ? (
        <p>Loading attendance...</p>
      ) : filtered.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#e3f2fd", height: 45 }}>
              <th style={th}>Date</th>
              <th style={th}>Subject</th>
              <th style={th}>Period</th>
              <th style={th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((a, idx) => {
              const subjectName =
                subjects.find((s) => s.subjectId === a.subjectId)?.subjectName ||
                "Unknown";

              return (
                <tr
                  key={a.attendanceId}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#f7f7f7",
                    height: 45,
                  }}
                >
                  <td style={td}>{a.date}</td>
                  <td style={td}>{subjectName}</td>
                  <td style={td}>{a.periodNumber}</td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        color: "white",
                        background:
                          a.status === "PRESENT"
                            ? "#4caf50"
                            : a.status === "ABSENT"
                            ? "#e53935"
                            : "#ffb300",
                      }}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

const inputStyle = {
  display: "block",
  marginTop: 5,
  padding: 6,
  borderRadius: 6,
  border: "1px solid #bbb",
};

const resetBtn = {
  background: "#d9534f",
  color: "white",
  padding: "8px 14px",
  borderRadius: 6,
  border: "none",
  marginTop: 22,
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const th = {
  padding: 10,
  borderBottom: "1px solid #ddd",
  fontWeight: 600,
};

const td = {
  padding: 10,
  borderBottom: "1px solid #eee",
};

export default AttendanceStudent;
