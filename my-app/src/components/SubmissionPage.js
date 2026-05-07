import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAssignmentCompliance, updateGradeAndFeedback } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const SubmissionPage = () => {
  const { assignmentId } = useParams();
  const [complianceData, setComplianceData] = useState(null);
  const [gradeMap, setGradeMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("submitted");

  const loadCompliance = async () => {
    try {
      setPageLoading(true);
      const res = await getAssignmentCompliance(assignmentId);
      setComplianceData(res.data);
    } catch (err) { console.error("Error loading compliance", err); } 
    finally { setPageLoading(false); }
  };

  useEffect(() => { if (assignmentId) loadCompliance(); }, [assignmentId]);

  const handleUpdateGrade = async (submissionId) => {
    const grade = gradeMap[submissionId];
    const feedback = feedbackMap[submissionId];
    if (!grade) return alert("Please enter a grade");
    try {
      await updateGradeAndFeedback(submissionId, grade, feedback || "");
      loadCompliance();
    } catch { alert("Failed to update grade"); }
  };

  const getFullFileUrl = (url) => {
    if (!url) return "#";
    return url.startsWith("http") ? url : `http://localhost:8080${url}`;
  };

  if (pageLoading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Generating compliance report...</div>;
  if (!complianceData) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>No data found.</div>;

  const submittedStudents = complianceData.statuses.filter(s => s.submitted);
  const pendingStudents = complianceData.statuses.filter(s => !s.submitted);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #1e40af, #3b82f6)", borderRadius:24, padding:32, color:"white", marginBottom:32, boxShadow:"0 12px 32px rgba(37,99,235,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:"#93c5fd", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Coursework</div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:"0 0 8px", fontFamily:"'Outfit', sans-serif" }}>{complianceData.assignmentTitle}</h1>
            <p style={{ margin:0, color:"#bfdbfe", fontSize:14 }}>Reviewing submissions & marking</p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.3)", padding:"12px 20px", borderRadius:16, textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, lineHeight:1 }}>{complianceData.totalStudents}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"#bfdbfe", textTransform:"uppercase", marginTop:4 }}>Cohort Total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:12, marginBottom:24, background:"var(--surface-1)", padding:8, borderRadius:16, border:"1px solid var(--border-light)", width:"fit-content", boxShadow:"var(--shadow-sm)" }}>
        <button onClick={() => setActiveTab("submitted")} style={{ padding:"10px 24px", borderRadius:10, border:"none", fontWeight:700, fontSize:13.5, cursor:"pointer", transition:"all 0.2s", background: activeTab==="submitted"?"linear-gradient(135deg, #10b981, #059669)":"transparent", color: activeTab==="submitted"?"white":"var(--text-secondary)", boxShadow: activeTab==="submitted"?"0 4px 12px rgba(16,185,129,0.3)":"none" }}>
          Submitted ({submittedStudents.length})
        </button>
        <button onClick={() => setActiveTab("pending")} style={{ padding:"10px 24px", borderRadius:10, border:"none", fontWeight:700, fontSize:13.5, cursor:"pointer", transition:"all 0.2s", background: activeTab==="pending"?"linear-gradient(135deg, #f59e0b, #d97706)":"transparent", color: activeTab==="pending"?"white":"var(--text-secondary)", boxShadow: activeTab==="pending"?"0 4px 12px rgba(245,158,11,0.3)":"none" }}>
          Awaiting ({pendingStudents.length})
        </button>
      </div>

      {/* Content */}
      <div style={{ animation:"pageEnter 0.4s ease-out" }}>
        {activeTab === "submitted" ? (
          submittedStudents.length === 0 ? (
            <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:20, padding:60, textAlign:"center", color:"var(--text-tertiary)" }}>No submissions received yet.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {submittedStudents.map((s, i) => (
                <div key={s.studentId} style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, overflow:"hidden", boxShadow:"var(--shadow-sm)", animation:`slideInRight 0.3s ease-out ${i*40}ms both` }}>
                  <div style={{ padding:"20px 24px", background:"var(--surface-2)", borderBottom:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:"#3b82f6", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, boxShadow:"0 4px 12px rgba(59,130,246,0.3)" }}>
                        {s.studentName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>{s.studentName}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginTop:2 }}>Submitted: {new Date(s.submission.submissionDate).toLocaleString()}</div>
                      </div>
                    </div>
                    <a href={getFullFileUrl(s.submission.fileLink)} target="_blank" rel="noreferrer" style={{ background:"rgba(59,130,246,0.1)", color:"#3b82f6", border:"1px solid rgba(59,130,246,0.2)", padding:"8px 16px", borderRadius:10, fontSize:13, fontWeight:700, textDecoration:"none", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(59,130,246,0.1)"}>
                      📎 View Source
                    </a>
                  </div>
                  
                  <div style={{ padding:24, display:"flex", alignItems:"center", gap:16, background:"var(--surface-1)" }}>
                     <div style={{ flex:1 }}>
                       <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block", textTransform:"uppercase" }}>Grade Entry</label>
                       <input className="form-input" placeholder={s.submission.grade || "Out of 100..."} onChange={e=>setGradeMap({...gradeMap, [s.submission.submissionId]:e.target.value})} style={{ borderRadius:10 }} />
                     </div>
                     <div style={{ flex:3 }}>
                       <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block", textTransform:"uppercase" }}>Teacher Feedback (Optional)</label>
                       <input className="form-input" placeholder={s.submission.feedback || "Strengths, weaknesses..."} onChange={e=>setFeedbackMap({...feedbackMap, [s.submission.submissionId]:e.target.value})} style={{ borderRadius:10 }} />
                     </div>
                     <button onClick={()=>handleUpdateGrade(s.submission.submissionId)} style={{ padding:"12px 24px", alignSelf:"flex-end", height:"auto", borderRadius:10, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", border:"none", fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>
                        Mark Saved
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          pendingStudents.length === 0 ? (
            <div style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, padding:60, textAlign:"center" }}>
               <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
               <div style={{ fontSize:15, fontWeight:700, color:"#10b981" }}>All 100% submitted! No pending students.</div>
            </div>
          ) : (
             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(250px, 1fr))", gap:16 }}>
               {pendingStudents.map((s, i) => (
                 <div key={s.studentId} style={{ background:"var(--surface-1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:16, padding:20, display:"flex", alignItems:"center", gap:14, boxShadow:"var(--shadow-sm)", animation:`scaleIn 0.3s var(--ease-spring) ${i*30}ms both` }}>
                   <div style={{ width:36, height:36, borderRadius:12, background:"rgba(245,158,11,0.1)", color:"#d97706", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15 }}>{s.studentName.charAt(0)}</div>
                   <div>
                     <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{s.studentName}</div>
                     <div style={{ fontSize:11.5, fontWeight:700, color:"#f59e0b", marginTop:2 }}>⏳ Not Submitted</div>
                   </div>
                 </div>
               ))}
             </div>
          )
        )}
      </div>

    </div>
  );
};

export default SubmissionPage;
