import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAttendanceByStudent, getAllClassSubjects, getClassroomById } from "../utils/api";

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

  useEffect(() => {
    if (!studentId || !classroomId) return;
    const init = async () => {
      try {
        const [cls, cs, att] = await Promise.all([
          getClassroomById(classroomId),
          getAllClassSubjects(),
          getAttendanceByStudent(studentId)
        ]);
        setMyClass(cls.data);
        setSubjects((cs.data||[]).filter(c => c.classroomId === classroomId));
        setAttendance(att.data||[]);
        setFiltered(att.data||[]);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    init();
  }, [studentId, classroomId]);

  useEffect(() => {
    let data = [...attendance];
    if (selectedSubject !== "ALL") data = data.filter(a => a.subjectId === parseInt(selectedSubject));
    if (fromDate) data = data.filter(a => a.date >= fromDate);
    if (toDate) data = data.filter(a => a.date <= toDate);
    setFiltered(data);
  }, [selectedSubject, fromDate, toDate, attendance]);

  const resetFilters = () => { setSelectedSubject("ALL"); setFromDate(""); setToDate(""); };

  const getPercentage = () => {
    if(filtered.length === 0) return 0;
    const present = filtered.filter(a=>a.status==="PRESENT").length;
    return Math.round((present / filtered.length) * 100);
  };

  const currentPercent = getPercentage();

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading attendance data...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Presence Hub</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Track your daily attendance statistics.</p>
        </div>
      </div>

      <div className="responsive-grid-1-2">
        
        {/* Left Col - Stats & Filters */}
        <div style={{ display:"flex", flexDirection:"column", gap:24, position:"sticky", top:20 }}>
           <div style={{ background:"linear-gradient(135deg, #10b981, #059669)", borderRadius:24, padding:32, color:"white", boxShadow:"0 12px 32px rgba(16,185,129,0.25)" }}>
              <div style={{ fontSize:12, fontWeight:800, color:"#a7f3d0", textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Filtered Ratio</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                 <div style={{ fontSize:56, fontWeight:900, fontFamily:"'Outfit', sans-serif", lineHeight:1 }}>{currentPercent}</div>
                 <div style={{ fontSize:24, fontWeight:700, color:"#a7f3d0" }}>%</div>
              </div>
              <div style={{ marginTop:16, fontSize:13, color:"#ecfdf5", fontWeight:500 }}>{filtered.filter(a=>a.status==="PRESENT").length} Days Present</div>
           </div>

           <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                 <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:0 }}>Refine Data</h3>
                 <button onClick={resetFilters} style={{ fontSize:11, fontWeight:700, color:"var(--primary-color)", background:"none", border:"none", cursor:"pointer" }}>Reset</button>
              </div>
              
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                 <div>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6, display:"block" }}>Subject</label>
                    <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} className="form-input" style={{ borderRadius:10 }}>
                       <option value="ALL">All Subjects</option>
                       {subjects.map(s=><option key={s.id} value={s.subjectId}>{s.subjectName}</option>)}
                    </select>
                 </div>
                 <div className="grid-2-col-responsive" style={{ gap:12 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6, display:"block" }}>From</label>
                      <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="form-input" style={{ borderRadius:10, fontSize:12 }} />
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:6, display:"block" }}>To</label>
                      <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="form-input" style={{ borderRadius:10, fontSize:12 }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Col - Logs */}
        <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
           <div style={{ padding:"20px 24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-subtle)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)" }}>{filtered.length} Displayed Records</div>
           </div>
           
           {filtered.length === 0 ? <div style={{ padding:60, textAlign:"center", color:"var(--text-tertiary)" }}>No records match those criteria.</div> : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                 <thead style={{ background:"var(--surface-1)" }}>
                    <tr>
                       <th style={{ textAlign:"left", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Time Index</th>
                       <th style={{ textAlign:"left", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Context</th>
                       <th style={{ textAlign:"right", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Validation</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filtered.map((a, i) => {
                      const subj = subjects.find(s=>s.subjectId===a.subjectId)?.subjectName || "Unknown";
                      return (
                        <tr key={a.attendanceId} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.3s ease ${i*20}ms both` }}>
                           <td style={{ padding:"16px 24px" }}>
                              <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{a.date}</div>
                           </td>
                           <td style={{ padding:"16px 24px" }}>
                              <div style={{ fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>{subj}</div>
                              <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", marginTop:2 }}>Period {a.periodNumber}</div>
                           </td>
                           <td style={{ padding:"16px 24px", textAlign:"right" }}>
                              <span style={{ padding:"6px 12px", borderRadius:99, fontSize:11, fontWeight:800, background:a.status==="PRESENT"?"rgba(16,185,129,0.1)":a.status==="ABSENT"?"rgba(239,68,68,0.1)":"rgba(245,158,11,0.1)", color:a.status==="PRESENT"?"#10b981":a.status==="ABSENT"?"#ef4444":"#f59e0b" }}>{a.status}</span>
                           </td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
           )}
        </div>

      </div>
    </div>
  );
};

export default AttendanceStudent;
