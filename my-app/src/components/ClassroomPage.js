import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAllClassrooms, createClassroom, getTeachersBySchool, deleteClassroom } from "../utils/api";

const ClassroomPage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      if (!schoolId) return;
      const [c, t] = await Promise.all([ getAllClassrooms(schoolId), getTeachersBySchool(schoolId) ]);
      setClassrooms(c.data.filter(x => x.schoolId === schoolId));
      setTeachers(t.data.filter(x => x.approvalStatus === "APPROVED"));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [schoolId]);

  const handleCreate = async () => {
    if (!name) return alert("Class name is required");
    try {
      await createClassroom({ name, section, schoolId, classTeacherId: teacherId ? Number(teacherId) : null });
      setName(""); setSection(""); setTeacherId(""); fetchAll();
    } catch (err) { alert("Failed to create classroom"); }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;
    try { await deleteClassroom(classId); fetchAll(); } catch(err) { alert("Delete failed"); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading infrastructure...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Classroom Infrastructure</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Create and configure classroom boundaries.</p>
       </div>

       <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, marginBottom:40, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
          <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 24px" }}>Provision New Form</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:20, alignItems:"end" }}>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Class Designation</label>
                <input type="text" placeholder="e.g. Grade 10" value={name} onChange={e=>setName(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }} />
             </div>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Section Label</label>
                <input type="text" placeholder="e.g. A, B, Science" value={section} onChange={e=>setSection(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }} />
             </div>
             <div>
                <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Class Facilitator</label>
                <select value={teacherId} onChange={e=>setTeacherId(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }}>
                   <option value="">Assign Later</option>
                   {teachers.map(t => <option key={t.userId} value={t.userId}>{t.name}</option>)}
                </select>
             </div>
             <button onClick={handleCreate} style={{ padding:16, background:"var(--primary-color)", color:"white", borderRadius:12, fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 8px 20px rgba(37,99,235,0.25)", transition:"transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                Establish Form
             </button>
          </div>
       </div>

       <div>
          <h2 style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", marginBottom:20 }}>Active Forms</h2>
          {classrooms.length === 0 ? <div style={{ padding:60, textAlign:"center", background:"var(--surface-1)", borderRadius:24, border:"1px dashed var(--border-medium)", color:"var(--text-tertiary)" }}>No functional classrooms on record.</div> : (
             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:24 }}>
                {classrooms.map((c, i) => (
                   <div key={c.classId} style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", justifyContent:"space-between", animation:`pageEnter 0.3s ease ${i*30}ms` }}>
                      <div style={{ marginBottom:24 }}>
                         <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
                            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(139,92,246,0.1)", color:"#8b5cf6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏫</div>
                            <div>
                               <div style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)" }}>{c.name} {c.section && <span style={{ color:"var(--text-tertiary)" }}>| {c.section}</span>}</div>
                            </div>
                         </div>
                         <div style={{ background:"var(--surface-2)", padding:12, borderRadius:12 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Assigned Facilitator</div>
                            <div style={{ fontSize:14, fontWeight:600, color:c.classTeacherName?"var(--primary-color)":"var(--text-tertiary)" }}>{c.classTeacherName || "Pending Assignment"}</div>
                         </div>
                      </div>
                      <button onClick={()=>handleDelete(c.classId)} style={{ padding:10, borderRadius:12, background:"transparent", border:"1px solid var(--border-medium)", color:"#ef4444", fontWeight:700, cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.borderColor="#fecaca"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="var(--border-medium)"}}>
                         Dissolve Form
                      </button>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

export default ClassroomPage;
