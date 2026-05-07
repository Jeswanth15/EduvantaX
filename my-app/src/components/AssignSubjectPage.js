import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAllClassrooms, getAllSubjects, getTeachersBySchool, createClassSubject, getAllClassSubjects, deleteClassSubject } from "../utils/api";

const AssignSubjectPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const fetchData = async () => {
      try {
        const [c, s, t, a] = await Promise.all([ getAllClassrooms(schoolId), getAllSubjects(), getTeachersBySchool(schoolId), getAllClassSubjects() ]);
        setClassrooms(c.data.filter(x=>x.schoolId===schoolId)); setSubjects(s.data); setTeachers(t.data.filter(x=>x.approvalStatus==="APPROVED")); setAssignments(a.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [schoolId]);

  const handleAssign = async () => {
    if (!selectedClass || !selectedSubject) return alert("Select classification targets first.");
    try {
      await createClassSubject({ classroomId: Number(selectedClass), subjectId: Number(selectedSubject), teacherId: selectedTeacher ? Number(selectedTeacher) : null });
      const updated = await getAllClassSubjects(); setAssignments(updated.data);
      setSelectedClass(""); setSelectedSubject(""); setSelectedTeacher("");
    } catch (err) { alert("Failed to map structure"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sever this linkage?")) return;
    try { await deleteClassSubject(id); setAssignments(assignments.filter((a) => a.id !== id)); } catch(err) { alert("Sever failed"); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Parsing infrastructure bindings...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Subject Allocation Matrix</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Bind academic subjects and facilitating personnel to specific classrooms.</p>
       </div>

       <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, marginBottom:40, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
          <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 20px" }}>Establish New Linkage</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:20, alignItems:"end" }}>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Target Classroom</label>
                <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">-- Choose Segment --</option>
                   {classrooms.map(c => <option key={c.classId} value={c.classId}>{c.name} {c.section?`— ${c.section}`:''}</option>)}
                </select>
             </div>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Subject Module</label>
                <select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">-- Choose Subject --</option>
                   {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.name} {s.code?`(${s.code})`:''}</option>)}
                </select>
             </div>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Program Facilitator</label>
                <select value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">-- Assign Observer (Optional) --</option>
                   {teachers.map(t => <option key={t.userId} value={t.userId}>{t.name}</option>)}
                </select>
             </div>
             <button onClick={handleAssign} style={{ padding:16, background:"var(--primary-color)", color:"white", borderRadius:12, fontWeight:800, border:"none", cursor:"pointer", transition:"transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                Bind Protocol
             </button>
          </div>
       </div>

       <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          <div style={{ padding:"24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-light)" }}>
             <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>Active Program Allocations</h3>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
             <thead>
                <tr>
                   <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Node Entity</th>
                   <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Subject Vector</th>
                   <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Acting Facilitator</th>
                   <th style={{ padding:"16px 24px", textAlign:"right", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Admin</th>
                </tr>
             </thead>
             <tbody>
                {assignments.length===0 ? <tr><td colSpan={4} style={{ padding:60, textAlign:"center", color:"var(--text-tertiary)" }}>No functional allocations currently mapped.</td></tr> : assignments.map((a, i) => (
                   <tr key={a.id} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.3s ease ${i*20}ms both` }}>
                      <td style={{ padding:"16px 24px", fontSize:14, fontWeight:800, color:"var(--text-primary)" }}>{a.classroomName} <span style={{ color:"var(--text-tertiary)" }}>{a.classroomSection?`| ${a.classroomSection}`:''}</span></td>
                      <td style={{ padding:"16px 24px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>{a.subjectName}</td>
                      <td style={{ padding:"16px 24px", fontSize:13, fontWeight:600, color:a.teacherName?"var(--primary-color)":"#f59e0b" }}>{a.teacherName || "Unassigned"}</td>
                      <td style={{ padding:"16px 24px", textAlign:"right" }}>
                         <button onClick={()=>handleDelete(a.id)} style={{ padding:"6px 12px", borderRadius:8, background:"transparent", border:"1px solid #fecaca", color:"#ef4444", fontSize:12, fontWeight:700, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#fef2f2"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Sever</button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default AssignSubjectPage;
