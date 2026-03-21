import React, { useEffect, useState } from "react";

import { getDecodedToken } from "../utils/authHelper";
import {
  getAllTimetables,
  getAllClassSubjects,
  getClassroomById
} from "../utils/api";

const StudentTimetable = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;
  const role = decoded?.role;

  const [timetable, setTimetable] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [loading, setLoading] = useState(true);

  const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const FULL_DAY_MAP = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday"
  };

  const MAX_PERIODS = 7;

  useEffect(() => {
    const loadData = async () => {
      if (!classroomId) return;

      try {
        setLoading(true);

        const cls = await getClassroomById(classroomId);
        setMyClass(cls.data);

        const tt = await getAllTimetables();
        setTimetable(tt.data.filter((t) => t.classroomId === classroomId));

        const cs = await getAllClassSubjects();
        setClassSubjects(cs.data.filter((c) => c.classroomId === classroomId));
      } catch (err) {
        console.error("Timetable load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classroomId]);

  if (role !== "STUDENT")
    return <h2>You are not allowed to view this page</h2>;

  // SUBJECT NAME
  const getSubjectName = (subjectId) => {
    const s = classSubjects.find((c) => c.subjectId === subjectId);
    return s?.subjectName || "-";
  };

  return (
    <div className="container">
      {/* Inject SAME UI CSS used in Teacher Dashboard */}
      <style>{`
        .container {
          max-width: 1100px;
          margin: auto;
        }

        .card {
          background: white;
          padding: 18px;
          border-radius: 12px;
          box-shadow: 0 8px 22px rgba(18,25,40,0.06);
          margin-bottom: 20px;
        }

        .tt-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          min-width: 760px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .tt-table th {
          padding: 14px;
          background: #eefcee;
          border-bottom: 2px solid #d7f5d2;
          text-align: center;
          font-weight: 700;
        }

        .tt-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f4f9;
          text-align: center;
          font-weight: 600;
        }

        .day-col {
          background: #dfffe0;
          font-weight: 700 !important;
        }

        .period-col {
          font-weight: 700;
        }
      `}</style>

      <h2 style={{ marginBottom: 20 }}>🕒 My Timetable</h2>

      {loading && <div className="card">Loading timetable...</div>}

      {!loading && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="tt-table">
            <thead>
              <tr>
                <th className="period-col">Day</th>
                {Array.from({ length: MAX_PERIODS }, (_, i) => (
                  <th key={i}>Period {i + 1}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {DAY_KEYS.map((dayKey) => (
                <tr key={dayKey}>
                  <td className="day-col">{FULL_DAY_MAP[dayKey]}</td>

                  {Array.from({ length: MAX_PERIODS }, (_, p) => p + 1).map(
                    (period) => {
                      const slot = timetable.find(
                        (t) =>
                          t.dayOfWeek
                            .toUpperCase()
                            .startsWith(dayKey) &&
                          Number(t.periodNumber) === period
                      );

                      return (
                        <td key={period}>
                          {slot ? getSubjectName(slot.subjectId) : "-"}
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
