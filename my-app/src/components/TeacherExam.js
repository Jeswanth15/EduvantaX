import React, { useEffect, useState } from "react";
import { getAllExamSchedules } from "../utils/api";
import { useNavigate } from "react-router-dom";

const TeacherExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examSchedules, setExamSchedules] = useState([]);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const res = await getAllExamSchedules();
        const allExams = res.data || [];
        allExams.sort((a,b) => String(a.examDate).localeCompare(String(b.examDate)));
        setExamSchedules(allExams);
      } catch (err) { console.error("Error loading exams:", err); }
      finally { setLoading(false); }
    };
    loadExams();
  }, []);

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading examination timeline...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #4c1d95, #7c3aed)", borderRadius:24, padding:32, color:"white", marginBottom:32, boxShadow:"0 12px 32px rgba(124,58,237,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:"#ddd6fe", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Upcoming Schedule</div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:"0 0 8px", fontFamily:"'Outfit', sans-serif" }}>Examination Roster</h1>
            <p style={{ margin:0, color:"#e9d5ff", fontSize:14 }}>Select an exam block to enter marks and grades.</p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.3)", padding:"12px 20px", borderRadius:16, textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, lineHeight:1 }}>{examSchedules.length}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"#ddd6fe", textTransform:"uppercase", marginTop:4 }}>Active Exams</div>
          </div>
        </div>
      </div>

      {examSchedules.length === 0 ? (
        <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:20, padding:60, textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📅</div>
          <div style={{ fontSize:15, fontWeight:700 }}>No active examinations found.</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 }}>
          {examSchedules.map((exam, i) => (
            <div key={exam.examScheduleId} onClick={() => navigate(`/teacher/marks?examId=${exam.examScheduleId}`)} style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, padding:24, cursor:"pointer", boxShadow:"var(--shadow-sm)", transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", animation:`slideInRight 0.3s ease-out ${i*30}ms both` }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="var(--shadow-md)"; e.currentTarget.style.borderColor="var(--primary-color)"}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; e.currentTarget.style.borderColor="var(--border-light)"}}>
               
               <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                 <div>
                   <div style={{ fontSize:12, fontWeight:800, color:"var(--primary-color)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{exam.classroomName || "Global Form"}</div>
                   <h3 style={{ fontSize:18, fontWeight:900, color:"var(--text-primary)", margin:"4px 0 0" }}>{exam.subjectName}</h3>
                 </div>
                 <div style={{ width:40, height:40, borderRadius:12, background:"var(--surface-2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎓</div>
               </div>

               <div style={{ display:"flex", flexDirection:"column", gap:10, background:"var(--surface-2)", padding:16, borderRadius:12 }}>
                 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                   <div style={{ width:24, height:24, borderRadius:6, background:"rgba(59,130,246,0.1)", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>📅</div>
                   <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>{exam.examDate}</div>
                 </div>
                 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                   <div style={{ width:24, height:24, borderRadius:6, background:"rgba(245,158,11,0.1)", color:"#d97706", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>⏰</div>
                   <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>{exam.startTime} – {exam.endTime}</div>
                 </div>
                 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                   <div style={{ width:24, height:24, borderRadius:6, background:"rgba(239,68,68,0.1)", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🏫</div>
                   <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>Room: {exam.roomNo || "TBD"}</div>
                 </div>
               </div>

               <div style={{ marginTop:20, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:700, color:"var(--primary-color)" }}>
                  Enter Marks <span style={{fontSize:16}}>→</span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherExam;
