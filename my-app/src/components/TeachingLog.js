import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAllClassSubjects, createOrUpdateTeachingLog, getTeachingLogsByClassSubject, deleteTeachingLog } from "../utils/api";

const TeachingLog = () => {
  const decoded = getDecodedToken();
  const userRole = decoded?.role;
  const teacherId = decoded?.userId;

  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    getAllClassSubjects().then(res => {
      let all = res.data || [];
      if (userRole === "TEACHER") all = all.filter(cs => cs.teacherId === teacherId);
      setClassSubjects(all);
    }).catch(console.error);
  }, [userRole, teacherId]);

  const fetchLogs = async (id) => {
    try { const res = await getTeachingLogsByClassSubject(id); setLogs(res.data || []); } catch (err) { console.error(err); }
  };

  const handleSelect = (id) => { setSelectedId(id); fetchLogs(id); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId || !topic) return alert("Select class and enter topic.");
    try {
      await createOrUpdateTeachingLog({ classSubjectId: selectedId, topicTaught: topic, teacherId });
      setTopic(""); fetchLogs(selectedId);
    } catch { alert("Failed to log"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete log?")) return;
    try { await deleteTeachingLog(id); fetchLogs(selectedId); } catch { console.error("Error"); }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Teaching Ledger</h1>
        <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Immutable logs of daily instruction topics and pedagogy.</p>
      </div>

      <div className="responsive-grid-side">
        
        {/* Left Column */}
        <div style={{ display:"flex", flexDirection:"column", gap:24, position:"sticky", top:20 }}>
          <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Active Classes</h3>
            {classSubjects.length === 0 ? <div style={{padding:20, textAlign:"center", color:"var(--text-tertiary)"}}>No classes found.</div> : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {classSubjects.map(cs => (
                  <div key={cs.id} onClick={() => handleSelect(cs.id)} style={{ padding:"14px 16px", borderRadius:12, border: selectedId===cs.id ? "1px solid var(--primary-color)" : "1px solid var(--border-light)", background: selectedId===cs.id ? "rgba(37,99,235,0.05)" : "var(--surface-2)", cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>{if(selectedId!==cs.id)e.currentTarget.style.background="var(--surface-3)"}} onMouseLeave={e=>{if(selectedId!==cs.id)e.currentTarget.style.background="var(--surface-2)"}}>
                     <div style={{ fontWeight:800, fontSize:14, color:selectedId===cs.id?"var(--primary-color)":"var(--text-primary)" }}>{cs.classroomName || cs.classroom?.name}</div>
                     <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginTop:4 }}>{cs.subjectName || cs.subject?.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
           {!selectedId ? (
              <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:24, minHeight:400, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", textAlign:"center", padding:40 }}>
                 <div style={{ fontSize:48, marginBottom:16 }}>📖</div>
                 <h3 style={{ fontSize:18, fontWeight:700, margin:"0 0 8px", color:"var(--text-secondary)" }}>Waiting for selection</h3>
                 <p style={{ fontSize:14, maxWidth:300, lineHeight:1.5, margin:0 }}>Select a course to view or log a teaching session.</p>
              </div>
           ) : (
             <>
               <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                  <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)", margin:"0 0 20px", display:"flex", alignItems:"center", gap:10 }}>✏️ Record Log</h3>
                  <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <textarea value={topic} onChange={e=>setTopic(e.target.value)} required placeholder="What was taught today? e.g. Quantum Mechanics Intro" className="form-input" style={{ borderRadius:12, resize:"none", minHeight:80, fontSize:14 }} />
                    <button type="submit" style={{ alignSelf:"flex-end", padding:"12px 24px", borderRadius:10, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", border:"none", fontWeight:800, cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>Submit Record</button>
                  </form>
               </div>

               <div>
                 <h3 style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", margin:"0 0 16px" }}>History Logs</h3>
                 {logs.length === 0 ? <div style={{ background:"var(--surface-1)", borderRadius:20, padding:40, textAlign:"center", color:"var(--text-tertiary)", border:"1px solid var(--border-light)" }}>No logs found for this class.</div> : (
                   <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                     {logs.map((log, i) => (
                       <div key={log.id} style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:16, padding:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", boxShadow:"var(--shadow-sm)", animation:`pageEnter 0.3s ease ${i*30}ms both` }}>
                          <div>
                            <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", lineHeight:1.5 }}>{log.topicTaught}</div>
                            <div style={{ marginTop:12, display:"flex", gap:16, fontSize:12, fontWeight:600, color:"var(--text-tertiary)" }}>
                               <span>👤 {log.teacher?.name || "N/A"}</span>
                               <span>🕐 {new Date(log.taughtAt).toLocaleString()}</span>
                            </div>
                          </div>
                          {["ADMIN", "PRINCIPAL", "SCHOOLADMIN"].includes(userRole) && (
                            <button onClick={()=>handleDelete(log.id)} style={{ padding:6, borderRadius:6, background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"none", cursor:"pointer" }}>🗑 Delete</button>
                          )}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default TeachingLog;
