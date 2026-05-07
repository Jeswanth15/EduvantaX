import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAllClassrooms, getAllClassSubjects, getAllTimetables, createTimetable, updateTimetable, deleteTimetable, getEnrolledTeachers } from "../utils/api";

const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const periods = [1, 2, 3, 4, 5, 6, 7];

const Timetable = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [gridData, setGridData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const fetchData = async () => {
      try {
        const [c, s, t] = await Promise.all([ getAllClassrooms(schoolId), getAllClassSubjects(), getAllTimetables() ]);
        setClassrooms(c.data); setClassSubjects(s.data); setTimetables(t.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClass) return;
    const load = async () => {
      const g = {};
      const thisClassTT = timetables.filter(t => t.classroomId === selectedClass.classId).map(t => ({ ...t, dayOfWeek: t.dayOfWeek.substring(0,3).toUpperCase(), periodNumber: Number(t.periodNumber) }));
      const subs = classSubjects.filter(cs => cs.classroomId === selectedClass.classId).map(cs => ({ subjectId: cs.subjectId, name: cs.subjectName }));

      daysOfWeek.forEach(d => {
        g[d] = {};
        periods.forEach(p => {
          const entry = thisClassTT.find(t => t.dayOfWeek === d && t.periodNumber === p);
          g[d][p] = { subjectId: entry?.subjectId||"", teacherId: entry?.teacherId||"", timetableId: entry?.timetableId||null, availableSubjects: subs, availableTeachers: [] };
        });
      });

      for (const d of daysOfWeek) {
        for (const p of periods) {
          if (g[d][p].subjectId) {
            try { const res = await getEnrolledTeachers(selectedClass.classId, Number(g[d][p].subjectId)); g[d][p].availableTeachers = res.data || []; } catch {}
          }
        }
      }
      setGridData(g);
    };
    load();
  }, [selectedClass, timetables, classSubjects]);

  const handleChangeCell = async (day, period, field, value) => {
    setGridData(p => ({ ...p, [day]: { ...p[day], [period]: { ...p[day][period], [field]: value } } }));
    if (field === "subjectId" && value) {
      try {
        const res = await getEnrolledTeachers(selectedClass.classId, Number(value));
        setGridData(p => ({ ...p, [day]: { ...p[day], [period]: { ...p[day][period], availableTeachers: res.data, teacherId: "" } } }));
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteCell = (day, period) => {
    setGridData(p => ({ ...p, [day]: { ...p[day], [period]: { subjectId:"", teacherId:"", timetableId:null, availableSubjects:p[day][period].availableSubjects, availableTeachers:[] } } }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    try {
      for (const day of daysOfWeek) {
        for (const period of periods) {
          const cell = gridData[day][period];
          if (!cell.subjectId || !cell.teacherId) continue;
          const payload = { classroomId: selectedClass.classId, subjectId: Number(cell.subjectId), teacherId: Number(cell.teacherId), dayOfWeek: day, periodNumber: period };
          if (cell.timetableId) await updateTimetable(cell.timetableId, payload); else await createTimetable(payload);
        }
      }
      const res = await getAllTimetables(); setTimetables(res.data);
      alert("Timetable Synced!");
    } catch (err) { alert("Sync Failure."); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Initializing scheduler...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Timetable Coordinator</h1>
            <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Construct period mappings for functional classrooms.</p>
          </div>
          <select value={selectedClass?.classId||""} onChange={e=>setSelectedClass(classrooms.find(c=>c.classId===Number(e.target.value)))} className="form-input" style={{ width:240, borderRadius:12 }}>
             <option value="">Select Scope Target</option>
             {classrooms.map(c=><option key={c.classId} value={c.classId}>{c.name} {c.section?`| ${c.section}`:''}</option>)}
          </select>
       </div>

       {selectedClass ? (
         <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-lg)", overflow:"hidden", animation:"slideDown 0.3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"24px 32px", background:"linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))", borderBottom:"1px solid var(--border-light)" }}>
               <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"var(--primary-color)" }}>{selectedClass.name} Master Routing</h3>
               <button onClick={handleSave} style={{ padding:"10px 20px", borderRadius:12, background:"var(--primary-color)", color:"white", fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 4px 12px rgba(37,99,235,0.2)" }}>Sync Pipeline</button>
            </div>
            
            <div className="table-scroll-wrapper">
               <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
                  <thead><tr>
                     <th style={{ width:100, padding:"20px", backgroundColor:"var(--surface-2)", borderBottom:"1px solid var(--border-medium)", borderRight:"1px solid var(--border-medium)" }}>DAY / PRD</th>
                     {daysOfWeek.map(day => <th key={day} style={{ padding:"16px", backgroundColor:"var(--surface-2)", borderBottom:"1px solid var(--border-medium)", borderRight:"1px solid var(--border-subtle)", fontSize:13, fontWeight:800, color:"var(--text-secondary)" }}>{day}</th>)}
                  </tr></thead>
                  <tbody>
                     {periods.map(period => (
                        <tr key={period}>
                           <td style={{ padding:"20px", textAlign:"center", fontSize:14, fontWeight:900, color:"var(--primary-color)", background:"var(--surface-2)", borderRight:"1px solid var(--border-medium)", borderBottom:"1px solid var(--border-medium)" }}>{period}</td>
                           {daysOfWeek.map(day => {
                              const cell = gridData[day]?.[period] || { subjectId:"", teacherId:"", availableSubjects:[], availableTeachers:[] };
                              return (
                                 <td key={day} style={{ padding:12, borderRight:"1px solid var(--border-subtle)", borderBottom:"1px solid var(--border-subtle)", transition:"background 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-2)"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                       <select value={cell.subjectId} onChange={e=>handleChangeCell(day,period,"subjectId",e.target.value)} style={{ padding:"8px", borderRadius:8, border:"1px solid var(--border-medium)", fontSize:11, fontWeight:700, outline:"none", color:"var(--text-primary)", background:"white" }}>
                                          <option value="">+ Subject</option>
                                          {cell.availableSubjects.map(s=><option key={s.subjectId} value={s.subjectId}>{s.name}</option>)}
                                       </select>
                                       {cell.subjectId && (
                                         <select value={cell.teacherId} onChange={e=>handleChangeCell(day,period,"teacherId",e.target.value)} style={{ padding:"8px", borderRadius:8, border:"1px solid rgba(16,185,129,0.3)", fontSize:11, fontWeight:700, outline:"none", color:"#10b981", background:"rgba(16,185,129,0.05)" }}>
                                            <option value="">+ Facilitator</option>
                                            {cell.availableTeachers.map(t=><option key={t.userId} value={t.userId}>{t.name}</option>)}
                                         </select>
                                       )}
                                       {(cell.subjectId || cell.teacherId) && (
                                         <button onClick={()=>handleDeleteCell(day,period)} style={{ padding:"4px", fontSize:10, fontWeight:700, background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", alignSelf:"flex-end" }}>Clear</button>
                                       )}
                                    </div>
                                 </td>
                              )
                           })}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
       ) : (
         <div style={{ padding:100, textAlign:"center", background:"var(--surface-1)", borderRadius:24, border:"1px dashed var(--border-medium)" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>⏱️</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text-secondary)" }}>Awaiting Structure Target</div>
            <p style={{ marginTop:8, fontSize:13, color:"var(--text-tertiary)" }}>Select a classroom from the top dropdown to instantiate the builder matrix.</p>
         </div>
       )}
    </div>
  );
};

export default Timetable;
