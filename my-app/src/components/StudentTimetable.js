import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getAllTimetables, getAllClassSubjects, getClassroomById } from "../utils/api";

const StudentTimetable = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;
  const role = decoded?.role;

  const [timetable, setTimetable] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [loading, setLoading] = useState(true);

  const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const FULL_DAY_MAP = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday" };
  const MAX_PERIODS = 7;

  useEffect(() => {
    if (!classroomId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [cls, tt, cs] = await Promise.all([getClassroomById(classroomId), getAllTimetables(), getAllClassSubjects()]);
        setMyClass(cls.data);
        setTimetable(tt.data.filter(t => t.classroomId === classroomId));
        setClassSubjects(cs.data.filter(c => c.classroomId === classroomId));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, [classroomId]);

  if (role !== "STUDENT") return <div style={{textAlign:"center", padding:100}}>Access Denied</div>;
  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Drawing timeframe...</div>;

  const getSubjectName = (subjectId) => classSubjects.find(c => c.subjectId === subjectId)?.subjectName || "-";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Master Timetable</h1>
        <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Your weekly organizational structure.</p>
      </div>

      <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
         
         <div style={{ padding:"24px", background:"linear-gradient(135deg, rgba(37,99,235,0.05), rgba(139,92,246,0.05))", borderBottom:"1px solid var(--border-subtle)", display:"flex", gap:20, alignItems:"center" }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"var(--primary-color)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🏫</div>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--primary-color)", textTransform:"uppercase", letterSpacing:"1px" }}>Active Form</div>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", marginTop:4 }}>{myClass?.className || "Loading..."}</div>
            </div>
         </div>

         <div className="table-scroll-wrapper">
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
               <thead><tr style={{ background:"var(--surface-2)" }}>
                  <th style={{ padding:16, borderBottom: "1px solid var(--border-subtle)", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform: "uppercase" }}>Day</th>
                  {[1,2,3,4,5,6,7].map(p=><th key={p} style={{ padding:16, borderBottom: "1px solid var(--border-subtle)", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform: "uppercase" }}>P{p}</th>)}
               </tr></thead>
               <tbody>
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map(dayKey => (
                     <tr key={dayKey}>
                        <td style={{ padding:16, fontWeight:800, background:"var(--surface-2)", color:"var(--text-secondary)", borderBottom:"1px solid var(--border-subtle)", fontSize:12 }}>{dayKey}</td>
                        {[1,2,3,4,5,6,7].map(period => {
                          const slot = timetable.find(t=>t.dayOfWeek.toUpperCase().startsWith(dayKey) && Number(t.periodNumber)===period);
                          const subName = slot ? classSubjects.find(s=>s.subjectId===slot.subjectId)?.subjectName : null;
                          return (
                            <td key={period} style={{ padding:16, borderBottom: "1px solid var(--border-subtle)", background: slot ? "rgba(37,99,235,0.05)" : "transparent", textAlign:"center" }}>
                               {slot ? (
                                  <div>
                                     <div style={{ fontSize:13, fontWeight:800, color:"var(--primary-color)" }}>{subName || "Unmapped"}</div>
                                     <div style={{ fontSize:10, color:"var(--text-tertiary)", marginTop:4 }}>P{period}</div>
                                  </div>
                               ) : "--"}
                            </td>
                          );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default StudentTimetable;
