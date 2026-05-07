import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAllClassrooms, getAllTimetables, getSubstitutionsByDate, createSubstitution, deleteSubstitution, getFreeTeachers } from "../utils/api";

const Substitution = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [freeTeachers, setFreeTeachers] = useState([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    if (!schoolId) return;
    const fetchData = async () => {
      try {
        const [c, t, s] = await Promise.all([ getAllClassrooms(schoolId), getAllTimetables(), getSubstitutionsByDate(selectedDate) ]);
        setClassrooms(c.data); setTimetables(t.data); setSubstitutions(s.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [schoolId, selectedDate]);

  const findFreeTeachersForPeriod = async () => {
    if (!selectedDate || !selectedPeriod) return alert("Boundaries lacking");
    const dayName = daysOfWeek[new Date(selectedDate).getDay()];
    if (dayName === "SUN") return alert("No operations on Sunday");
    try { const res = await getFreeTeachers(selectedDate, Number(selectedPeriod)); setFreeTeachers(res.data); } catch (err) { alert("Failed cross-reference"); }
  };

  const handleAddSubstitution = async () => {
    if (!selectedClassId || !selectedPeriod || !selectedSubstituteId) return alert("Fill core fields");
    const dayName = daysOfWeek[new Date(selectedDate).getDay()];
    const ttEntry = timetables.find(t => t.classroomId === Number(selectedClassId) && t.dayOfWeek === dayName && t.periodNumber === Number(selectedPeriod));
    if (!ttEntry) return alert("Form has empty block here");
    
    try {
      await createSubstitution({ timetableId: ttEntry.timetableId, date: selectedDate, originalTeacherId: ttEntry.teacherId, substituteTeacherId: Number(selectedSubstituteId), reason: reason || "Absent" });
      const res = await getSubstitutionsByDate(selectedDate); setSubstitutions(res.data);
      setSelectedSubstituteId(""); setReason(""); setFreeTeachers([]);
    } catch (err) { alert("Commit failure"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge substitution logic?")) return;
    try { await deleteSubstitution(id); setSubstitutions(substitutions.filter(s => s.substitutionId !== id)); } catch(err){}
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Parsing contingency logic...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Contingency Placements</h1>
            <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Establish bypass personnel for missing elements.</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"var(--surface-1)", padding:"8px 16px", borderRadius:16, border:"1px solid var(--border-medium)" }}>
             <label style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Time Vector</label>
             <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{ border:"none", background:"transparent", outline:"none", fontWeight:800, color:"var(--primary-color)" }} />
          </div>
       </div>

       <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, marginBottom:40, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
          <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 24px" }}>Probe for Relief Factors</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:20, alignItems:"end", marginBottom:24 }}>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Vulnerable Block</label>
                <select value={selectedClassId} onChange={e=>setSelectedClassId(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">Select Frame</option>
                   {classrooms.map(c => <option key={c.classId} value={c.classId}>{c.name} {c.section}</option>)}
                </select>
             </div>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Period Slice</label>
                <select value={selectedPeriod} onChange={e=>setSelectedPeriod(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">Select Period</option>
                   {periods.map(p => <option key={p} value={p}>Period {p}</option>)}
                </select>
             </div>
             <button onClick={findFreeTeachersForPeriod} style={{ padding:16, background:"rgba(59,130,246,0.1)", color:"#3b82f6", borderRadius:12, fontWeight:800, border:"none", cursor:"pointer" }}>
                Scan Available Personnel
             </button>
          </div>

          {freeTeachers.length > 0 && (
             <div style={{ background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:16, padding:24, animation:"slideDown 0.3s ease" }}>
                <h4 style={{ margin:"0 0 16px", fontSize:14, fontWeight:800, color:"#10b981", display:"flex", alignItems:"center", gap:8 }}><span>✓</span> Optimal Agents Found</h4>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:20, alignItems:"end" }}>
                   <div>
                      <select value={selectedSubstituteId} onChange={e=>setSelectedSubstituteId(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                         <option value="">Choose Agent</option>
                         {freeTeachers.map(t => <option key={t.userId} value={t.userId}>{t.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <input type="text" placeholder="Deviation Reason Tag" value={reason} onChange={e=>setReason(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }} />
                   </div>
                   <button onClick={handleAddSubstitution} style={{ padding:16, background:"#10b981", color:"white", borderRadius:12, fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 8px 24px rgba(16,185,129,0.3)" }}>
                      Execute Bypass
                   </button>
                </div>
             </div>
          )}
       </div>

       <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          <div style={{ padding:"24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-light)" }}>
             <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>Instantiated Bypasses ({selectedDate})</h3>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
             <thead><tr>
                <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Node Frame</th>
                <th style={{ padding:"16px 24px", textAlign:"center", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Period</th>
                <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Relief Agent</th>
                <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Tag</th>
                <th style={{ padding:"16px 24px", textAlign:"right", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Action</th>
             </tr></thead>
             <tbody>
                {substitutions.length===0 ? <tr><td colSpan={5} style={{ padding:60, textAlign:"center", color:"var(--text-tertiary)" }}>No functional bypass blocks detected.</td></tr> : substitutions.map((s, i) => {
                   const tt = timetables.find(t => t.timetableId === s.timetableId);
                   const cls = classrooms.find(c => c.classId === tt?.classroomId)?.name || "Unknown";
                   const agt = freeTeachers.find(t => t.userId === s.substituteTeacherId)?.name || `ID:${s.substituteTeacherId}`;
                   return (
                      <tr key={s.substitutionId} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.3s ease ${i*15}ms both` }}>
                         <td style={{ padding:"16px 24px", fontSize:14, fontWeight:800, color:"var(--text-primary)" }}>{cls}</td>
                         <td style={{ padding:"16px 24px", fontSize:14, fontWeight:800, color:"#8b5cf6", textAlign:"center" }}>{tt?.periodNumber}</td>
                         <td style={{ padding:"16px 24px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>{agt}</td>
                         <td style={{ padding:"16px 24px", fontSize:13, color:"var(--text-tertiary)" }}>{s.reason}</td>
                         <td style={{ padding:"16px 24px", textAlign:"right" }}>
                            <button onClick={()=>handleDelete(s.substitutionId)} style={{ padding:"6px 14px", borderRadius:99, background:"transparent", border:"1px solid #fecaca", color:"#ef4444", fontSize:11, fontWeight:800, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#fef2f2"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Tear</button>
                         </td>
                      </tr>
                   );
                })}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default Substitution;
