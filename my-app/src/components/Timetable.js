import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getAllClassrooms,
  getAllClassSubjects, // added
  getAllTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getEnrolledTeachers,
} from "../utils/api";

import "./../styles/Timetable.css";

const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const periods = [1, 2, 3, 4, 5, 6, 7];

const Timetable = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]); // subjects assigned to classes
  const [timetables, setTimetables] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [gridData, setGridData] = useState({});

  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        const [classRes, classSubRes, timetableRes] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllClassSubjects(),
          getAllTimetables(),
        ]);
        setClassrooms(classRes.data);
        setClassSubjects(classSubRes.data); // store class-subject mapping
        setTimetables(timetableRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClass) return;

    const load = async () => {

      const classTimetables = timetables
        .filter(t => t.classroomId === selectedClass.classId)
        .map(t => ({
          ...t,
          dayOfWeek: t.dayOfWeek.substring(0, 3).toUpperCase(),
          periodNumber: Number(t.periodNumber)
        }));

      const g = {};

      daysOfWeek.forEach(d => {
        g[d] = {};
        periods.forEach(p => {
          const entry = classTimetables.find(
            t => t.dayOfWeek === d && t.periodNumber === p
          );

          g[d][p] = {
            subjectId: entry?.subjectId || "",
            teacherId: entry?.teacherId || "",
            timetableId: entry?.timetableId || null,
            availableSubjects: [],
            availableTeachers: [],
          };
        });
      });

      // subjects of this class
      const subs = classSubjects
        .filter(cs => cs.classroomId === selectedClass.classId)
        .map(cs => ({ subjectId: cs.subjectId, name: cs.subjectName }));

      // assign subjects
      daysOfWeek.forEach(d => {
        periods.forEach(p => {
          g[d][p].availableSubjects = subs;
        });
      });

      // IMPORTANT PART
      for (const d of daysOfWeek) {
        for (const p of periods) {
          const c = g[d][p];

          if (!c.subjectId) continue;

          try {
            const res = await getEnrolledTeachers(selectedClass.classId, Number(c.subjectId));
            c.availableTeachers = res.data || [];
          } catch { }
        }
      }

      setGridData(g);
    };

    load();

  }, [selectedClass, timetables, classSubjects]);


  const handleChangeCell = async (day, period, field, value) => {
    setGridData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: { ...prev[day][period], [field]: value },
      },
    }));

    // If subject changed, fetch assigned teachers for this class & subject
    if (field === "subjectId" && value) {
      try {
        const res = await getEnrolledTeachers(selectedClass.classId, Number(value));
        setGridData(prev => ({
          ...prev,
          [day]: {
            ...prev[day],
            [period]: {
              ...prev[day][period],
              availableTeachers: res.data,
              teacherId: "", // reset teacher selection
            },
          },
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteCell = (day, period) => {
    setGridData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: {
          subjectId: "",
          teacherId: "",
          timetableId: null,
          availableSubjects: prev[day][period].availableSubjects,
          availableTeachers: [],
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;

    try {
      for (const day of daysOfWeek) {
        for (const period of periods) {
          const cell = gridData[day][period];
          if (!cell.subjectId || !cell.teacherId) continue;

          const payload = {
            classroomId: selectedClass.classId,
            subjectId: Number(cell.subjectId),
            teacherId: Number(cell.teacherId),
            dayOfWeek: day,
            periodNumber: period,
          };

          if (cell.timetableId) await updateTimetable(cell.timetableId, payload);
          else await createTimetable(payload);
        }
      }

      const res = await getAllTimetables();
      setTimetables(res.data);
      alert("Timetable saved successfully!");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error saving timetable";
      alert(msg);
    }
  };

  return (
    <div className="timetable-page-wrapper">
      <div style={{ padding: "20px" }}>
        <h2>Manage Timetable</h2>

        {/* Select Class */}
        <div style={{ marginBottom: "20px" }}>
          <select
            className="modern-input"
            style={{ width: 'auto' }}
            value={selectedClass?.classId || ""}
            onChange={e =>
              setSelectedClass(classrooms.find(c => c.classId === Number(e.target.value)))
            }
          >
            <option value="">Select Class & Section</option>
            {classrooms.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.name} {c.section ? `- ${c.section}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Timetable Grid */}
        {selectedClass && (
          <div style={{ overflowX: "auto" }}>
            <table className="tt-table" style={{ width: "100%", textAlign: "center" }}>
              <thead>
                <tr>
                  <th>Period / Day</th>
                  {daysOfWeek.map(day => <th key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {periods.map(period => (
                  <tr key={period}>
                    <td style={{ fontWeight: "bold" }}>{period}</td>
                    {daysOfWeek.map(day => {
                      const cell = gridData[day]?.[period] || {
                        subjectId: "",
                        teacherId: "",
                        timetableId: null,
                        availableSubjects: [],
                        availableTeachers: [],
                      };
                      return (
                        <td key={day} style={{ border: "1px solid var(--border-color)", padding: "12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {/* Subject Dropdown */}
                            <select
                              className="modern-input"
                              style={{ fontSize: '13px', padding: '6px' }}
                              value={cell.subjectId}
                              onChange={e =>
                                handleChangeCell(day, period, "subjectId", e.target.value)
                              }
                            >
                              <option value="">Subject</option>
                              {cell.availableSubjects.map(s => (
                                <option key={s.subjectId} value={s.subjectId}>{s.name}</option>
                              ))}
                            </select>

                            {/* Teacher Dropdown */}
                            <select
                              className="modern-input"
                              style={{ fontSize: '13px', padding: '6px' }}
                              value={cell.teacherId}
                              onChange={e =>
                                handleChangeCell(day, period, "teacherId", e.target.value)
                              }
                            >
                              <option value="">Teacher</option>
                              {cell.availableTeachers.map(t => (
                                <option key={t.userId} value={t.userId}>{t.name}</option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="modern-btn btn-outline"
                              onClick={() => handleDeleteCell(day, period)}
                              style={{
                                padding: "4px",
                                fontSize: '11px',
                                color: '#ef4444',
                                borderColor: '#fecaca'
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="modern-btn btn-primary" onClick={handleSave} style={{ marginTop: "20px" }}>
              Save Timetable
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;
