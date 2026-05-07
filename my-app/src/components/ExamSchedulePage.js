import React, { useEffect, useMemo, useState } from "react";
import { getAllClassrooms, getAllSubjects, getAllClassSubjects, createOrUpdateExamSchedule, getAllExamSchedules, deleteExamSchedule } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const ExamSchedulePage = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);

  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  const [form, setForm] = useState({ examDate: "", startTime: "", endTime: "", roomNo: "" });

  const subjectsForSelectedClasses = useMemo(() => {
    if (!selectedClassIds.length) return [];
    const set = new Map();
    classSubjects.forEach(cs => {
      if (selectedClassIds.includes(Number(cs.classroomId))) {
        set.set(cs.subjectId, { subjectId: Number(cs.subjectId), subjectName: cs.subjectName });
      }
    });
    return [...set.values()];
  }, [selectedClassIds, classSubjects]);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([getAllClassrooms(schoolId), getAllSubjects(), getAllClassSubjects(), getAllExamSchedules()])
      .then(([cls, subs, cs, exams]) => {
        setClassrooms(cls.data || []); setSubjects(subs.data || []); setClassSubjects(cs.data || []); setExamSchedules(exams.data || []);
      }).catch(console.error);
  }, [schoolId]);

  const handleClassroomsChange = (e) => {
    const list = [...e.target.selectedOptions].map(opt => Number(opt.value));
    setSelectedClassIds(list); setSelectedSubjectIds([]);
  };

  const toggleSubject = (id) => setSelectedSubjectIds(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const handleCreate = async () => {
    if (!selectedClassIds.length) return alert("Select at least one class");
    if (!selectedSubjectIds.length) return alert("Select at least one subject");
    if (!form.examDate || !form.startTime || !form.endTime) return alert("Fill date and time");

    try {
      const tasks = [];
      for (let classId of selectedClassIds) {
        for (let subjectId of selectedSubjectIds) {
          tasks.push(createOrUpdateExamSchedule({ classroomId: classId, subjectId, ...form }));
        }
      }
      await Promise.all(tasks);
      setForm({ examDate: "", startTime: "", endTime: "", roomNo: "" }); setSelectedSubjectIds([]);
      const res = await getAllExamSchedules();
      setExamSchedules(res.data || []);
    } catch { alert("Error creating exam"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    try { await deleteExamSchedule(id); const res = await getAllExamSchedules(); setExamSchedules(res.data || []); }
    catch { alert("Delete failed"); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Examination Planner</h1>
        <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Schedule and allocate testing modules efficiently.</p>
      </div>

      <div className="responsive-grid-side">
        {/* Left pane: Form Config */}
        <div style={{ display:"flex", flexDirection:"column", gap:20, position:"sticky", top:20 }}>
           <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
             <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Module Selectors</h3>
             <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:8, display:"block" }}>Target Classrooms (Multi-select ctrl/cmd)</label>
             <select multiple value={selectedClassIds} onChange={handleClassroomsChange} className="form-input" style={{ height:140, borderRadius:12, marginBottom:20, padding:8 }}>
               {classrooms.map(c => <option key={c.classId} value={c.classId} style={{padding:"6px 8px"}}>{c.name} {c.section}</option>)}
             </select>

             <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:8, display:"block" }}>Examinable Subjects</label>
             {selectedClassIds.length === 0 ? <div style={{ fontSize:12, color:"var(--text-tertiary)", padding:"12px", background:"var(--surface-2)", borderRadius:10, textAlign:"center" }}>Select classrooms first.</div> : (
               <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                 {subjectsForSelectedClasses.map(sub => (
                   <label key={sub.subjectId} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background: selectedSubjectIds.includes(sub.subjectId)?"rgba(59,130,246,0.1)":"var(--surface-2)", border: selectedSubjectIds.includes(sub.subjectId)? "1px solid rgba(59,130,246,0.3)":"1px solid var(--border-subtle)", borderRadius:10, cursor:"pointer", transition:"all 0.2s" }}>
                     <input type="checkbox" checked={selectedSubjectIds.includes(sub.subjectId)} onChange={()=>toggleSubject(sub.subjectId)} style={{accentColor:"var(--primary-color)", width:16, height:16, cursor:"pointer"}} />
                     <span style={{ fontSize:13, fontWeight:700, color: selectedSubjectIds.includes(sub.subjectId)?"var(--primary-color)":"var(--text-primary)" }}>{sub.subjectName}</span>
                   </label>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Right pane: Create Form + List */}
        <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
          
          <div style={{ background:"var(--surface-1)", borderRadius:20, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
             <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)", margin:"0 0 20px" }}>➕ Provision Exam Slot</h3>
             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, marginBottom:20 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Exam Date</label>
                  <input type="date" value={form.examDate} onChange={e=>setForm({...form, examDate:e.target.value})} className="form-input" style={{borderRadius:10}} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Start Time</label>
                  <input type="time" value={form.startTime} onChange={e=>setForm({...form, startTime:e.target.value})} className="form-input" style={{borderRadius:10}} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>End Time</label>
                  <input type="time" value={form.endTime} onChange={e=>setForm({...form, endTime:e.target.value})} className="form-input" style={{borderRadius:10}} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:6, display:"block" }}>Invigilation Room</label>
                  <input type="text" placeholder="e.g. Hall A" value={form.roomNo} onChange={e=>setForm({...form, roomNo:e.target.value})} className="form-input" style={{borderRadius:10}} />
                </div>
             </div>
             <button onClick={handleCreate} style={{ width:"100%", padding:"14px", borderRadius:12, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 4px 12px rgba(16,185,129,0.3)" }}>Publish Exam Schedule</button>
          </div>

          <div>
             <h3 style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", margin:"0 0 16px" }}>Scheduled Master Roster</h3>
             {examSchedules.length === 0 ? <div style={{ background:"var(--surface-1)", borderRadius:20, padding:40, textAlign:"center", color:"var(--text-tertiary)", border:"1px dashed var(--border-medium)" }}>No exams scheduled.</div> : (
               <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
                 {examSchedules.map(exam => (
                   <div key={exam.examScheduleId} style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:16, padding:20, position:"relative", boxShadow:"var(--shadow-sm)" }}>
                     <div style={{ position:"absolute", top:20, right:20, width:10, height:10, borderRadius:"50%", background:"#ef4444", boxShadow:"0 0 8px #ef4444" }} />
                     <h4 style={{ margin:"0 0 16px", fontSize:16, color:"var(--primary-color)", fontWeight:800 }}>{exam.subjectName}</h4>
                     <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13, color:"var(--text-secondary)" }}>
                       <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{fontWeight:600}}>Date:</span> <span>{exam.examDate}</span></div>
                       <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{fontWeight:600}}>Window:</span> <span>{exam.startTime} - {exam.endTime}</span></div>
                       <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{fontWeight:600}}>Venue:</span> <span>{exam.roomNo || "TBD"}</span></div>
                     </div>
                     <button onClick={()=>handleDelete(exam.examScheduleId)} style={{ marginTop:16, width:"100%", padding:"8px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", fontWeight:700, fontSize:12, cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.1)"}>Cancel Exam</button>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExamSchedulePage;
