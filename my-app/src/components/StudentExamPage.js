import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getExamsForStudent } from "../utils/api";

const StudentExamPage = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;
  const userId = decoded?.userId;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyPlan, setStudyPlan] = useState({});
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    if (!classroomId) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getExamsForStudent(classroomId);
        setExams(res.data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, [classroomId]);

  const handleGenerateStudyPlan = async (exam) => {
    if (!exam.classSubjectId) { alert("Missing context."); return; }
    setLoadingPlan(exam.examScheduleId);
    try {
      const res = await fetch(`http://localhost:8080/api/practice/study-plan/${userId}/${exam.classSubjectId}?days=7`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const text = await res.text();
      setStudyPlan(prev => ({ ...prev, [exam.examScheduleId]: text }));
    } catch { setStudyPlan(prev => ({ ...prev, [exam.examScheduleId]: "Failed to generate plan." })); } finally { setLoadingPlan(null); }
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading schedule...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #7c3aed, #4c1d95)", borderRadius:24, padding:32, color:"white", marginBottom:32, boxShadow:"0 12px 32px rgba(124,58,237,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:"#ddd6fe", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Timetable</div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:"0 0 8px", fontFamily:"'Outfit', sans-serif" }}>My Exams</h1>
            <p style={{ margin:0, color:"#e9d5ff", fontSize:14 }}>Prepare for upcoming evaluations with AI.</p>
          </div>
          <div style={{ fontSize:40 }}>🎯</div>
        </div>
      </div>

      {exams.length === 0 ? (
        <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:20, padding:80, textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:16, fontWeight:700 }}>No exams scheduled yet!</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {exams.map((exam, i) => (
            <div key={exam.examScheduleId} style={{ background:"var(--surface-1)", borderLeft:"6px solid #8b5cf6", borderTop:"1px solid var(--border-light)", borderRight:"1px solid var(--border-light)", borderBottom:"1px solid var(--border-light)", borderRadius:20, padding:24, boxShadow:"var(--shadow-sm)", animation:`slideInRight 0.3s ease-out ${i*40}ms both` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <h3 style={{ margin:"0 0 12px", fontSize:20, fontWeight:900, color:"var(--text-primary)" }}>{exam.subjectName || "Assigned Subject"}</h3>
                  <div style={{ display:"flex", gap:20, flexWrap:"wrap", fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{color:"#8b5cf6"}}>📅</span> {new Date(exam.examDate).toLocaleDateString(undefined, {weekday:'long', month:'short', day:'numeric', year:'numeric'})}</span>
                    <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{color:"#f59e0b"}}>⏰</span> {exam.startTime} – {exam.endTime}</span>
                    <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{color:"#ef4444"}}>📍</span> Room: {exam.roomNo || "TBD"}</span>
                  </div>
                </div>
                <button onClick={()=>handleGenerateStudyPlan(exam)} disabled={loadingPlan===exam.examScheduleId} style={{ padding:"10px 20px", borderRadius:10, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", border:"none", fontWeight:800, cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)", opacity:loadingPlan===exam.examScheduleId?0.7:1 }}>
                  ✨ {loadingPlan===exam.examScheduleId ? "Generating..." : "AI Study Plan"}
                </button>
              </div>

              {studyPlan[exam.examScheduleId] && (
                <div style={{ marginTop:24, padding:24, borderRadius:16, border:"1px solid rgba(16,185,129,0.3)", background:"linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))", animation:"fadeIn 0.5s ease-out" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#047857", textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>✨ Generated Plan</div>
                  <div style={{ fontSize:14.5, color:"#334155", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                    {studyPlan[exam.examScheduleId]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentExamPage;
