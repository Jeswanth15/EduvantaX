import React, { useEffect, useState } from "react";
import { getStudentsBySchool, getAllClassrooms, enrollStudent, getAllEnrollments, deleteEnrollment } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const Enrollment = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const loadData = async () => {
      try {
        const [s, c, e] = await Promise.all([ getStudentsBySchool(schoolId), getAllClassrooms(schoolId), getAllEnrollments() ]);
        setStudents(s.data.filter((x) => x.approvalStatus === "APPROVED")); setClassrooms(c.data); setEnrollments(e.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, [schoolId]);

  const handleEnroll = async () => {
    if (selectedStudents.length === 0 || !selectedClass) return alert("Requires at least one student and a target form.");
    try {
      for (const id of selectedStudents) await enrollStudent({ studentId: Number(id), classroomId: Number(selectedClass) });
      const updated = await getAllEnrollments(); setEnrollments(updated.data);
      setSelectedStudents([]); setSelectedClass("");
    } catch (err) { alert("Enrollment injection failed."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sever this enrollment vector?")) return;
    try { await deleteEnrollment(id); setEnrollments(prev => prev.filter(item => item.enrollmentId !== id)); } catch(err) { alert("Deletion failed"); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Fetching student populace...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Population Enrollment</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Bulk distribution of unassigned students into academic forms.</p>
       </div>

       <div className="responsive-grid-side">
          
          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-md)", position:"sticky", top:20 }}>
             <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 24px", color:"var(--text-primary)" }}>Injection Pipeline</h3>
             
             <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Target Populace <span style={{ color:"var(--primary-color)" }}>({selectedStudents.length} queued)</span></label>
                <select multiple value={selectedStudents} onChange={e=>setSelectedStudents(Array.from(e.target.selectedOptions, opt=>opt.value))} className="form-input" style={{ width:"100%", height:180, borderRadius:12 }}>
                   {students.map((s) => <option key={s.userId} value={s.userId} style={{ padding:8, cursor:"pointer", borderBottom:"1px solid var(--border-subtle)" }}>{s.name}</option>)}
                </select>
             </div>

             <div style={{ marginBottom:32 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Destination Form</label>
                <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">-- Specify --</option>
                   {classrooms.map(c => <option key={c.classId} value={c.classId}>{c.name} {c.section?`| ${c.section}`:''}</option>)}
                </select>
             </div>

             <button onClick={handleEnroll} disabled={selectedStudents.length===0 || !selectedClass} style={{ width:"100%", padding:16, background:"var(--primary-color)", color:"white", borderRadius:14, fontWeight:800, border:"none", cursor:selectedStudents.length===0 || !selectedClass?"not-allowed":"pointer", opacity:selectedStudents.length===0 || !selectedClass?0.5:1, boxShadow:"0 8px 24px rgba(37,99,235,0.2)" }}>
                Commit Enrollment
             </button>
          </div>

          <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
             <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ background:"var(--surface-2)" }}><tr>
                   <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Identity</th>
                   <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Registry</th>
                   <th style={{ padding:"16px 24px", textAlign:"right", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Validation</th>
                </tr></thead>
                <tbody>
                   {enrollments.length===0 ? <tr><td colSpan={3} style={{ padding:60, textAlign:"center", color:"var(--text-tertiary)" }}>No functional enrollments loaded.</td></tr> : enrollments.map((e, i) => (
                      <tr key={e.enrollmentId} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.3s ease ${i*15}ms both` }}>
                         <td style={{ padding:"16px 24px" }}>
                            <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>{students.find(s=>s.userId===e.studentId)?.name || "Unknown"}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:"var(--text-tertiary)" }}>ID: {e.studentId} • DTE: {e.enrollmentDate}</div>
                         </td>
                         <td style={{ padding:"16px 24px", fontSize:14, fontWeight:700, color:"var(--text-secondary)" }}>
                            {classrooms.find(c=>c.classId===e.classroomId)?.name || "Unknown"}
                         </td>
                         <td style={{ padding:"16px 24px", textAlign:"right" }}>
                            <button onClick={()=>handleDelete(e.enrollmentId)} style={{ padding:"6px 14px", borderRadius:99, background:"rgba(239,68,68,0.1)", color:"#ef4444", fontSize:11, fontWeight:800, border:"none", cursor:"pointer", textTransform:"uppercase" }}>Sever Link</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

       </div>
    </div>
  );
};

export default Enrollment;
