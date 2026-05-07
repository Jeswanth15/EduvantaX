import React, { useEffect, useState } from "react";
import { getAllClassSubjects, getAllClassrooms, createAssignment, getAssignmentsBySubject } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const userId = decoded?.userId;
  const schoolId = decoded?.schoolId;
  const role = decoded?.role;

  const [classrooms, setClassrooms] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [filteredClassSubjects, setFilteredClassSubjects] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllClassrooms(schoolId), getAllClassSubjects()]).then(([cls, subs]) => {
      setClassrooms(cls.data || []);
      const allSubjects = subs.data || [];
      setClassSubjects(allSubjects);

      if (role === "TEACHER") {
        setFilteredClassSubjects(allSubjects.filter(cs => cs.teacherId === userId));
      } else if (role === "STUDENT") {
        const studentClassId = decoded?.classroomId;
        setFilteredClassSubjects(allSubjects.filter(cs => cs.classroomId === studentClassId));
        setSelectedClass(studentClassId);
      } else {
        setFilteredClassSubjects(allSubjects);
      }
    }).catch(console.error).finally(()=>setLoading(false));
  }, [schoolId, role, userId, decoded?.classroomId]);

  useEffect(() => {
    if (selectedSubject) {
      getAssignmentsBySubject(selectedSubject).then(res => setAssignments(res.data || []));
    }
  }, [selectedSubject]);

  const subjectsForClass = filteredClassSubjects.filter(cs => cs.classroomId === Number(selectedClass)).map(cs => ({ id: cs.subjectId, name: cs.subjectName }));

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject || !newAssignment.title) return alert("Fill required fields");
    try {
      const formData = new FormData();
      formData.append("classroomId", selectedClass);
      formData.append("subjectId", selectedSubject);
      formData.append("teacherId", userId);
      formData.append("title", newAssignment.title);
      formData.append("description", newAssignment.description);
      formData.append("dueDate", newAssignment.dueDate);
      if (file) formData.append("file", file);

      await createAssignment(formData);
      setNewAssignment({ title: "", description: "", dueDate: "" }); setFile(null);
      const res = await getAssignmentsBySubject(selectedSubject);
      setAssignments(res.data || []);
    } catch { alert("Failed to create task"); }
  };

  if (loading) return <div style={{textAlign:"center", padding:40, color:"var(--text-secondary)"}}>Loading assignments system…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Assignments Hub</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Publish, manage, and track coursework tasks seamlessly.</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:28, alignItems:"start" }}>
        
        {/* Left Col (Filters & Create) */}
        <div style={{ display:"flex", flexDirection:"column", gap:24, position:"sticky", top:20 }}>
          
          <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Academic Filters</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Select Class</label>
                <select className="form-input" style={{borderRadius:12}} value={selectedClass} disabled={role==="STUDENT"} onChange={e=>{ setSelectedClass(e.target.value); setSelectedSubject(""); setAssignments([]); }}>
                  <option value="">Choose Class</option>
                  {[...new Set(filteredClassSubjects.map(cs=>cs.classroomId))].map(cid => classrooms.find(c=>c.classId===cid)).filter(Boolean).map(cls => (
                    <option key={cls.classId} value={cls.classId}>{cls.name} {cls.section}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Subject Space</label>
                <select className="form-input" style={{borderRadius:12}} value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)} disabled={!selectedClass}>
                  <option value="">Choose Subject</option>
                  {subjectsForClass.map(subj => <option key={subj.id} value={subj.id}>{subj.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {selectedSubject && (role==="TEACHER" || role==="SCHOOLADMIN") && (
            <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
              <div style={{ background:"linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))", margin:"-24px -24px 20px", padding:"20px 24px", borderBottom:"1px solid var(--border-light)" }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", margin:0 }}>New Assignment</h3>
              </div>
              <form onSubmit={handleCreateAssignment} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Task Summary</label>
                  <input className="form-input" placeholder="Title (e.g., Chapter 5 Essay)" value={newAssignment.title} onChange={e=>setNewAssignment(p=>({...p,title:e.target.value}))} required style={{borderRadius:12}} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Details / Prompt</label>
                  <textarea className="form-input" placeholder="Provide instructions…" rows={3} value={newAssignment.description} onChange={e=>setNewAssignment(p=>({...p,description:e.target.value}))} required style={{borderRadius:12, resize:"none"}} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Deadline</label>
                  <input type="date" className="form-input" value={newAssignment.dueDate} onChange={e=>setNewAssignment(p=>({...p,dueDate:e.target.value}))} required style={{borderRadius:12}} />
                </div>
                <div style={{ border:"1px dashed var(--border-medium)", background:"var(--surface-2)", borderRadius:12, padding:12, textAlign:"center" }}>
                   <input type="file" id="a-file" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])} />
                   <label htmlFor="a-file" style={{ fontSize:13, fontWeight:600, color:"var(--primary-color)", cursor:"pointer", display:"block" }}>
                     {file ? `📎 ${file.name.substring(0,25)}` : "📎 Attach Reference File"}
                   </label>
                </div>
                <button type="submit" style={{ padding:"12px", borderRadius:12, background:"linear-gradient(135deg, #2563eb, #7c3aed)", color:"white", border:"none", fontWeight:700, fontSize:14, marginTop:10, cursor:"pointer", transition:"all 0.2s", boxShadow:"0 4px 16px rgba(124,58,237,0.3)" }}>Publish to Class</button>
              </form>
            </div>
          )}

        </div>

        {/* Right Col (Content) */}
        <div>
          {!selectedSubject ? (
             <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:24, minHeight:400, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", textAlign:"center", padding:40 }}>
               <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
               <h3 style={{ fontSize:18, fontWeight:700, margin:"0 0 8px", color:"var(--text-secondary)" }}>Waiting for subject</h3>
               <p style={{ fontSize:14, maxWidth:300, lineHeight:1.5, margin:0 }}>Select a class and subject from the sidebar to view active coursework.</p>
             </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                 <h3 style={{ fontSize:18, fontWeight:800, margin:0, color:"var(--text-primary)" }}>Active Tasks</h3>
                 <span style={{ fontSize:12, fontWeight:700, background:"var(--surface-2)", color:"var(--text-secondary)", padding:"4px 12px", borderRadius:99, border:"1px solid var(--border-subtle)" }}>{assignments.length} Total</span>
              </div>
              
              {assignments.length === 0 ? (
                <div style={{ background:"var(--surface-1)", borderRadius:20, padding:40, textAlign:"center", color:"var(--text-secondary)", border:"1px solid var(--border-light)" }}>No coursework published yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {assignments.map(a => (
                    <div key={a.assignmentId} style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, padding:24, boxShadow:"var(--shadow-sm)", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="var(--shadow-md)"}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"}}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                        <h4 style={{ margin:0, fontSize:17, fontWeight:800, color:"var(--text-primary)", lineHeight:1.3 }}>{a.title}</h4>
                        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:"rgba(16,185,129,0.12)", color:"#10b981", border:"1px solid rgba(16,185,129,0.2)" }}>Published</span>
                      </div>
                      <p style={{ margin:"0 0 20px", fontSize:14, color:"var(--text-secondary)", lineHeight:1.6 }}>{a.description}</p>
                      
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:16, borderTop:"1px solid var(--border-subtle)" }}>
                         <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                           <span style={{ fontSize:12.5, fontWeight:600, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:6 }}>
                             <span style={{color:"#ef4444"}}>⏳</span> Due: <strong style={{color:"var(--text-primary)"}}>{a.dueDate}</strong>
                           </span>
                           {a.fileLink && (
                             <a href={`http://localhost:8080${a.fileLink}`} target="_blank" rel="noreferrer" style={{ fontSize:12.5, fontWeight:700, color:"var(--brand-600)", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
                               📎 Download Attached
                             </a>
                           )}
                         </div>
                         <button onClick={()=>navigate((role==="SCHOOLADMIN"||role==="TEACHER")?`/teacher/assignments/${a.assignmentId}/submissions`:`/student/assignments/${a.assignmentId}`)} style={{ padding:"8px 16px", borderRadius:10, background:"var(--surface-2)", color:"var(--primary-color)", border:"1px solid var(--border-medium)", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--border-light)"} onMouseLeave={e=>e.currentTarget.style.background="var(--surface-2)"}>
                           View Details →
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AssignmentsPage;
