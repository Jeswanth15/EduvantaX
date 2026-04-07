import React, { useEffect, useState } from "react";
import {
  getAllClassrooms,
  getAllTimetables,
  getAllEnrollments,
  getAllClassSubjects,
  getCalendarBySchool,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByClassDatePeriod,
} from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import {
  FaFilter, FaUsers, FaUndo, FaCheckCircle,
  FaTrash, FaUserCheck, FaRegCalendarAlt
} from "react-icons/fa";

const Attendance = ({ isTeacher = false }) => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [calendarStatus, setCalendarStatus] = useState(null);
  const [calendarEntryId, setCalendarEntryId] = useState(null);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [alreadyMarked, setAlreadyMarked] = useState({});
  const [loading, setLoading] = useState(false);
  const [studentFetchError, setStudentFetchError] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const getDayShort = (date) => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return days[new Date(date).getDay()];
  };

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      setLoading(true);
      try {
        const [cRes, tRes, csRes] = await Promise.all([
          getAllClassrooms(schoolId),
          getAllTimetables(),
          getAllClassSubjects(),
        ]);
        setClassrooms(cRes.data || []);
        setTimetables(tRes.data || []);
        setClassSubjects(csRes.data || []);
      } catch (err) {
        console.error("Initial load error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [schoolId]);

  const classSubjectsForClass = () =>
    classSubjects.filter((cs) => cs.classroomId === selectedClassId);

  const availablePeriodsForSubject = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return [];
    const day = getDayShort(selectedDate);
    return timetables
      .filter(
        (t) =>
          t.classroomId === selectedClassId &&
          t.subjectId === selectedSubjectId &&
          t.dayOfWeek.substring(0, 3).toUpperCase() === day
      )
      .map((t) => t.periodNumber)
      .sort((a, b) => a - b);
  };

  useEffect(() => {
    const p = availablePeriodsForSubject();
    setSelectedPeriod(p.length > 0 ? p[0] : null);
  }, [selectedSubjectId, selectedDate, timetables]);

  const checkCalendarForDate = async (date) => {
    if (!date) {
      setCalendarStatus(null);
      setCalendarEntryId(null);
      return;
    }
    try {
      const res = await getCalendarBySchool(schoolId);
      const entries = res.data || [];
      const found = entries.find((e) => e.date.split("T")[0] === date);
      if (found) {
        setCalendarStatus(found.status);
        setCalendarEntryId(found.calendarId);
      } else {
        setCalendarStatus("WORKING");
        setCalendarEntryId(null);
      }
    } catch (err) {
      console.error("Calendar check error", err);
      setCalendarStatus(null);
      setCalendarEntryId(null);
    }
  };

  const fetchAttendanceForPeriod = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod) {
      setStudents([]);
      setAttendanceMap({});
      setAlreadyMarked({});
      return;
    }

    setLoading(true);
    setStudentFetchError("");
    try {
      await checkCalendarForDate(selectedDate);
      const enrollRes = await getAllEnrollments();
      const filtered = (enrollRes.data || []).filter(
        (en) => en.classroomId === selectedClassId
      );

      const studentList = filtered.map((s) => ({
        studentId: s.studentId,
        name: s.studentName,
      }));
      setStudents(studentList);

      const attRes = await getAttendanceByClassDatePeriod(
        selectedClassId,
        selectedSubjectId,
        selectedDate,
        selectedPeriod
      );
      const existing = attRes.data || [];
      const map = {};
      const markers = {};

      studentList.forEach((stu) => {
        const match = existing.find((a) => a.studentId === stu.studentId);
        if (match) {
          map[stu.studentId] = {
            status: match.status === "ABSENT" ? "ABSENT" : "PRESENT",
            attendanceId: match.attendanceId,
          };
          markers[stu.studentId] = true;
        } else {
          map[stu.studentId] = { status: "PRESENT", attendanceId: null };
        }
      });

      setAttendanceMap(map);
      setAlreadyMarked(markers);
      setSelectAll(studentList.length > 0 && studentList.every(s => map[s.studentId].status === "PRESENT"));
    } catch (err) {
      console.error("Fetch attendance error", err);
      setStudentFetchError("Failed to fetch students/attendance");
      setStudents([]);
      setAttendanceMap({});
      setAlreadyMarked({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceForPeriod();
  }, [selectedClassId, selectedSubjectId, selectedDate, selectedPeriod]);

  const setStudentStatus = (studentId, status) => {
    setAttendanceMap((prev) => {
      const next = {
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), status },
      };
      setSelectAll(
        students.length > 0 && students.every(s => next[s.studentId]?.status === "PRESENT")
      );
      return next;
    });
  };

  const toggleSelectAll = () => {
    const newVal = !selectAll;
    setSelectAll(newVal);
    setAttendanceMap((prev) => {
      const copy = { ...prev };
      students.forEach((s) => {
        copy[s.studentId] = { ...(copy[s.studentId] || {}), status: newVal ? "PRESENT" : "ABSENT" };
      });
      return copy;
    });
  };

  const submitAttendanceHandler = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod) {
      alert("Please select Class, Subject, Date and Period");
      return;
    }

    setLoading(true);
    try {
      const ops = students.map((stu) => {
        const info = attendanceMap[stu.studentId] || { status: "PRESENT", attendanceId: null };
        const payload = {
          studentId: stu.studentId,
          classroomId: selectedClassId,
          subjectId: selectedSubjectId,
          calendarId: calendarEntryId,
          date: selectedDate,
          periodNumber: selectedPeriod,
          status: info.status,
        };
        return info.attendanceId
          ? updateAttendance(info.attendanceId, payload)
          : createAttendance(payload);
      });

      await Promise.all(ops);
      await fetchAttendanceForPeriod();
      alert("Attendance saved successfully");
    } catch (err) {
      console.error("Save attendance error", err);
      alert("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    const info = attendanceMap[studentId];
    if (!info?.attendanceId) return;

    if (!window.confirm("Delete this attendance record?")) return;

    setLoading(true);
    try {
      await deleteAttendance(info.attendanceId);
      await fetchAttendanceForPeriod();
    } catch (err) {
      console.error("Delete attendance error", err);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const presentCount = students.filter((s) => attendanceMap[s.studentId]?.status === "PRESENT").length;
  const absentCount = students.filter((s) => attendanceMap[s.studentId]?.status === "ABSENT").length;

  const subjectNameFromId = (id) => {
    const cs = classSubjects.find((c) => c.subjectId === id);
    return cs?.subjectName || "";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Attendance Management</h1>
        <p style={styles.subtitle}>Track and record student presence across classes</p>
      </div>

      <div className="grid-side-main" style={{alignItems: "start"}}>
        <div style={styles.filterCol}>
          <div className="premium-card" style={styles.filterCard}>
            <h3 style={styles.sectionTitle}>
              <FaFilter size={14} /> Attendance Filters
            </h3>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Academic Class</label>
              <select
                className="modern-input"
                value={selectedClassId || ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedClassId(val);
                  setSelectedSubjectId(null);
                  setSelectedDate("");
                  setSelectedPeriod(null);
                  setStudents([]);
                  setAttendanceMap({});
                  setAlreadyMarked({});
                }}
              >
                <option value="">-- Choose Class --</option>
                {classrooms.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.name} {c.section ? `- ${c.section}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Subject</label>
              <select
                className="modern-input"
                value={selectedSubjectId || ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedSubjectId(val);
                  setSelectedPeriod(null);
                }}
                disabled={!selectedClassId}
              >
                <option value="">-- Choose Subject --</option>
                {classSubjectsForClass().map((cs) => (
                  <option key={cs.id} value={cs.subjectId}>
                    {cs.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Record Date</label>
              <input
                type="date"
                className="modern-input"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedPeriod(null);
                  if (e.target.value) checkCalendarForDate(e.target.value);
                }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Academic Period</label>
              <select
                className="modern-input"
                value={selectedPeriod || ""}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                disabled={!selectedSubjectId || !selectedDate}
              >
                <option value="">-- Choose Period --</option>
                {availablePeriodsForSubject().map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.calendarInfo}>
              <FaRegCalendarAlt size={12} />
              <span>System Day: <strong>{calendarStatus || "Not Checked"}</strong></span>
            </div>

            <div style={styles.filterFooter}>
              <button
                className="modern-btn btn-primary"
                style={{ flex: 1 }}
                onClick={submitAttendanceHandler}
                disabled={!students.length || loading}
              >
                {loading ? "Syncing..." : "Commit Record"}
              </button>
              <button
                className="modern-btn btn-outline"
                onClick={() => {
                  setSelectedClassId(null);
                  setSelectedSubjectId(null);
                  setSelectedDate("");
                  setSelectedPeriod(null);
                  setStudents([]);
                  setAttendanceMap({});
                  setAlreadyMarked({});
                }}
              >
                <FaUndo />
              </button>
            </div>
          </div>

          {students.length > 0 && (
            <div className="premium-card" style={styles.summaryCard}>
              <h3 style={styles.sectionTitle}><FaUsers /> Record Summary</h3>
              <div style={styles.summaryStats}>
                <div style={styles.statLine}>
                  <span style={styles.statLabel}>Present</span>
                  <span style={{ ...styles.statValue, color: "var(--success-color)" }}>{presentCount}</span>
                </div>
                <div style={styles.statLine}>
                  <span style={styles.statLabel}>Absent</span>
                  <span style={{ ...styles.statValue, color: "var(--error-color)" }}>{absentCount}</span>
                </div>
                <div style={styles.statLine}>
                  <span style={styles.statLabel}>Total Cohort</span>
                  <span style={styles.statValue}>{students.length}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${(presentCount / students.length) * 100}%`,
                    backgroundColor: "var(--success-color)"
                  }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.contentCol}>
          {!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod ? (
            <div className="premium-card" style={styles.emptyState}>
              <FaUserCheck size={48} style={{ opacity: 0.1, marginBottom: "20px" }} />
              <h3>Ready to Mark</h3>
              <p>Configure your filters on the left to load the pupil list for this session.</p>
            </div>
          ) : (
            <div className="premium-card" style={styles.listCard}>
              <div style={styles.listHeader}>
                <div>
                  <h3 style={styles.listTitle}>
                    {classrooms.find(c => c.classId === selectedClassId)?.name} • {subjectNameFromId(selectedSubjectId)}
                  </h3>
                  <p style={styles.listSubtitle}>Period {selectedPeriod} | {new Date(selectedDate).toLocaleDateString()}</p>
                </div>
                <div style={styles.headerActions}>
                  <label style={styles.checkAllLabel}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                    <span>Mark All Present</span>
                  </label>
                </div>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Student Name</th>
                      <th style={styles.th}>Presence Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu, idx) => {
                      const info = attendanceMap[stu.studentId] || { status: "PRESENT", attendanceId: null };
                      return (
                        <tr key={stu.studentId} style={{
                          ...styles.tr,
                          backgroundColor: info.status === "ABSENT" ? "rgba(239, 68, 68, 0.03)" : "transparent"
                        }}>
                          <td style={styles.td}>{idx + 1}</td>
                          <td style={styles.td}>
                            <div style={styles.studentCell}>
                              <div style={styles.avatarMini}>{stu.name.charAt(0)}</div>
                              <span style={styles.name}>{stu.name}</span>
                              {alreadyMarked[stu.studentId] && <FaCheckCircle style={styles.savedIcon} title="Already synchronized" />}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <select
                              style={{
                                ...styles.statusSelect,
                                color: info.status === "PRESENT" ? "var(--success-color)" : "var(--error-color)"
                              }}
                              value={info.status}
                              onChange={(e) => setStudentStatus(stu.studentId, e.target.value)}
                            >
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                            </select>
                          </td>
                          <td style={styles.td}>
                            {info.attendanceId && (
                              <button
                                style={styles.deleteBtn}
                                onClick={() => handleDelete(stu.studentId)}
                                title="Clear record"
                              >
                                <FaTrash size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1100px",
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
  filterCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  filterCard: {
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
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  filterGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  calendarInfo: {
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "var(--background-color)",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  filterFooter: {
    display: "flex",
    gap: "10px",
  },
  summaryCard: {
    padding: "20px",
  },
  summaryStats: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
  },
  progressBar: {
    height: "6px",
    backgroundColor: "var(--border-color)",
    borderRadius: "3px",
    overflow: "hidden",
    marginTop: "8px",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  contentCol: {
    minWidth: 0,
  },
  emptyState: {
    padding: "80px 40px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  listCard: {
    padding: "0",
    overflow: "hidden",
  },
  listHeader: {
    padding: "24px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  listTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
  },
  listSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
  },
  checkAllLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--primary-color)",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "6px",
    backgroundColor: "rgba(30, 136, 229, 0.05)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px 24px",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-muted)",
    backgroundColor: "var(--background-color)",
    borderBottom: "1px solid var(--border-color)",
  },
  tr: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "14px 24px",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  studentCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatarMini: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-secondary)",
  },
  name: {
    fontWeight: "500",
    color: "var(--text-primary)",
  },
  savedIcon: {
    color: "var(--success-color)",
    fontSize: "12px",
  },
  statusSelect: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-color)",
    backgroundColor: "white",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    outline: "none",
  },
  deleteBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "var(--error-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  }
};

export default Attendance;
