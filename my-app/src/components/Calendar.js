import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getCalendarBySchool, createCalendarEntry, updateCalendarEntry, generateSchoolCalendar } from "../utils/api";

const Calendar = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [calendar, setCalendar] = useState([]);
  const [form, setForm] = useState({ date: "", status: "WORKING", description: "" });
  const [generateForm, setGenerateForm] = useState({ startDate: "", endDate: "", holidays: "" });
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDate, setEditingDate] = useState(null);

  useEffect(() => { if (!schoolId) return; loadCalendar(); }, [schoolId]);

  const loadCalendar = async () => {
    try { const res = await getCalendarBySchool(schoolId); setCalendar(res.data); } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleGenerateChange = (e) => setGenerateForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.date) return alert("Validation Required");
    try { await createCalendarEntry({ ...form, schoolId }); loadCalendar(); setForm({ date: "", status: "WORKING", description: "" }); } catch (err) { console.error(err); }
  };

  const handleGenerate = async () => {
    if (!generateForm.startDate || !generateForm.endDate) return alert("Need bounds");
    try {
      const hols = generateForm.holidays ? generateForm.holidays.split(",").map(d => d.trim()) : [];
      await generateSchoolCalendar(schoolId, generateForm.startDate, generateForm.endDate, hols);
      loadCalendar();
    } catch (err) { console.error(err); }
  };

  const changeMonth = offset => { const nw = new Date(currentMonth); nw.setMonth(nw.getMonth() + offset); setCurrentMonth(nw); };

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const getCalendarDays = () => {
    const days = [];
    // Monday-first: Mon=0, Tue=1, ..., Sun=6
    const id = (startOfMonth.getDay() + 6) % 7;
    for(let i=0; i<id; i++) days.push(null);
    for(let i=1; i<=endOfMonth.getDate(); i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    return days;
  };

  const getDayStatus = (date) => {
    if(!date) return ""; const dt = date.toISOString().split("T")[0]; const e = calendar.find(c => c.date === dt); return e ? e.status : null;
  };

  const updateDayStatus = async (dt, stat) => {
    try {
      const cur = calendar.find(c => c.date === dt);
      if(cur) await updateCalendarEntry(cur.calendarId, {...cur, status:stat}); else await createCalendarEntry({schoolId, date:dt, status:stat});
      loadCalendar(); setEditingDate(null);
    } catch(err) {}
  };

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = getCalendarDays();

  const getColor = (s) => s === "HOLIDAY" ? "#fee2e2" : s === "HALF_DAY" ? "#fef3c7" : s === "SUNDAY" ? "#f1f5f9" : s === "WORKING" ? "#e0e7ff" : "transparent";
  const getTextColor = (s) => s === "HOLIDAY" ? "#b91c1c" : s === "HALF_DAY" ? "#b45309" : s === "SUNDAY" ? "#475569" : s === "WORKING" ? "#4338ca" : "var(--text-secondary)";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Institutional Chronology</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Establish calendar logic, holidays, and automatic generation rules.</p>
       </div>

       <div className="grid-2-col-responsive" style={{ marginBottom:32 }}>
          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
             <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 20px" }}>Mass Extrapolation</h3>
             <div className="grid-2-col-responsive" style={{ gap:12, marginBottom:16 }}>
                <div><label style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Init Date</label><input type="date" name="startDate" className="form-input" style={{ width:"100%" }} value={generateForm.startDate} onChange={handleGenerateChange} /></div>
                <div><label style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>End Date</label><input type="date" name="endDate" className="form-input" style={{ width:"100%" }} value={generateForm.endDate} onChange={handleGenerateChange} /></div>
             </div>
             <div style={{ marginBottom:20 }}><label style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Global Exclusions (Comma Sep)</label><input type="text" name="holidays" placeholder="YYYY-MM-DD, YYYY-MM-DD" className="form-input" style={{ width:"100%" }} value={generateForm.holidays} onChange={handleGenerateChange} /></div>
             <button onClick={handleGenerate} style={{ width:"100%", padding:14, background:"var(--primary-color)", color:"white", borderRadius:12, fontWeight:800, border:"none", cursor:"pointer" }}>Run Vector Sync</button>
          </div>

          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
             <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 20px" }}>Manual Point Override</h3>
             <div className="grid-2-col-responsive" style={{ gap:12, marginBottom:16 }}>
                <div><label style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Target Entity</label><input type="date" name="date" className="form-input" style={{ width:"100%" }} value={form.date} onChange={handleChange} /></div>
                <div><label style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>State Classification</label><select name="status" className="form-input" style={{ width:"100%" }} value={form.status} onChange={handleChange}><option value="WORKING">Working</option><option value="HOLIDAY">Holiday</option><option value="HALF_DAY">Half Day</option></select></div>
             </div>
             <div style={{ marginBottom:20 }}><label style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>Context Tag</label><input type="text" name="description" placeholder="Description Tag" className="form-input" style={{ width:"100%" }} value={form.description} onChange={handleChange} /></div>
             <button onClick={handleSubmit} style={{ width:"100%", padding:14, background:"#f59e0b", color:"white", borderRadius:12, fontWeight:800, border:"none", cursor:"pointer" }}>Push Singular Matrix</button>
          </div>
       </div>

       <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
          <button onClick={() => setShowCalendar(p=>!p)} style={{ padding:"14px 40px", borderRadius:99, background:"linear-gradient(135deg, #1e40af, #3b82f6)", border:"none", color:"white", fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:"0 8px 24px rgba(37,99,235,0.3)" }}>
             {showCalendar ? "Collapse GUI" : "Open Geographic Viewer"}
          </button>
       </div>

       {showCalendar && (
          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-lg)", animation:"slideDown 0.4s ease" }}>
             <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
                <button onClick={()=>changeMonth(-1)} style={{ width:40, height:40, borderRadius:"50%", background:"var(--surface-2)", border:"none", fontWeight:800, cursor:"pointer" }}>←</button>
                <h3 style={{ margin:0, fontSize:22, fontWeight:900, textTransform:"uppercase", letterSpacing:"1px" }}>{currentMonth.toLocaleString("default", { month:"long", year:"numeric" })}</h3>
                <button onClick={()=>changeMonth(1)} style={{ width:40, height:40, borderRadius:"50%", background:"var(--surface-2)", border:"none", fontWeight:800, cursor:"pointer" }}>→</button>
             </div>

             <div className="table-scroll-wrapper">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:12, minWidth:700 }}>
                   {weekdays.map(w => <div key={w} style={{ textAlign:"center", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", paddingBottom:12 }}>{w}</div>)}
                   {days.map((date, idx) => {
                      const stat = getDayStatus(date);
                      const dtStr = date?.toISOString().split("T")[0];
                      return (
                         <div key={idx} onClick={()=>date && setEditingDate(dtStr)} style={{ aspectRatio:"1/1", borderRadius:16, border:date?"1px solid var(--border-medium)":"none", background:getColor(stat), display:"flex", flexDirection:"column", padding:12, position:"relative", cursor:date?"pointer":"default", transition:"transform 0.2s" }} onMouseEnter={e=>{if(date)e.currentTarget.style.transform="scale(1.03)"}} onMouseLeave={e=>{if(date)e.currentTarget.style.transform="scale(1)"}}>
                            {date && <span style={{ fontSize:15, fontWeight:800, color:getTextColor(stat) }}>{date.getDate()}</span>}
                            
                            {editingDate === dtStr ? (
                               <select autoFocus onBlur={()=>setEditingDate(null)} onChange={e=>updateDayStatus(dtStr, e.target.value)} style={{ position:"absolute", bottom:10, left:10, right:10, width:"calc(100% - 20px)", padding:4, fontSize:10, borderRadius:4, outline:"none", border:"1px solid var(--primary-color)" }} value={stat || "WORKING"}>
                                  <option value="WORKING">Work</option><option value="HOLIDAY">Hol</option><option value="HALF_DAY">Half</option>
                               </select>
                            ) : (
                               stat && <span style={{ position:"absolute", bottom:12, left:12, fontSize:10, fontWeight:800, color:getTextColor(stat), textTransform:"uppercase" }}>{stat.slice(0,4)}</span>
                            )}
                         </div>
                      )
                   })}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default Calendar;
