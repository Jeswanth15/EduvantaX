import React, { useEffect, useState } from "react";
import { getAllExamSchedules, getStudentsBySchool, createMarks, getMarksBySubject, getAllMarks, updateMarks, deleteMarks } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const MarksEntryPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksData, setMarksData] = useState([]);

  const [allMarks, setAllMarks] = useState([]);
  const [showAllMarks, setShowAllMarks] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllExamSchedules().then(res => setExams(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!exams.length) return;
    const last = localStorage.getItem("selectedExamId");
    if (last) handleExamSelect(last);
  }, [exams]);

  const handleExamSelect = async (examId) => {
    if (!examId) {
      setSelectedExam(null); setStudents([]); setMarksData([]);
      localStorage.removeItem("selectedExamId"); return;
    }
    localStorage.setItem("selectedExamId", examId);
    const examObj = exams.find(e => String(e.examScheduleId) === String(examId));
    setSelectedExam(examObj || null);

    if (!examObj) return;

    setLoading(true);
    try {
      const studentRes = await getStudentsBySchool(schoolId);
      const classStudents = (studentRes.data || []).filter(s => s.classroomId === examObj.classroomId && s.approvalStatus === "APPROVED");
      const marksRes = await getMarksBySubject(examObj.subjectId);
      const existingMarks = (marksRes.data || []).filter(m => String(m.examScheduleId) === String(examObj.examScheduleId));

      setStudents(classStudents);
      setMarksData(classStudents.map(stu => {
        const found = existingMarks.find(m => String(m.studentId) === String(stu.userId));
        return { studentId: stu.userId, studentName: stu.name, marksId: found ? found.marksId : null, marksObtained: found ? String(found.marksObtained) : "", totalMarks: found ? String(found.totalMarks) : "" };
      }));
    } catch { alert("Failed to load records"); }
    setLoading(false);
  };

  const updateMarksState = (idx, field, val) => setMarksData(prev => { const c = [...prev]; c[idx] = { ...c[idx], [field]: val }; return c; });

  const submitMarks = async () => {
    if (!selectedExam) return alert("Select exam first");
    setLoading(true);
    try {
      const tasks = marksData.map(entry => {
        const payload = { studentId: entry.studentId, subjectId: selectedExam.subjectId, examScheduleId: selectedExam.examScheduleId, examType: selectedExam.examType || "Exam", marksObtained: entry.marksObtained === "" ? null : Number(entry.marksObtained), totalMarks: entry.totalMarks === "" ? null : Number(entry.totalMarks), examDate: selectedExam.examDate };
        return entry.marksId ? updateMarks(entry.marksId, payload) : createMarks(payload);
      });
      await Promise.all(tasks);
      alert("Marks committed to server!");
      handleExamSelect(selectedExam.examScheduleId);
    } catch { alert("Error saving"); }
    setLoading(false);
  };

  const loadAllMarks = async () => {
    setLoading(true);
    try { const res = await getAllMarks(); setAllMarks(res.data || []); setShowAllMarks(true); } 
    catch { alert("Failed to load DB"); } setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete record?")) return;
    setLoading(true);
    try { await deleteMarks(id); if (showAllMarks) loadAllMarks(); if (selectedExam) handleExamSelect(selectedExam.examScheduleId); } 
    catch { alert("Delete failed"); } setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Results Registry</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Authoritative ledger for grading & academic performance.</p>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={loadAllMarks} disabled={loading} style={{ padding:"10px 16px", borderRadius:10, backgroundColor:"var(--surface-1)", border:"1px solid var(--border-light)", color:"var(--text-primary)", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"} onMouseLeave={e=>e.currentTarget.style.background="var(--surface-1)"}>🗄️ Master Ledger</button>
          <button onClick={() => { setShowAllMarks(!showAllMarks); if(!showAllMarks && !allMarks.length) loadAllMarks(); }} style={{ padding:"10px 16px", borderRadius:10, backgroundColor:"var(--primary-color)", border:"none", color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>{showAllMarks?"Collapse Global":"View Global"} 👁️</button>
        </div>
      </div>

      <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", marginBottom:32 }}>
        <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Examinee Filter Session</h3>
        <select value={selectedExam?.examScheduleId||""} onChange={e=>handleExamSelect(e.target.value)} className="form-input" style={{ borderRadius:12, padding:"12px 16px" }}>
          <option value="">-- Choose Examination Slot Context --</option>
          {exams.map(ex => <option key={ex.examScheduleId} value={ex.examScheduleId}>📌 {ex.subjectName} • {ex.classroomName} ({new Date(ex.examDate).toLocaleDateString()})</option>)}
        </select>
      </div>

      {selectedExam && (
        <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden", animation:"pageEnter 0.4s ease" }}>
          <div style={{ padding:"20px 24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:800, margin:0, color:"var(--text-primary)" }}>{selectedExam.subjectName} Roster</h2>
              <div style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600, marginTop:4 }}>{selectedExam.classroomName}</div>
            </div>
            <button onClick={submitMarks} disabled={loading||!students.length} style={{ padding:"10px 20px", borderRadius:10, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", border:"none", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>
              {loading ? "Writing Ledger…" : "Commit Server Entry"}
            </button>
          </div>
          
          {loading ? <div style={{padding:40, textAlign:"center"}}>Loading registry...</div> : !students.length ? <div style={{padding:40, textAlign:"center"}}>Empty roster.</div> : (
            <div className="table-scroll-wrapper">
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:"left", padding:"16px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)" }}>Identity</th>
                    <th style={{ textAlign:"left", padding:"16px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)", width:"25%" }}>Marks Received</th>
                    <th style={{ textAlign:"left", padding:"16px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)", width:"25%" }}>Gross Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {marksData.map((m, i) => (
                    <tr key={m.studentId} style={{ borderBottom:"1px solid var(--border-subtle)", background: m.marksId?"rgba(16,185,129,0.03)":"transparent" }}>
                      <td style={{ padding:"12px 24px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                           <div style={{ width:32, height:32, borderRadius:8, background:"rgba(59,130,246,0.1)", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14 }}>{m.studentName.charAt(0)}</div>
                           <div><div style={{ fontSize:14, fontWeight:700 }}>{m.studentName}</div>{m.marksId && <div style={{fontSize:10, color:"#10b981", fontWeight:700}}>✓ Synced</div>}</div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 24px" }}>
                        <input type="number" className="form-input" placeholder="0" value={m.marksObtained} onChange={e=>updateMarksState(i,"marksObtained",e.target.value)} style={{ borderRadius:8, width:"100px", padding:"8px 12px", background:m.marksId?"#fff":"var(--surface-2)" }} />
                      </td>
                      <td style={{ padding:"12px 24px" }}>
                        <input type="number" className="form-input" placeholder="100" value={m.totalMarks} onChange={e=>updateMarksState(i,"totalMarks",e.target.value)} style={{ borderRadius:8, width:"100px", padding:"8px 12px", background:m.marksId?"#fff":"var(--surface-2)" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAllMarks && (
        <div style={{ marginTop:40, background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
           <div style={{ padding:"20px 24px", background:"#1e293b", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 style={{ fontSize:16, fontWeight:800, margin:0 }}>Global Master Ledger</h2>
              <button onClick={()=>setShowAllMarks(false)} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, color:"white", padding:"6px 12px", cursor:"pointer", fontWeight:600 }}>Close View</button>
           </div>
           {allMarks.length === 0 ? <div style={{padding:40, textAlign:"center"}}>No records overall.</div> : (
             <div className="table-scroll-wrapper">
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:"left", padding:"14px 20px", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", borderBottom:"1px solid var(--border-subtle)" }}>Ref</th>
                      <th style={{ textAlign:"left", padding:"14px 20px", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", borderBottom:"1px solid var(--border-subtle)" }}>Holder</th>
                      <th style={{ textAlign:"left", padding:"14px 20px", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", borderBottom:"1px solid var(--border-subtle)" }}>Subject</th>
                      <th style={{ textAlign:"left", padding:"14px 20px", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", borderBottom:"1px solid var(--border-subtle)" }}>Score</th>
                      <th style={{ textAlign:"right", padding:"14px 20px", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", borderBottom:"1px solid var(--border-subtle)" }}>Ops</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMarks.map(m => (
                      <tr key={m.marksId} style={{ borderBottom:"1px solid var(--border-subtle)" }}>
                         <td style={{ padding:"12px 20px", fontSize:12, color:"var(--text-muted)" }}>#{m.marksId}</td>
                         <td style={{ padding:"12px 20px", fontSize:13, fontWeight:700 }}>{m.studentName}</td>
                         <td style={{ padding:"12px 20px", fontSize:13 }}>{m.subjectName}</td>
                         <td style={{ padding:"12px 20px", fontSize:13, fontWeight:800, color:"var(--primary-color)" }}>{m.marksObtained} / {m.totalMarks}</td>
                         <td style={{ padding:"12px 20px", textAlign:"right" }}>
                            <button onClick={()=>handleDelete(m.marksId)} style={{ padding:"6px 10px", borderRadius:6, background:"rgba(239,68,68,0.1)", border:"none", color:"#ef4444", cursor:"pointer", fontWeight:600, fontSize:11 }}>Wipe</button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default MarksEntryPage;
