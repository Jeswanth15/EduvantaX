import React, { useState, useEffect } from "react";
import { getAllStudents, getAllBuses, getAllRoutes, updateStudentType, assignStudentStop } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const AdminStudentTransport = () => {
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [msg, setMsg] = useState("");
  const [filters, setFilters] = useState({ name: "", type: "ALL" });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const decoded = getDecodedToken();
      if (decoded?.schoolId) {
        const [s, b, r] = await Promise.all([ getAllStudents(decoded.schoolId), getAllBuses(), getAllRoutes() ]);
        setStudents(s.data); setBuses(b.data); setRoutes(r.data);
      }
    } catch (err) { setMsg("Error loading assets."); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTypeChange = async (sId, nType) => { try { await updateStudentType(sId, nType); setMsg("Protocol updated."); fetchData(); } catch(err){} };
  const handleStopAssignment = async (sId, stopId) => { if(stopId){ try { await assignStudentStop(sId, stopId); setMsg("Coordinates assigned."); fetchData(); } catch(err) {} } };

  const filtered = students.filter(s => 
    (s.name || "").toLowerCase().includes(filters.name.toLowerCase()) && 
    (filters.type === "ALL" || (s.studentType || "DAY_SCHOLAR") === filters.type)
  );

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Deploying manifest...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Passenger Manifest</h1>
          <p style={{ margin:0, fontSize:15, color:"var(--text-secondary)", fontWeight:600 }}>Resolve permissions and binding limits per user.</p>
       </div>

       {msg && <div style={{ background:"var(--text-primary)", color:"white", padding:16, borderRadius:16, marginBottom:24, fontWeight:800 }}>{msg}</div>}

       <div style={{ background:"var(--surface-1)", borderRadius:24, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", marginBottom:32 }}>
          <div style={{ display:"flex", gap:16, background:"var(--surface-2)", padding:8, borderRadius:16 }}>
             <input placeholder="Filter identity..." value={filters.name} onChange={e=>setFilters({...filters, name:e.target.value})} className="form-input" style={{ flex:1, border:"none", background:"transparent" }} />
             <select value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})} className="form-input" style={{ width:200, borderRadius:12 }}>
                <option value="ALL">All Categories</option>
                <option value="DAY_SCHOLAR">Day Scholar</option>
                <option value="HOSTELLER">Hosteller</option>
             </select>
          </div>
       </div>

       <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
             <thead><tr>
                <th style={{ padding:"16px 32px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Identity</th>
                <th style={{ padding:"16px 32px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Architecture</th>
                <th style={{ padding:"16px 32px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Geo Mapping</th>
             </tr></thead>
             <tbody>
                {filtered.map((s, i) => (
                   <tr key={s.userId} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.2s ease ${i*15}ms both` }}>
                      <td style={{ padding:"20px 32px" }}>
                         <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>{s.name}</div>
                         <div style={{ fontSize:13, color:"var(--text-secondary)", fontWeight:600 }}>{s.email}</div>
                      </td>
                      <td style={{ padding:"20px 32px" }}>
                         <select value={s.studentType||"DAY_SCHOLAR"} onChange={e=>handleTypeChange(s.userId,e.target.value)} className="form-input" style={{ width:160, borderRadius:10, padding:"8px 12px", background:(s.studentType==="HOSTELLER"?"rgba(245,158,11,0.05)":"var(--surface-2)"), color:(s.studentType==="HOSTELLER"?"#d97706":"inherit"), borderColor:(s.studentType==="HOSTELLER"?"rgba(245,158,11,0.3)":"var(--border-medium)") }}>
                            <option value="DAY_SCHOLAR">Day Scholar</option>
                            <option value="HOSTELLER">Hosteller</option>
                         </select>
                      </td>
                      <td style={{ padding:"20px 32px" }}>
                         {(!s.studentType || s.studentType==="DAY_SCHOLAR") ? (
                            <StudentAssignmentActions student={s} buses={buses} routes={routes} onAssign={(c)=>handleStopAssignment(s.userId, c)} />
                         ) : <span style={{ fontSize:13, fontWeight:800, color:"var(--text-tertiary)", opacity:0.7 }}>Transport Restrict</span>}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

const StudentAssignmentActions = ({ student, buses, routes, onAssign }) => {
  const [sBusId, setSBusId] = useState("");
  const currentStopId = student.assignedStopId;
  let initBus = "";

  if (currentStopId) {
    const route = routes.find(r => (r.stops||[]).some(st=>st.id===currentStopId));
    if (route) { const b = buses.find(b=>b.route?.id===route.id); if (b) initBus = b.id; }
  }

  useEffect(() => { if (initBus) setSBusId(initBus); else setSBusId(""); }, [initBus, currentStopId]);
  const activeBus = buses.find(b=>b.id===parseInt(sBusId));
  const reqStops = activeBus?.route?.stops || [];

  return (
    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
       <select value={sBusId} onChange={e=>{
           setSBusId(e.target.value);
           if (!e.target.value) {
               // if bus is unselected, we might want to clear the stop, but the API doesn't support clear stop directly yet
           }
       }} className="form-input" style={{ width:180, borderRadius:10, padding:"8px 12px" }}>
          <option value="">Vehicle Assign</option>
          {buses.map(b => <option key={b.id} value={b.id}>Bus {b.busNumber}</option>)}
       </select>
       <select value={currentStopId||""} onChange={e=>onAssign(e.target.value)} disabled={!sBusId} className="form-input" style={{ width:180, borderRadius:10, padding:"8px 12px", opacity:sBusId?1:0.5 }}>
          <option value="">Target Node</option>
          {reqStops.map(st => <option key={st.id} value={st.id}>{st.stopName}</option>)}
       </select>
       {currentStopId && <div style={{ width:28, height:28, background:"#10b981", color:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>✓</div>}
    </div>
  );
};

export default AdminStudentTransport;
