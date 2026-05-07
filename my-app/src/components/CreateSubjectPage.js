import React, { useEffect, useState } from "react";
import { getAllSubjects, createSubject, deleteSubject } from "../utils/api";

const CreateSubjectPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      const res = await getAllSubjects();
      setSubjects(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return alert("Subject name is required");
    try { await createSubject({ name, code }); setName(""); setCode(""); fetchSubjects(); } 
    catch (err) { alert("Failed to establish subject line."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Retire this subject profile?")) return;
    try { await deleteSubject(id); fetchSubjects(); } catch (err) { alert("Failed to delete."); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading subject database...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Subject Registry</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Global catalog of academic programs and subjects.</p>
       </div>

       <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:32, alignItems:"start" }}>
          
          {/* Creator form */}
          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-md)", position:"sticky", top:20 }}>
             <div style={{ width:48, height:48, borderRadius:16, background:"linear-gradient(135deg, #f59e0b, #d97706)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:20 }}>📘</div>
             <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 24px", color:"var(--text-primary)" }}>Register Program</h3>

             <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:24 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Program Designation</label>
                  <input type="text" placeholder="e.g. Advanced Physics" value={name} onChange={e=>setName(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Global Reference Code</label>
                  <input type="text" placeholder="e.g. PHY-401" value={code} onChange={e=>setCode(e.target.value)} className="form-input" style={{ width:"100%", borderRadius:12 }} />
                </div>
             </div>

             <button onClick={handleCreate} style={{ width:"100%", padding:16, background:"var(--text-primary)", color:"white", borderRadius:14, fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 8px 24px rgba(0,0,0,0.15)", transition:"transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                Mint Registry Entry
             </button>
          </div>

          {/* List */}
          <div>
             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:20 }}>
                {subjects.length === 0 ? <div style={{ gridColumn:"1 / -1", padding:60, textAlign:"center", background:"var(--surface-1)", borderRadius:24, border:"1px dashed var(--border-medium)", color:"var(--text-tertiary)" }}>No entries in the subject registry.</div> : subjects.map((subj, i) => (
                   <div key={subj.subjectId} style={{ background:"var(--surface-1)", borderRadius:20, padding:20, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", justifyContent:"space-between", animation:`pageEnter 0.3s ease ${i*20}ms both`, minHeight:160 }}>
                      <div>
                         <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", marginBottom:8, lineHeight:1.3 }}>{subj.name}</div>
                         <div style={{ display:"inline-block", padding:"4px 10px", background:"var(--surface-2)", border:"1px solid var(--border-light)", borderRadius:8, fontSize:11, fontWeight:700, color:"var(--text-secondary)", letterSpacing:"1px" }}>
                            {subj.code || "NO-CODE"}
                         </div>
                      </div>
                      <button onClick={()=>handleDelete(subj.subjectId)} style={{ marginTop:20, padding:8, borderRadius:10, background:"transparent", border:"1px solid var(--border-medium)", color:"#ef4444", fontWeight:700, cursor:"pointer", fontSize:12, transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.borderColor="#fecaca"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="var(--border-medium)"}}>
                         Revoke Protocol
                      </button>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

export default CreateSubjectPage;
