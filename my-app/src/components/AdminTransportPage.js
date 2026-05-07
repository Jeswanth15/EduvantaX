import React, { useState, useEffect, useRef, useCallback } from "react";
import { createBus, createRoute, addStop, assignDriver, assignBusToRoute, approveDriver, getDriversBySchool, getAllBuses, getAllRoutes, getAllDriversList, deleteBus, deleteRoute, getTripSummaries, getProposedStops, approveProposedStop, deleteStop } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const AdminTransportPage = () => {
  const [msg, setMsg] = useState("");
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [editingBusId, setEditingBusId] = useState(null);
  const [tripSummary, setTripSummary] = useState([]);
  const [proposedStops, setProposedStops] = useState([]);

  const adminMapRef = useRef(null);
  const adminMarkerRef = useRef(null);
  const latInputRef = useRef(null);
  const lngInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const initAdminMap = useCallback(() => {
    if (adminMapRef.current || !window.L) return;
    adminMapRef.current = window.L.map('admin-map', { zoomControl:false }).setView([13.0827, 80.2707], 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(adminMapRef.current);
    
    adminMapRef.current.on('click', function(e) {
      if (!adminMarkerRef.current) adminMarkerRef.current = window.L.marker(e.latlng).addTo(adminMapRef.current);
      else adminMarkerRef.current.setLatLng(e.latlng);
      if (latInputRef.current) latInputRef.current.value = e.latlng.lat.toFixed(6);
      if (lngInputRef.current) lngInputRef.current.value = e.latlng.lng.toFixed(6);
    });
  }, []);

  useEffect(() => {
    if (!window.L) {
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true; document.head.appendChild(script);
      const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      script.onload = initAdminMap;
    } else initAdminMap();
    return () => { if (adminMapRef.current) { adminMapRef.current.remove(); adminMapRef.current = null; } };
  }, [initAdminMap]);

  const searchLocation = async () => {
    const q = searchInputRef.current?.value;
    if (!q) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const latlng = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        if (!adminMarkerRef.current) adminMarkerRef.current = window.L.marker(latlng).addTo(adminMapRef.current);
        else adminMarkerRef.current.setLatLng(latlng);
        adminMapRef.current.setView(latlng, 15);
        if (latInputRef.current) latInputRef.current.value = latlng.lat.toFixed(6);
        if (lngInputRef.current) lngInputRef.current.value = latlng.lng.toFixed(6);
      } else alert("Location not found! Try searching a nearby landmark.");
    } catch(err) { alert("Search error occurred."); }
  };

  const fetchData = async () => {
    try {
      const decoded = getDecodedToken();
      if (decoded?.schoolId) {
        const dRes = await getDriversBySchool(decoded.schoolId); const allDriverUsers = dRes.data;
        const bRes = await getAllBuses(); setBuses(bRes.data);
        const rRes = await getAllRoutes(); setRoutes(rRes.data);
        const dlRes = await getAllDriversList(); const curList = Array.isArray(dlRes.data) ? dlRes.data : []; setDriversList(curList);
        
        setApprovedDrivers(allDriverUsers.filter(d => d.approvalStatus === "APPROVED"));
        setPendingDrivers(allDriverUsers.filter(d => d.approvalStatus === "PENDING" || d.approvalStatus === "REJECTED" || (d.approvalStatus === "APPROVED" && !curList.find(dl => dl.user?.userId === d.userId))));
        
        const tsRes = await getTripSummaries(); setTripSummary(tsRes.data);
        const psRes = await getProposedStops(); setProposedStops(psRes.data);
      }
    } catch (err) {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateRoute = async (e) => { e.preventDefault(); try { await createRoute({ routeName: e.target.routeName.value }); setMsg("Route forged."); fetchData(); e.target.reset(); } catch (err) {} };
  const handleCreateBus = async (e) => { e.preventDefault(); try { await createBus(e.target.busNo.value, parseInt(e.target.capacity.value)); setMsg("Fleet expanded."); fetchData(); e.target.reset(); } catch (err) {} };
  
  const parseCoordinate = (str) => { if (!str) return 0; let val = parseFloat(str); const up = str.toUpperCase(); if (up.includes("S") || up.includes("W")) val = -Math.abs(val); return val; };
  const handleAddStop = async (e) => { e.preventDefault(); try { await addStop({ stopName: e.target.stopName.value, latitude: parseCoordinate(e.target.lat.value), longitude: parseCoordinate(e.target.lng.value), stopOrder: parseInt(e.target.order.value), routeId: parseInt(e.target.routeId.value) }); setMsg("Node appended."); fetchData(); e.target.reset(); } catch (err) {} };
  
  const handleAssignDriver = async (e) => { e.preventDefault(); try { await assignDriver({ driverId: parseInt(e.target.driverId.value), busId: parseInt(e.target.busId.value) }); setMsg("Personnel bound."); fetchData(); } catch (err) {} };
  const handleApproveDriver = async (e) => { e.preventDefault(); try { await approveDriver(e.target.userId.value); setMsg("Entity approved."); fetchData(); } catch (err) {} };
  
  const handleSaveAllUpdates = async (busId) => {
    const dVal = document.getElementById(`driver-select-${busId}`).value;
    const rVal = document.getElementById(`route-select-${busId}`).value;
    try { if (dVal) await assignDriver({ driverId: parseInt(dVal), busId: parseInt(busId) }); if (rVal) await assignBusToRoute(busId, rVal); setMsg("Vectors patched."); setEditingBusId(null); fetchData(); } catch (err) {}
  };
  
  const handleAssignBusRoute = async (e) => { e.preventDefault(); try { await assignBusToRoute(e.target.busId.value, e.target.routeId.value); setMsg("Pipeline locked."); fetchData(); } catch (err) {} };
  
  const handleDeleteBus = async (id) => { if (!window.confirm("Purge asset?")) return; try { await deleteBus(id); setMsg("Asset deleted."); fetchData(); } catch (err) {} };
  const handleDeleteRoute = async (id) => { if (!window.confirm("Wipe path schema?")) return; try { await deleteRoute(id); setMsg("Schema wiped."); fetchData(); } catch (err) {} };

  const handleApproveStop = async (stop) => {
    const orderInput = window.prompt(`Proposed Stop: ${stop.stopName}\nEnter Stop Sequence Order Number:`, stop.stopOrder);
    if (!orderInput) return;
    try { await approveProposedStop(stop.id, parseInt(orderInput)); setMsg("Route Node authorized."); fetchData(); } catch (err) {}
  };

  const handleRejectStop = async (stopId) => {
    if (!window.confirm("Reject and delete this proposed location?")) return;
    try { await deleteStop(stopId); setMsg("Proposed location rejected."); fetchData(); } catch (err) {}
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ marginBottom:40 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Transport Management</h1>
          <p style={{ margin:0, fontSize:15, color:"var(--text-secondary)", fontWeight:600 }}>Manage buses, connect drivers, define routes, and track locations.</p>
       </div>

       {msg && <div style={{ background:"var(--text-primary)", color:"white", padding:16, borderRadius:16, marginBottom:32, fontWeight:800, animation:"slideDown 0.3s ease" }}>{msg}</div>}

       <div className="responsive-grid-transport">
          
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
             
             <div style={{ background:"var(--surface-1)", padding:24, borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 16px" }}>Driver Approval</h3>
                <form onSubmit={handleApproveDriver} style={{ display:"flex", gap:12 }}>
                   <select name="userId" required className="form-input" style={{ flex:1 }}>
                      <option value="">Pending Drivers...</option>
                      {pendingDrivers.map(d => <option key={d.userId} value={d.userId}>{d.name} {d.approvalStatus==="APPROVED"?"(Missing profile)":""}</option>)}
                   </select>
                   <button type="submit" style={{ padding:"12px 20px", background:"var(--primary-color)", color:"white", borderRadius:12, border:"none", fontWeight:800, cursor:"pointer" }}>Approve</button>
                </form>
             </div>

             <div style={{ background:"var(--surface-1)", padding:24, borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 16px" }}>Vehicle Registration</h3>
                <form onSubmit={handleCreateBus} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                   <input name="busNo" placeholder="Number Plate" required className="form-input" />
                   <input name="capacity" type="number" placeholder="Capacity" required className="form-input" />
                   <button type="submit" style={{ padding:"14px", background:"var(--text-primary)", color:"white", borderRadius:12, border:"none", fontWeight:800, cursor:"pointer" }}>Add Bus</button>
                </form>
                <div style={{ height:1, background:"var(--border-light)", margin:"24px 0" }}></div>
                <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 16px" }}>Add Route</h3>
                <form onSubmit={handleCreateRoute} style={{ display:"flex", gap:12 }}>
                   <input name="routeName" placeholder="Route Name" required className="form-input" style={{ flex:1 }} />
                   <button type="submit" style={{ padding:"12px 20px", background:"var(--text-secondary)", color:"white", borderRadius:12, border:"none", fontWeight:800, cursor:"pointer" }}>Create</button>
                </form>
             </div>

              <div style={{ background:"var(--surface-1)", padding:24, borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                 <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 16px" }}>Available Routes</h3>
                 <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight: 150, overflowY: "auto", paddingRight: 8 }}>
                    {routes.length === 0 ? <span style={{color:"var(--text-tertiary)", fontSize:14}}>No routes exist.</span> : routes.map(r => (
                       <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--surface-2)", padding:"8px 12px", borderRadius:8 }}>
                          <span style={{ fontSize:14, fontWeight:600 }}>{r.routeName}</span>
                          <button onClick={()=>handleDeleteRoute(r.id)} style={{ background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", fontWeight:800, fontSize:12 }}>Delete</button>
                       </div>
                    ))}
                 </div>
              </div>

              <div style={{ background:"var(--surface-1)", padding:24, borderRadius:24, border:`1px solid ${proposedStops.length > 0 ? "#8b5cf6" : "var(--border-light)"}`, boxShadow: proposedStops.length > 0 ? "0 4px 16px rgba(139,92,246,0.15)" : "var(--shadow-sm)", transition:"border 0.3s" }}>
                 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <h3 style={{ fontSize:15, fontWeight:800, margin:0, color: proposedStops.length > 0 ? "#8b5cf6" : "var(--text-primary)" }}>
                       🚏 Stop Requests from Drivers
                    </h3>
                    {proposedStops.length > 0 && (
                       <span style={{ background:"#8b5cf6", color:"white", borderRadius:99, padding:"2px 10px", fontSize:12, fontWeight:800 }}>
                          {proposedStops.length} Pending
                       </span>
                    )}
                 </div>
                 <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16, margin:"0 0 16px" }}>
                    {proposedStops.length === 0
                      ? "No pending stop requests from drivers."
                      : "Drivers have proposed new stops on their route. Review and approve below."}
                 </p>
                 {proposedStops.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"20px 0", color:"var(--text-tertiary)", fontSize:13 }}>✅ All clear — no pending requests.</div>
                 ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:260, overflowY:"auto" }}>
                       {proposedStops.map(s => (
                          <div key={s.id} style={{ background:"var(--surface-2)", padding:14, borderRadius:12, border:"1px solid var(--border-light)" }}>
                             <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                                <div style={{ fontSize:14, fontWeight:800 }}>{s.stopName}</div>
                                <span style={{ fontSize:10, background:"rgba(139,92,246,0.1)", color:"#8b5cf6", padding:"2px 8px", borderRadius:6, fontWeight:700 }}>PENDING</span>
                             </div>
                             <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:10, lineHeight:1.6 }}>
                                <span style={{ fontWeight:700 }}>Route:</span> {s.route?.routeName || "Unknown"}<br/>
                                <span style={{ fontWeight:700 }}>Order:</span> #{s.stopOrder} &nbsp;
                                <span style={{ fontWeight:700 }}>Coords:</span> {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                             </div>
                             <div style={{ display:"flex", gap:8 }}>
                                <button onClick={()=>handleApproveStop(s)} style={{ flex:1, padding:"8px", background:"#10b981", color:"white", borderRadius:8, border:"none", fontWeight:800, fontSize:12, cursor:"pointer" }}>✓ Approve</button>
                                <button onClick={()=>handleRejectStop(s.id)} style={{ flex:1, padding:"8px", background:"transparent", color:"#ef4444", borderRadius:8, border:"1px solid #ef4444", fontWeight:800, fontSize:12, cursor:"pointer" }}>✕ Reject</button>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

             <div style={{ background:"var(--surface-1)", padding:24, borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 16px" }}>Add Stop To Route</h3>
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                   <input ref={searchInputRef} placeholder="Search Area (e.g. Times Sq)" className="form-input" style={{ flex:1 }} />
                   <button type="button" onClick={searchLocation} style={{ padding:"10px 16px", background:"var(--surface-2)", color:"var(--text-primary)", borderRadius:12, border:"1px solid var(--border-light)", fontWeight:800, cursor:"pointer" }}>Find</button>
                </div>
                <div id="admin-map" style={{ width:"100%", height: 200, borderRadius: 12, marginBottom:16, border:"1px solid var(--border-light)", zIndex:0 }}></div>

                <form onSubmit={handleAddStop} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                   <select name="routeId" required className="form-input"><option value="">Select Route</option>{routes.map(r=><option key={r.id} value={r.id}>{r.routeName}</option>)}</select>
                   <input name="stopName" placeholder="Stop Name" required className="form-input" />
                   <div style={{ display:"flex", gap:12 }}>
                      <input name="lat" ref={latInputRef} placeholder="Latitude (Click Map)" required readOnly className="form-input" style={{background:"var(--surface-2)", opacity:0.8}} />
                      <input name="lng" ref={lngInputRef} placeholder="Longitude (Click Map)" required readOnly className="form-input" style={{background:"var(--surface-2)", opacity:0.8}} />
                   </div>
                   <input name="order" type="number" placeholder="Stop Order" required className="form-input" />
                   <button type="submit" style={{ padding:"14px", background:"var(--primary-color)", color:"white", borderRadius:12, border:"none", fontWeight:800, cursor:"pointer" }}>Add Stop</button>
                </form>
             </div>

          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:32 }}>
             <div style={{ background:"var(--surface-1)", padding:32, borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                   <h3 style={{ fontSize:18, fontWeight:800, margin:0 }}>Live Trip Status</h3>
                   <div style={{ display:"flex", gap:12 }}>
                      <div style={{ background:"rgba(16,185,129,0.1)", color:"#10b981", padding:"8px 16px", borderRadius:99, fontSize:12, fontWeight:800 }}>LIVE {tripSummary.filter(t=>t.status==='IN_PROGRESS').length}</div>
                      <div style={{ background:"rgba(59,130,246,0.1)", color:"#3b82f6", padding:"8px 16px", borderRadius:99, fontSize:12, fontWeight:800 }}>COMPLETED {tripSummary.filter(t=>t.status==='COMPLETED').length}</div>
                   </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:16, marginBottom:32 }}>
                   {tripSummary.length===0 ? <div style={{ gridColumn:"1/-1", padding:40, textAlign:"center", color:"var(--text-tertiary)" }}>No live tracking data available.</div> : tripSummary.map(trip => (
                      <div key={trip.tripId} style={{ background:"var(--surface-2)", padding:16, borderRadius:16, borderTop:trip.status==="IN_PROGRESS"?"4px solid #10b981":"4px solid #3b82f6" }}>
                         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <span style={{ fontWeight:800, fontSize:14 }}>Bus {trip.busNumber}</span>
                            <span style={{ fontSize:10, fontWeight:800, background:"rgba(0,0,0,0.05)", padding:"4px 8px", borderRadius:8, color:trip.status==="IN_PROGRESS"?"#10b981":"inherit" }}>{trip.status}</span>
                         </div>
                         <div style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600 }}>
                            {trip.status === "COMPLETED" ? (
                               <><div>Time: {new Date(trip.endTime).toLocaleTimeString()}</div><div style={{ marginTop:4 }}>Last: {trip.lastStopName||"N/A"}</div></>
                            ) : (
                               <><div>Init: {new Date(trip.startTime).toLocaleTimeString()}</div><div style={{ marginTop:4, color:"#10b981" }}>Broadcasting...</div></>
                            )}
                         </div>
                      </div>
                   ))}
                </div>

                 <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 16px" }}>Driver and Vehicle Connection</h3>
                <div style={{ border:"1px solid var(--border-light)", borderRadius:16, overflow:"hidden" }}>
                   <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead style={{ background:"var(--surface-2)" }}><tr>
                         <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>BUS</th>
                         <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>DRIVER</th>
                         <th style={{ padding:"16px 24px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase" }}>ROUTE</th>
                      </tr></thead>
                      <tbody>
                         {buses.map(b => {
                            const curD = (driversList||[]).find(d=>d.assignedBus?.id===b.id);
                            const isEd = editingBusId === b.id;
                            return (
                               <tr key={b.id} style={{ borderBottom:"1px solid var(--border-subtle)" }}>
                                  <td style={{ padding:"16px 24px", fontWeight:800 }}>
                                     {b.busNumber}
                                     <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                        <button onClick={()=>handleDeleteBus(b.id)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#ef4444", fontSize:12, fontWeight:800 }}>Delete</button>
                                        {!isEd && <button onClick={()=>setEditingBusId(b.id)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#3b82f6", fontSize:12, fontWeight:800 }}>Connect</button>}
                                     </div>
                                  </td>
                                  <td style={{ padding:"16px 24px" }}>
                                     {isEd ? (
                                        <select defaultValue={curD?.id||""} id={`driver-select-${b.id}`} className="form-input" style={{ width:"100%", padding:"6px 12px" }}>
                                           <option value="">Unassigned</option>
                                           {approvedDrivers.map(d => { const dEnt = (driversList||[]).find(dl=>dl.user?.userId===d.userId); return <option key={d.userId} value={dEnt?.id||""}>{d.name}</option>; })}
                                        </select>
                                     ) : <span style={{ fontSize:14, fontWeight:600, color:curD?"var(--text-primary)":"var(--text-tertiary)" }}>{curD ? curD.user?.name : "Unassigned"}</span>}
                                  </td>
                                  <td style={{ padding:"16px 24px" }}>
                                     {isEd ? (
                                        <div style={{ display:"flex", gap:8 }}>
                                           <select defaultValue={b.route?.id||""} id={`route-select-${b.id}`} className="form-input" style={{ flex:1, padding:"6px 12px" }}><option value="">None</option>{routes.map(r=><option key={r.id} value={r.id}>{r.routeName}</option>)}</select>
                                           <button onClick={()=>handleSaveAllUpdates(b.id)} style={{ background:"var(--text-primary)", color:"white", border:"none", borderRadius:8, padding:"4px 12px", fontWeight:800, cursor:"pointer" }}>Save</button>
                                        </div>
                                     ) : <span style={{ fontSize:14, fontWeight:600, color:b.route?"var(--text-primary)":"var(--text-tertiary)" }}>{b.route ? b.route.routeName : "Not Assigned"}</span>}
                                  </td>
                               </tr>
                            )
                         })}
                      </tbody>
                   </table>
                </div>

             </div>
          </div>
       </div>
    </div>
  );
};

export default AdminTransportPage;
