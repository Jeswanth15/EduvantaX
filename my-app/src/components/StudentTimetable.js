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

         <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
               <thead>
                  <tr>
                     <th style={{ width:120, background:"var(--surface-2)", borderBottom:"1px solid var(--border-medium)", borderRight:"1px solid var(--border-medium)" }}></th>
                     {Array.from({length:MAX_PERIODS},(_,i)=>(
                        <th key={i} style={{ padding:"16px", textAlign:"center", fontSize:11, fontWeight:800, color:"var(--text-secondary)", textTransform:"uppercase", background:"var(--surface-2)", borderBottom:"1px solid var(--border-medium)", borderRight:"1px solid var(--border-subtle)" }}>
                           Period {i+1}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {DAY_KEYS.map((dayKey, rIdx) => (
                    <tr key={dayKey}>
                       <td style={{ padding:"20px", background:"var(--surface-2)", borderRight:"1px solid var(--border-medium)", borderBottom:"1px solid var(--border-medium)", textAlign:"center", fontSize:13, fontWeight:800, color:"var(--text-primary)" }}>
                          {FULL_DAY_MAP[dayKey]}
                       </td>
                       {Array.from({length:MAX_PERIODS},(_,p)=>p+1).map((period, cIdx) => {
                          const slot = timetable.find(t=>t.dayOfWeek.toUpperCase().startsWith(dayKey) && Number(t.periodNumber)===period);
                          const hasClass = !!slot;
                          return (
                            <td key={period} style={{ padding:"12px", borderRight:"1px solid var(--border-subtle)", borderBottom:"1px solid var(--border-subtle)", background:hasClass?"var(--surface-1)":"var(--background-color)", transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-3)"}} onMouseLeave={e=>{e.currentTarget.style.background=hasClass?"var(--surface-1)":"var(--background-color)"}}>
                               <div style={{ minHeight:40, display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", fontSize:13, fontWeight:hasClass?700:500, color:hasClass?"var(--text-primary)":"var(--text-tertiary)" }}>
                                  {hasClass ? getSubjectName(slot.subjectId) : "-"}
                               </div>
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
