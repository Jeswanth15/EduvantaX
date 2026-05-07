import React, { useEffect, useState } from "react";
import { getAllClassSubjects, getSyllabusByClassSubject, createOrUpdateSyllabus, deleteSyllabus } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const Syllabus = () => {
  const decoded = getDecodedToken();
  const role = decoded?.role;
  const userId = decoded?.userId;
  const classroomId = decoded?.classroomId;

  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedModule, setExpandedModule] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedModule, setSelectedModule] = useState("General");
  const [selectedDays, setSelectedDays] = useState(7);
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", description: "", moduleName: "" });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchClassSubjects = async () => {
      setLoading(true);
      try {
        const res = await getAllClassSubjects();
        let all = res.data || [];
        if (role === "TEACHER") all = all.filter(cs => cs.teacherId === userId);
        else if (role === "STUDENT") all = all.filter(cs => cs.classroomId === classroomId);
        setClassSubjects(all);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchClassSubjects();
  }, [role, userId, classroomId]);

  const fetchSyllabus = async (id) => {
    try {
      const res = await getSyllabusByClassSubject(id);
      setSyllabusList(res.data || []);
      setSelectedId(id);
      setStudyPlan(null);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return alert("Select a class & subject first");
    const data = new FormData();
    data.append("classSubjectId", selectedId);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("moduleName", formData.moduleName || "General Resources");
    data.append("uploadedById", userId);
    if (file) data.append("file", file);

    try {
      await createOrUpdateSyllabus(data);
      fetchSyllabus(selectedId);
      setFormData({ title: "", description: "", moduleName: "" }); setFile(null);
    } catch (err) { alert("Failed to upload syllabus"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this syllabus?")) return;
    try { await deleteSyllabus(id); fetchSyllabus(selectedId); } catch (err) { console.error(err); }
  };

  const groupedSyllabus = syllabusList.reduce((acc, current) => {
    const module = current.moduleName || "General Resources";
    if (!acc[module]) acc[module] = [];
    acc[module].push(current);
    return acc;
  }, {});

  const handleStartTest = (moduleName) => {
    navigate('/student/practice', { state: { classSubjectId: selectedId, moduleName, files: groupedSyllabus[moduleName] } });
  };

  const handleGenerateStudyPlan = async () => {
    setLoadingPlan(true);
    try {
      const moduleParam = selectedModule !== "General" ? `&moduleName=${encodeURIComponent(selectedModule)}` : "";
      const res = await fetch(`http://localhost:8080/api/practice/study-plan/${userId}/${selectedId}?days=${selectedDays}${moduleParam}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const text = await res.text();
      setStudyPlan(text);
    } catch { setStudyPlan("Failed to generate plan securely."); } finally { setLoadingPlan(false); }
  };

  const getFullFileUrl = (url) => url ? (url.startsWith("http") ? url : `http://localhost:8080${url}`) : "#";

  if (loading && !classSubjects.length) return <div style={{textAlign:"center", padding:100}}>Loading curriculum...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Syllabus & Material</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Access modules, files and course outlines.</p>
        </div>
      </div>

      <div className="responsive-grid-side">
        
        {/* Left Col */}
        <div style={{ display:"flex", flexDirection:"column", gap:20, position:"sticky", top:20 }}>
          <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Course Selector</h3>
            {classSubjects.length === 0 ? <div style={{padding:20, textAlign:"center", color:"var(--text-secondary)"}}>No classes assigned.</div> : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {classSubjects.map(cs => (
                  <div key={cs.id} onClick={() => fetchSyllabus(cs.id)} style={{ padding:"14px 16px", borderRadius:12, border: selectedId===cs.id ? "1px solid var(--primary-color)" : "1px solid var(--border-light)", background: selectedId===cs.id ? "rgba(37,99,235,0.05)" : "var(--surface-2)", cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>{if(selectedId!==cs.id)e.currentTarget.style.background="var(--surface-3)"}} onMouseLeave={e=>{if(selectedId!==cs.id)e.currentTarget.style.background="var(--surface-2)"}}>
                     <div style={{ fontWeight:800, fontSize:14, color:selectedId===cs.id?"var(--primary-color)":"var(--text-primary)" }}>{cs.classroomName || cs.classroom?.name}</div>
                     <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginTop:4 }}>{cs.subjectName || cs.subject?.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedId && role !== "STUDENT" && (
            <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
               <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", margin:"0 0 20px" }}>Upload Material</h3>
               <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                 <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Module / Unit</label>
                    <input className="form-input" placeholder="e.g. Unit 1" value={formData.moduleName} onChange={e=>setFormData({...formData, moduleName:e.target.value})} style={{borderRadius:10}} />
                 </div>
                 <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>File Title</label>
                    <input className="form-input" placeholder="e.g. Intro Slides" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} required style={{borderRadius:10}} />
                 </div>
                 <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Description</label>
                    <textarea className="form-input" placeholder="Instructions..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} required style={{borderRadius:10, resize:"none"}} rows={2} />
                 </div>
                 
                 <div style={{ border:"1px dashed var(--border-medium)", background:"var(--surface-2)", borderRadius:12, padding:12, textAlign:"center" }}>
                    <input type="file" id="a-file" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])} />
                    <label htmlFor="a-file" style={{ fontSize:13, fontWeight:600, color:"var(--primary-color)", cursor:"pointer", display:"block" }}>
                      {file ? `📎 ${file.name.substring(0,25)}` : "📎 Attach File (.pdf, .ppt)"}
                    </label>
                 </div>
                 <button type="submit" style={{ width:"100%", padding:"14px", borderRadius:12, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>Post Material</button>
               </form>
            </div>
          )}
        </div>

        {/* Right Col */}
        <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
           
           {!selectedId ? (
              <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:24, minHeight:400, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", textAlign:"center", padding:40 }}>
                 <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
                 <h3 style={{ fontSize:18, fontWeight:700, margin:"0 0 8px", color:"var(--text-secondary)" }}>Waiting for selection</h3>
                 <p style={{ fontSize:14, maxWidth:300, lineHeight:1.5, margin:0 }}>Select a course from the sidebar to view materials.</p>
              </div>
           ) : (
             <>
               {role === "STUDENT" && (
                 <div style={{ background:"linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))", borderRadius:20, padding:24, border:"1px solid rgba(16,185,129,0.2)" }}>
                    <h3 style={{ fontSize:16, fontWeight:800, color:"#047857", margin:"0 0 16px", display:"flex", alignItems:"center", gap:8 }}>✨ AI Plan Generator</h3>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                       <select className="form-input" style={{flex:1, minWidth:150, borderRadius:10, border:"1px solid rgba(16,185,129,0.3)"}} value={selectedModule} onChange={e=>setSelectedModule(e.target.value)}>
                         <option value="General">All Modules / Full Course</option>
                         {Object.keys(groupedSyllabus).map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                       <select className="form-input" style={{width:120, borderRadius:10, border:"1px solid rgba(16,185,129,0.3)"}} value={selectedDays} onChange={e=>setSelectedDays(Number(e.target.value))}>
                         <option value={3}>3 Days</option>
                         <option value={7}>7 Days</option>
                         <option value={14}>14 Days</option>
                       </select>
                       <button onClick={handleGenerateStudyPlan} disabled={loadingPlan} style={{ padding:"0 20px", borderRadius:10, background:"#10b981", color:"white", fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.2)" }}>
                         {loadingPlan ? "Generating..." : "Generate Plan"}
                       </button>
                    </div>
                    {studyPlan && (
                       <div style={{ marginTop:20, padding:20, background:"white", borderRadius:12, border:"1px solid rgba(16,185,129,0.2)", fontSize:14, lineHeight:1.6, color:"#334155" }}>
                         {studyPlan}
                       </div>
                    )}
                 </div>
               )}

               {Object.keys(groupedSyllabus).length === 0 ? (
                 <div style={{ padding:40, textAlign:"center", color:"var(--text-tertiary)", background:"var(--surface-1)", borderRadius:20, border:"1px solid var(--border-light)" }}>No syllabus materials uploaded yet.</div>
               ) : (
                 <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                   {Object.keys(groupedSyllabus).map((module, i) => (
                     <div key={module} style={{ background:"var(--surface-1)", borderRadius:20, border:"1px solid var(--border-light)", overflow:"hidden", boxShadow:"var(--shadow-sm)", animation:`pageEnter 0.4s ease-out ${i*50}ms` }}>
                        <div onClick={()=> role === "STUDENT" ? setExpandedModule(expandedModule===module?null:module) : null} style={{ padding:"20px 24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:role==="STUDENT"?"pointer":"default" }}>
                           <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:"var(--text-primary)", display:"flex", alignItems:"center", gap:10 }}>
                             <span style={{color:"var(--primary-color)"}}>📁</span> {module}
                           </h3>
                           {role === "STUDENT" && (
                             <button onClick={(e)=>{e.stopPropagation(); handleStartTest(module)}} style={{ padding:"8px 16px", borderRadius:8, background:"linear-gradient(135deg, #3b82f6, #2563eb)", color:"white", border:"none", fontWeight:700, fontSize:12, cursor:"pointer", boxShadow:"0 4px 12px rgba(37,99,235,0.3)" }}>
                               Mock Exam (AI)
                             </button>
                           )}
                        </div>
                        
                        {(role !== "STUDENT" || expandedModule === module) && (
                           <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
                              {groupedSyllabus[module].map(item => (
                                <div key={item.syllabusId} style={{ display:"flex", background:"var(--surface-1)", border:"1px solid var(--border-medium)", borderRadius:12, padding:16, alignItems:"center", gap:16 }}>
                                   <div style={{ width:48, height:48, borderRadius:12, background:"rgba(59,130,246,0.1)", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📄</div>
                                   <div style={{ flex:1 }}>
                                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                        <h4 style={{ margin:0, fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{item.title}</h4>
                                        {role !== "STUDENT" && (
                                          <button onClick={()=>handleDelete(item.syllabusId)} style={{ padding:6, borderRadius:6, background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"none", cursor:"pointer" }}>🗑 {item.syllabusId}</button>
                                        )}
                                      </div>
                                      <p style={{ margin:"4px 0 12px", fontSize:13, color:"var(--text-secondary)", lineHeight:1.5 }}>{item.description}</p>
                                      
                                      <div style={{ display:"flex", gap:16, alignItems:"center", fontSize:12, fontWeight:600 }}>
                                         <a href={getFullFileUrl(item.fileLink)} target="_blank" rel="noreferrer" style={{ color:"var(--primary-color)", textDecoration:"none" }}>📎 Open Asset</a>
                                         <span style={{ color:"var(--text-tertiary)" }}>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        )}
                     </div>
                   ))}
                 </div>
               )}
             </>
           )}

        </div>
      </div>
    </div>
  );
};

export default Syllabus;
