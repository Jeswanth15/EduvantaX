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
  const [selectAll, setSelectAll] = useState(false);

  const getDayShort = (date) => ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date(date).getDay()];

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    Promise.all([
      getAllClassrooms(schoolId),
      getAllTimetables(),
      getAllClassSubjects(),
    ]).then(([c, t, cs]) => {
      setClassrooms(c.data || []);
      setTimetables(t.data || []);
      setClassSubjects(cs.data || []);
    }).catch(console.error).finally(()=>setLoading(false));
  }, [schoolId]);

  const classSubjectsForClass = () => classSubjects.filter((cs) => cs.classroomId === selectedClassId);

  const availablePeriodsForSubject = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return [];
    const day = getDayShort(selectedDate);
    return timetables.filter(t => t.classroomId === selectedClassId && t.subjectId === selectedSubjectId && t.dayOfWeek.substring(0, 3).toUpperCase() === day)
      .map(t => t.periodNumber).sort((a, b) => a - b);
  };

  useEffect(() => {
    const p = availablePeriodsForSubject();
    setSelectedPeriod(p.length > 0 ? p[0] : null);
  }, [selectedSubjectId, selectedDate, timetables]);

  const checkCalendarForDate = async (date) => {
    if (!date) { setCalendarStatus(null); setCalendarEntryId(null); return; }
    try {
      const res = await getCalendarBySchool(schoolId);
      const found = (res.data || []).find((e) => e.date.split("T")[0] === date);
      setCalendarStatus(found ? found.status : "WORKING");
      setCalendarEntryId(found ? found.calendarId : null);
    } catch { setCalendarStatus(null); setCalendarEntryId(null); }
  };

  const fetchAttendanceForPeriod = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod) {
      setStudents([]); setAttendanceMap({}); setAlreadyMarked({}); return;
    }
    setLoading(true);
    try {
      await checkCalendarForDate(selectedDate);
      const enrollRes = await getAllEnrollments();
      const studentList = (enrollRes.data || []).filter(en => en.classroomId === selectedClassId)
         .map(s => ({ studentId: s.studentId, name: s.studentName }));
      
      setStudents(studentList);
      const attRes = await getAttendanceByClassDatePeriod(selectedClassId, selectedSubjectId, selectedDate, selectedPeriod);
      const existing = attRes.data || [];
      const map = {}; const markers = {};
      
      studentList.forEach(stu => {
        const match = existing.find(a => a.studentId === stu.studentId);
        if (match) {
          map[stu.studentId] = { status: match.status === "ABSENT" ? "ABSENT" : "PRESENT", attendanceId: match.attendanceId };
          markers[stu.studentId] = true;
        } else map[stu.studentId] = { status: "PRESENT", attendanceId: null };
      });
      setAttendanceMap(map);
      setAlreadyMarked(markers);
      setSelectAll(studentList.length > 0 && studentList.every(s => map[s.studentId].status === "PRESENT"));
    } catch (e) {
      console.error(e);
      setStudents([]); setAttendanceMap({}); setAlreadyMarked({});
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAttendanceForPeriod();
  }, [selectedClassId, selectedSubjectId, selectedDate, selectedPeriod]);

  const setStudentStatus = (studentId, status) => {
    setAttendanceMap(p => {
      const next = { ...p, [studentId]: { ...p[studentId], status } };
      setSelectAll(students.every(s => next[s.studentId]?.status === "PRESENT"));
      return next;
    });
  };

  const toggleSelectAll = () => {
    const newVal = !selectAll;
    setSelectAll(newVal);
    setAttendanceMap(p => {
      const copy = { ...p };
      students.forEach(s => { copy[s.studentId] = { ...copy[s.studentId], status: newVal ? "PRESENT" : "ABSENT" }; });
      return copy;
    });
  };

  const submitAttendanceHandler = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod) return alert("Select Class, Subject, Date, Period");
    setLoading(true);
    try {
      const ops = students.map(stu => {
        const info = attendanceMap[stu.studentId] || { status: "PRESENT", attendanceId: null };
        const payload = { studentId: stu.studentId, classroomId: selectedClassId, subjectId: selectedSubjectId, calendarId: calendarEntryId, date: selectedDate, periodNumber: selectedPeriod, status: info.status };
        return info.attendanceId ? updateAttendance(info.attendanceId, payload) : createAttendance(payload);
      });
      await Promise.all(ops);
      await fetchAttendanceForPeriod();
      alert("Attendance synchronized.");
    } catch (e) { console.error(e); alert("Failed to save."); } finally { setLoading(false); }
  };

  const handleDelete = async (studentId) => {
    const info = attendanceMap[studentId];
    if (!info?.attendanceId) return;
    if (!window.confirm("Clear record?")) return;
    setLoading(true);
    try { await deleteAttendance(info.attendanceId); await fetchAttendanceForPeriod(); } 
    catch { alert("Delete failed"); } finally { setLoading(false); }
  };

  const presentCount = students.filter((s) => attendanceMap[s.studentId]?.status === "PRESENT").length;
  const absentCount = students.filter((s) => attendanceMap[s.studentId]?.status === "ABSENT").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Attendance Directory</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Track and record student presence automatically synced to the server.</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:28, alignItems:"start" }}>
        
        {/* Left Column (Filters) */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Session Filter</h3>
            
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Academic Class</label>
                <select className="form-input" style={{borderRadius:12}} value={selectedClassId||""} onChange={e=>{ setSelectedClassId(e.target.value?Number(e.target.value):null); setSelectedSubjectId(null); setSelectedDate(""); setSelectedPeriod(null); }}>
                  <option value="">Choose Class</option>
                  {classrooms.map(c => <option key={c.classId} value={c.classId}>{c.name} {c.section?`- ${c.section}`:""}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Subject</label>
                <select className="form-input" style={{borderRadius:12}} value={selectedSubjectId||""} onChange={e=>{ setSelectedSubjectId(e.target.value?Number(e.target.value):null); setSelectedPeriod(null); }} disabled={!selectedClassId}>
                  <option value="">Choose Subject</option>
                  {classSubjectsForClass().map(cs => <option key={cs.id} value={cs.subjectId}>{cs.subjectName}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Record Date</label>
                <input type="date" className="form-input" style={{borderRadius:12}} value={selectedDate} onChange={e=>{ setSelectedDate(e.target.value); setSelectedPeriod(null); if(e.target.value) checkCalendarForDate(e.target.value); }} />
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Period</label>
                <select className="form-input" style={{borderRadius:12}} value={selectedPeriod||""} onChange={e=>setSelectedPeriod(Number(e.target.value))} disabled={!selectedSubjectId || !selectedDate}>
                  <option value="">Choose Period</option>
                  {availablePeriodsForSubject().map(p => <option key={p} value={p}>Period {p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ padding:"12px", background:"var(--surface-2)", borderRadius:12, marginTop:20, fontSize:12, color:"var(--text-secondary)", border:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", fontWeight:600 }}>
              <span>School Day Status:</span>
              <span style={{ color: calendarStatus==="WORKING"?"#10b981":(calendarStatus==="HOLIDAY"?"#ef4444":"#fb923c") }}>{calendarStatus || "Auto-detect"}</span>
            </div>

            <button onClick={submitAttendanceHandler} disabled={!students.length || loading} style={{ width:"100%", padding:"12px", borderRadius:12, background:"linear-gradient(135deg, #3b82f6, #2563eb)", color:"white", border:"none", fontWeight:700, fontSize:14, marginTop:20, cursor:"pointer", transition:"all 0.2s", boxShadow:"0 4px 12px rgba(37,99,235,0.25)", opacity:!students.length || loading?0.6:1 }}>
              {loading ? "Synchronizing…" : "Commit Register"}
            </button>
          </div>
          
          {students.length > 0 && (
            <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", display:"flex", justifyContent:"space-between", alignItems:"center", margin:"0 0 16px" }}>
                <span>Summary</span> <span style={{fontSize:12, backgroundColor:"var(--surface-2)", padding:"2px 8px", borderRadius:99}}>{students.length} Total</span>
              </h3>
              <div style={{ display:"flex", justifyContent:"space-around", textAlign:"center" }}>
                <div><div style={{fontSize:24, fontWeight:900, color:"#10b981"}}>{presentCount}</div><div style={{fontSize:11, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase"}}>Present</div></div>
                <div><div style={{fontSize:24, fontWeight:900, color:"#ef4444"}}>{absentCount}</div><div style={{fontSize:11, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase"}}>Absent</div></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (List) */}
        <div>
          {!selectedClassId || !selectedSubjectId || !selectedDate || !selectedPeriod ? (
            <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:24, minHeight:400, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", textAlign:"center", padding:40 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
              <h3 style={{ fontSize:18, fontWeight:700, margin:"0 0 8px", color:"var(--text-secondary)" }}>Waiting for configuration</h3>
              <p style={{ fontSize:14, maxWidth:300, lineHeight:1.5, margin:0 }}>Select a class, subject, date and period on the left to load the attendance register.</p>
            </div>
          ) : (
            <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden", animation:"pageEnter 0.4s ease-out" }}>
              <div style={{ padding:"20px 24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:800, margin:0, color:"var(--text-primary)" }}>{classrooms.find(c=>c.classId===selectedClassId)?.name} • Period {selectedPeriod}</h2>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600, marginTop:4 }}>{classSubjects.find(cs=>cs.subjectId===selectedSubjectId)?.subjectName} | {new Date(selectedDate).toDateString()}</div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color:"var(--primary-color)", cursor:"pointer", padding:"8px 12px", background:"rgba(59,130,246,0.1)", borderRadius:99, border:"1px solid rgba(59,130,246,0.2)" }}>
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{accentColor:"var(--primary-color)", width:16, height:16, cursor:"pointer"}} /> Mark All Present
                </label>
              </div>

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:"left", padding:"14px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)" }}>Student</th>
                      <th style={{ textAlign:"left", padding:"14px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)" }}>Status</th>
                      <th style={{ textAlign:"right", padding:"14px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => {
                      const info = attendanceMap[stu.studentId] || { status: "PRESENT", attendanceId: null };
                      const isPresent = info.status === "PRESENT";
                      return (
                        <tr key={stu.studentId} style={{ borderBottom:"1px solid var(--border-subtle)", background: isPresent ? "transparent" : "rgba(239,68,68,0.03)", transition:"all 0.2s" }}>
                          <td style={{ padding:"16px 24px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                              <div style={{ width:32, height:32, borderRadius:10, background:"var(--surface-2)", border:"1px solid var(--border-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"var(--text-secondary)" }}>{stu.name.charAt(0)}</div>
                              <div>
                                <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{stu.name}</div>
                                {alreadyMarked[stu.studentId] && <div style={{ fontSize:10.5, fontWeight:700, color:"#10b981", marginTop:2 }}>✓ Synced to Server</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"16px 24px" }}>
                            <div style={{ display:"inline-flex", background:"var(--surface-2)", borderRadius:99, border:"1px solid var(--border-subtle)", padding:"2px", gap:2 }}>
                              <button onClick={()=>setStudentStatus(stu.studentId, "PRESENT")} style={{ padding:"6px 16px", borderRadius:99, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", transition:"all 0.2s", background: isPresent?"#10b981":"transparent", color: isPresent?"white":"var(--text-secondary)", boxShadow: isPresent?"0 2px 8px rgba(16,185,129,0.3)":"none" }}>Present</button>
                              <button onClick={()=>setStudentStatus(stu.studentId, "ABSENT")} style={{ padding:"6px 16px", borderRadius:99, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", transition:"all 0.2s", background: !isPresent?"#ef4444":"transparent", color: !isPresent?"white":"var(--text-secondary)", boxShadow: !isPresent?"0 2px 8px rgba(239,68,68,0.3)":"none" }}>Absent</button>
                            </div>
                          </td>
                          <td style={{ padding:"16px 24px", textAlign:"right" }}>
                            {info.attendanceId ? (
                              <button onClick={()=>handleDelete(stu.studentId)} style={{ width:32, height:32, borderRadius:8, border:"none", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }} title="Remove Record">✕</button>
                            ) : <span style={{fontSize:12, color:"var(--text-tertiary)", fontWeight:500}}>Unsaved</span>}
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

export default Attendance;
