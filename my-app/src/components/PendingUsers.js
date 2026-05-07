import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import * as XLSX from "xlsx";
import { getPendingUsersBySchool, getTeachersBySchool, getStudentsBySchool, approveUser, rejectUser, deleteUser, bulkRegister } from "../utils/api";

const PendingUsers = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [p, t, s] = await Promise.all([ getPendingUsersBySchool(schoolId), getTeachersBySchool(schoolId), getStudentsBySchool(schoolId) ]);
      setPendingUsers(p.data); setTeachers(t.data); setStudents(s.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (schoolId) fetchAll(); }, [schoolId]);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      setExcelData(json.map((r) => ({ name: r.name || r.Name, email: r.email || r.Email, password: r.password || r.Password, role: r.role || r.Role, schoolId })));
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    try { await bulkRegister(excelData); alert("Bulk registered!"); setExcelData([]); setShowBulk(false); fetchAll(); } 
    catch (e) { alert("Bulk Registration Failed"); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading directory...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
       
       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
          <div>
             <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>User Management</h1>
             <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Oversee school personnel and approve pending requests.</p>
          </div>
          <button onClick={()=>setShowBulk(!showBulk)} style={{ background:"var(--surface-1)", border:"1px solid var(--border-medium)", padding:"12px 20px", borderRadius:16, fontWeight:800, color:"var(--text-primary)", cursor:"pointer", boxShadow:"var(--shadow-sm)" }}>
             {showBulk ? "Close Bulk Module" : "Bulk Register Users"}
          </button>
       </div>

       {showBulk && (
          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, marginBottom:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-md)", animation:"slideDown 0.3s ease" }}>
             <h3 style={{ margin:"0 0 20px", fontSize:18, fontWeight:800 }}>Upload Personnel Data</h3>
             
             <div style={{ border:"2px dashed var(--border-medium)", padding:40, textAlign:"center", borderRadius:20, background:"var(--surface-2)", marginBottom:24 }}>
                <input type="file" accept=".xlsx,.xls" id="bulk-upload" onChange={handleExcelUpload} style={{ display:"none" }} />
                <label htmlFor="bulk-upload" style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                   <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(59,130,246,0.1)", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📁</div>
                   <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{excelData.length ? `${excelData.length} Records Loaded` : `Click to Select Excel File`}</div>
                   <div style={{ fontSize:13, color:"var(--text-muted)" }}>Supports .xlsx and .xls formats</div>
                </label>
             </div>

             {excelData.length > 0 && (
               <div>
                  <div style={{ maxHeight:200, overflowY:"auto", background:"var(--surface-2)", padding:16, borderRadius:16, marginBottom:24 }}>
                     {excelData.map((u, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:i<excelData.length-1?"1px solid var(--border-subtle)":"none" }}>
                           <span style={{ fontSize:14, fontWeight:700, color:"var(--text-secondary)" }}>{u.name} <span style={{ fontWeight:400, color:"var(--text-tertiary)" }}>({u.email})</span></span>
                           <span style={{ fontSize:11, fontWeight:800, background:"rgba(139,92,246,0.1)", color:"#8b5cf6", padding:"4px 10px", borderRadius:99 }}>{u.role}</span>
                        </div>
                     ))}
                  </div>
                  <button onClick={handleBulkSubmit} style={{ width:"100%", padding:16, borderRadius:16, background:"var(--primary-color)", color:"white", border:"none", fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:"0 8px 24px rgba(37,99,235,0.3)" }}>
                     Execute Bulk Registration
                  </button>
               </div>
             )}
          </div>
       )}

       <div style={{ marginBottom:48 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}><span style={{ color:"#f59e0b" }}>●</span> Pending Approvals</h2>
          
          {pendingUsers.length === 0 ? <div style={{ background:"var(--surface-1)", padding:60, textAlign:"center", borderRadius:24, border:"1px dashed var(--border-medium)", color:"var(--text-tertiary)" }}>No pending account requests at this time.</div> : (
             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 }}>
                {pendingUsers.map(u => (
                   <div key={u.userId} style={{ background:"var(--surface-1)", borderRadius:24, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                         <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>{u.name}</div>
                         <div style={{ padding:"4px 10px", borderRadius:99, fontSize:10, fontWeight:800, background:"rgba(245,158,11,0.1)", color:"#f59e0b" }}>{u.role}</div>
                      </div>
                      <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:24 }}>{u.email}</div>
                      
                      <div style={{ display:"flex", gap:12 }}>
                         <button onClick={()=>approveUser(u.userId, schoolId).then(fetchAll)} style={{ flex:1, padding:10, borderRadius:12, background:"#10b981", color:"white", fontWeight:800, border:"none", cursor:"pointer" }}>Approve</button>
                         <button onClick={()=>rejectUser(u.userId, schoolId).then(fetchAll)} style={{ flex:1, padding:10, borderRadius:12, background:"rgba(245,158,11,0.1)", color:"#f59e0b", fontWeight:800, border:"none", cursor:"pointer" }}>Reject</button>
                         <button onClick={()=>deleteUser(u.userId).then(fetchAll)} style={{ padding:10, borderRadius:12, background:"rgba(239,68,68,0.1)", color:"#ef4444", fontWeight:800, border:"none", cursor:"pointer" }}>🗑</button>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

       <div className="grid-2-col-responsive" style={{ gap:32 }}>
          <div>
             <h2 style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", marginBottom:20 }}>Active Staff</h2>
             <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                   <thead style={{ background:"var(--surface-2)" }}><tr>
                      <th style={{ padding:16, textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Name</th>
                      <th style={{ padding:16, textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Email</th>
                   </tr></thead>
                   <tbody>
                      {teachers.map(t => (
                         <tr key={t.userId} style={{ borderTop:"1px solid var(--border-subtle)" }}>
                            <td style={{ padding:"16px", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t.name}</td>
                            <td style={{ padding:"16px", fontSize:13, color:"var(--text-secondary)" }}>{t.email}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
          <div>
             <h2 style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", marginBottom:20 }}>Active Students</h2>
             <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                   <thead style={{ background:"var(--surface-2)" }}><tr>
                      <th style={{ padding:16, textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Name</th>
                      <th style={{ padding:16, textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Email</th>
                   </tr></thead>
                   <tbody>
                      {students.map(s => (
                         <tr key={s.userId} style={{ borderTop:"1px solid var(--border-subtle)" }}>
                            <td style={{ padding:"16px", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{s.name}</td>
                            <td style={{ padding:"16px", fontSize:13, color:"var(--text-secondary)" }}>{s.email}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>

    </div>
  );
};

export default PendingUsers;
