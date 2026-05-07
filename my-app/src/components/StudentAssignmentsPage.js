import React, { useEffect, useState } from "react";
import { getAssignmentsByClassroom, getAllClassSubjects } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { getDecodedToken } from "../utils/authHelper";

const StudentAssignmentsPage = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;
  const role = decoded?.role;

  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId || role !== "STUDENT") return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [assRes, csRes] = await Promise.all([getAssignmentsByClassroom(classroomId), getAllClassSubjects()]);
        setAssignments(assRes.data || []);
        setClassSubjects((csRes.data || []).filter(c => c.classroomId === classroomId));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, [classroomId, role]);

  const getSubjectName = (subjectId) => {
    const sub = classSubjects.find(s => s.subjectId === subjectId);
    return sub ? sub.subjectName : "General Space";
  };

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading your coursework...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #1e40af, #3b82f6)", borderRadius:24, padding:32, color:"white", marginBottom:32, boxShadow:"0 12px 32px rgba(37,99,235,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:"#93c5fd", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Coursework Portal</div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:"0 0 8px", fontFamily:"'Outfit', sans-serif" }}>My Assignments</h1>
            <p style={{ margin:0, color:"#bfdbfe", fontSize:14 }}>Manage tasks and upcoming deliverables.</p>
          </div>
          <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.3)", padding:"12px 20px", borderRadius:16, textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, lineHeight:1 }}>{assignments.length}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"#bfdbfe", textTransform:"uppercase", marginTop:4 }}>Active Tasks</div>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:20, padding:80, textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <div style={{ fontSize:16, fontWeight:700 }}>You're all caught up!</div>
          <p style={{ fontSize:14, color:"var(--text-tertiary)" }}>No pending deliverables right now.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 }}>
          {assignments.map((a, i) => (
            <div key={a.assignmentId} onClick={() => navigate(`/student/assignments/${a.assignmentId}/submission`)} style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:16, cursor:"pointer", boxShadow:"var(--shadow-sm)", transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", animation:`slideInRight 0.3s ease-out ${i*30}ms both` }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="var(--shadow-md)"; e.currentTarget.style.borderColor="var(--primary-color)"}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; e.currentTarget.style.borderColor="var(--border-light)"}}>
              
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ background:"rgba(59,130,246,0.1)", color:"#3b82f6", padding:"6px 12px", borderRadius:99, fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.5px" }}>{getSubjectName(a.subjectId)}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#ef4444", display:"flex", alignItems:"center", gap:6 }}>⏳ Due: {a.dueDate}</span>
              </div>

              <div>
                <h3 style={{ margin:"0 0 8px", fontSize:18, fontWeight:800, color:"var(--text-primary)", lineHeight:1.3 }}>{a.title}</h3>
                <p style={{ margin:0, fontSize:13.5, color:"var(--text-secondary)", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{a.description}</p>
              </div>

              <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                {a.fileLink ? <span style={{ fontSize:12, fontWeight:700, color:"#10b981", display:"flex", alignItems:"center", gap:6 }}>📎 Assets Attached</span> : <span />}
                <span style={{ fontSize:13, fontWeight:800, color:"var(--primary-color)" }}>Open Task →</span>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentsPage;
