import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getMarksByStudent } from "../utils/api";

const StudentMarksPage = () => {
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;

  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("DATE_DESC");

  useEffect(() => {
    if (!studentId) return;
    const loadMarks = async () => {
      try { setLoading(true); const res = await getMarksByStudent(studentId); setMarks(res.data || []); } 
      catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadMarks();
  }, [studentId]);

  const sortedMarks = [...marks].sort((a,b) => {
    if (sortBy==="SUBJECT_ASC") return a.subjectName.localeCompare(b.subjectName);
    if (sortBy==="SUBJECT_DESC") return b.subjectName.localeCompare(a.subjectName);
    if (sortBy==="MARKS_ASC") return a.marksObtained - b.marksObtained;
    if (sortBy==="MARKS_DESC") return b.marksObtained - a.marksObtained;
    if (sortBy==="DATE_ASC") return new Date(a.examDate) - new Date(b.examDate);
    return new Date(b.examDate) - new Date(a.examDate);
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Results Transcript</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Your official grade registry.</p>
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="form-input" style={{ width: 180, borderRadius:10 }}>
           <option value="DATE_DESC">Latest First</option>
           <option value="DATE_ASC">Oldest First</option>
           <option value="SUBJECT_ASC">Subject A → Z</option>
           <option value="MARKS_DESC">Marks High → Low</option>
        </select>
      </div>

      {loading ? <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Fetching records...</div> : sortedMarks.length === 0 ? (
        <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:20, padding:80, textAlign:"center", color:"var(--text-secondary)" }}>No grades found in the system.</div>
      ) : (
        <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
           <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                 <thead>
                    <tr>
                       <th style={{ textAlign:"left", padding:"18px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)", background:"var(--surface-2)" }}>Subject / Target</th>
                       <th style={{ textAlign:"center", padding:"18px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)", background:"var(--surface-2)" }}>Exam Context</th>
                       <th style={{ textAlign:"right", padding:"18px 24px", fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border-subtle)", background:"var(--surface-2)" }}>Score Attained</th>
                    </tr>
                 </thead>
                 <tbody>
                    {sortedMarks.map((m, i) => {
                      const perc = m.totalMarks ? (m.marksObtained/m.totalMarks)*100 : 0;
                      return (
                        <tr key={m.marksId} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.3s ease ${i*30}ms both` }}>
                           <td style={{ padding:"16px 24px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                                 <div style={{ width:40, height:40, borderRadius:12, background:"rgba(16,185,129,0.1)", color:"#10b981", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{m.subjectName?.charAt(0)}</div>
                                 <div>
                                   <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>{m.subjectName}</div>
                                   <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginTop:2 }}>{new Date(m.examDate).toLocaleDateString()}</div>
                                 </div>
                              </div>
                           </td>
                           <td style={{ padding:"16px 24px", textAlign:"center", fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>
                              <span style={{ padding:"4px 10px", background:"var(--surface-2)", borderRadius:99, border:"1px solid var(--border-light)" }}>{m.examType || "General Assessment"}</span>
                           </td>
                           <td style={{ padding:"16px 24px", textAlign:"right" }}>
                              <div style={{ fontSize:20, fontWeight:900, color:perc>=80?"#10b981":perc>=50?"#f59e0b":"#ef4444" }}>{m.marksObtained} <span style={{fontSize:14, color:"var(--text-secondary)", fontWeight:700}}>/ {m.totalMarks}</span></div>
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentMarksPage;
