import React, { useState, useEffect } from "react";
import { 
  createBus, 
  createRoute, 
  addStop, 
  assignDriver, 
  assignBusToRoute,
  approveDriver,
  getDriversBySchool,
  getAllBuses,
  getAllRoutes,
  getAllDriversList,
  deleteBus,
  deleteRoute,
  getTripSummary
} from "../utils/api";
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

  const fetchData = async () => {
    try {
      const decoded = getDecodedToken();
      if (decoded?.schoolId) {
        const dRes = await getDriversBySchool(decoded.schoolId);
        const allDriverUsers = dRes.data;
        
        const bRes = await getAllBuses();
        const currentBuses = bRes.data;
        setBuses(currentBuses);

        const rRes = await getAllRoutes();
        const currentRoutes = rRes.data;
        setRoutes(currentRoutes);

        const dlRes = await getAllDriversList();
        const currentDriversList = Array.isArray(dlRes.data) ? dlRes.data : [];
        setDriversList(currentDriversList);

        // Filter approved drivers
        setApprovedDrivers(allDriverUsers.filter(d => d.approvalStatus === "APPROVED"));
        
        // Drivers need setup if:
        // 1. Their status is PENDING/REJECTED
        // 2. Their status is APPROVED but no Driver entity exists in currentDriversList
        setPendingDrivers(allDriverUsers.filter(d => 
            d.approvalStatus === "PENDING" || 
            d.approvalStatus === "REJECTED" ||
            (d.approvalStatus === "APPROVED" && !(currentDriversList || []).find(dl => dl.user?.userId === d.userId))
        ));

        const tsRes = await getTripSummary();
        setTripSummary(tsRes.data);
      }

    } catch (err) {
      console.error("Error fetching transport data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await createRoute({ routeName: e.target.routeName.value });
      setMsg("Route created successfully");
      fetchData();
      e.target.reset();
    } catch (err) { setMsg("Error: Route creation failed."); }
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      await createBus(e.target.busNo.value, parseInt(e.target.capacity.value));
      setMsg("Bus created successfully");
      fetchData();
      e.target.reset();
    } catch (err) { setMsg("Error: Bus creation failed."); }
  };

  const parseCoordinate = (str) => {
    if (!str) return 0;
    let val = parseFloat(str);
    const upper = str.toUpperCase();
    if (upper.includes("S") || upper.includes("W")) val = -Math.abs(val);
    return val;
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    try {
      await addStop({
        stopName: e.target.stopName.value,
        latitude: parseCoordinate(e.target.lat.value),
        longitude: parseCoordinate(e.target.lng.value),
        stopOrder: parseInt(e.target.order.value),
        routeId: parseInt(e.target.routeId.value)
      });
      setMsg("Stop added successfully");
      fetchData();
      e.target.reset();
    } catch (err) { setMsg("Error: Stop addition failed."); }
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    try {
      await assignDriver({
        driverId: parseInt(e.target.driverId.value),
        busId: parseInt(e.target.busId.value)
      });
      setMsg("Driver assigned successfully");
      fetchData();
    } catch (err) { setMsg("Error: Driver assignment failed."); }
  };

  const handleApproveDriver = async (e) => {
    e.preventDefault();
    try {
      await approveDriver(e.target.userId.value);
      setMsg("Driver approved successfully");
      fetchData();
    } catch (err) { setMsg("Error: Approval failed."); }
  };

  const handleInlineDriverUpdate = async (busId, driverId) => {
    if (!driverId) return;
    try {
      await assignDriver({ driverId: parseInt(driverId), busId: parseInt(busId) });
      setMsg("Driver updated for bus successfully");
      setEditingBusId(null);
      fetchData();
    } catch (err) {
      setMsg("Error: Failed to update driver.");
    }
  };

  const handleInlineRouteUpdate = async (busId, routeId) => {
    if (!routeId) return;
    try {
      await assignBusToRoute(busId, routeId);
      setMsg("Route updated for bus successfully");
      setEditingBusId(null);
      fetchData();
    } catch (err) {
      setMsg("Error: Failed to update route.");
    }
  };

  const handleSaveAllUpdates = async (busId) => {
    const dVal = document.getElementById(`driver-select-${busId}`).value;
    const rVal = document.getElementById(`route-select-${busId}`).value;
    
    try {
      if (dVal) await assignDriver({ driverId: parseInt(dVal), busId: parseInt(busId) });
      if (rVal) await assignBusToRoute(busId, rVal);
      setMsg("Assignments saved successfully");
      setEditingBusId(null);
      fetchData();
    } catch (err) {
      setMsg("Error: Update failed.");
    }
  };

  const handleAssignBusRoute = async (e) => {
    e.preventDefault();
    try {
      await assignBusToRoute(e.target.busId.value, e.target.routeId.value);
      setMsg("Bus assigned to route successfully");
      fetchData();
    } catch (err) { setMsg("Error: Bus-Route assignment failed."); }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm("Delete this bus?")) return;
    try {
      await deleteBus(id);
      setMsg("Bus deleted");
      fetchData();
    } catch (err) { setMsg("Error: Delete failed."); }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm("Delete this route? All stops will be removed.")) return;
    try {
      await deleteRoute(id);
      setMsg("Route deleted");
      fetchData();
    } catch (err) { setMsg("Error: Delete failed."); }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Transport Management Center</h1>
      {msg && <div style={styles.alert}>{msg}</div>}

      <div className="transport-grid-admin">
        
        {/* LEFT COLUMN: SETUP FORMS */}
        <div style={styles.column}>
          <div style={styles.card}>
            <h3>1. Driver Setup & Approval</h3>
            <p style={styles.hintText}>Approve new drivers or initialize profiles for existing ones.</p>
            <form onSubmit={handleApproveDriver} style={styles.form}>
              <select name="userId" required style={styles.input}>
                <option value="">Select User to Setup...</option>
                {pendingDrivers.map(d => (
                    <option key={d.userId} value={d.userId}>
                        {d.name} {d.approvalStatus === "APPROVED" ? "(Needs Profile Init)" : `(${d.approvalStatus})`}
                    </option>
                ))}
              </select>
              <button type="submit" style={styles.btn}>Setup / Approve Driver</button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>2. Create Bus & Route</h3>
            <form onSubmit={handleCreateBus} style={styles.form}>
              <input name="busNo" placeholder="Bus Registration No" required style={styles.input} />
              <input name="capacity" type="number" placeholder="Capacity" required style={styles.input} />
              <button type="submit" style={styles.btnSecondary}>Add Bus</button>
            </form>
            <hr style={{margin:'15px 0'}}/>
            <form onSubmit={handleCreateRoute} style={styles.form}>
              <input name="routeName" placeholder="New Route Name" required style={styles.input} />
              <button type="submit" style={styles.btnSecondary}>Add Route</button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>3. Add Stops to Route</h3>
            <form onSubmit={handleAddStop} style={styles.form}>
              <select name="routeId" required style={styles.input}>
                <option value="">Select Route...</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
              </select>
              <input name="stopName" placeholder="Stop Name (e.g. Market St)" required style={styles.input} />
              <div style={{display:'flex', gap:'5px'}}>
                <input name="lat" placeholder="Lat (13.0 N)" required style={styles.input} />
                <input name="lng" placeholder="Lng (80.2 E)" required style={styles.input} />
              </div>
              <input name="order" type="number" placeholder="Stop Order (1, 2...)" required style={styles.input} />
              <button type="submit" style={styles.btnSecondary}>Add Stop</button>
            </form>
          </div>

          <div style={styles.card}>
            <h3>4. Link Everything</h3>
            <p style={styles.label}>Map Driver to Bus</p>
            <form onSubmit={handleAssignDriver} style={styles.form}>
              <select name="driverId" required style={styles.input}>
                <option value="">Select Profiled Driver...</option>
                {approvedDrivers.map(d => {
                    const driverEntity = (driversList || []).find(dl => dl.user?.userId === d.userId);
                    return driverEntity ? <option key={d.userId} value={driverEntity.id}>{d.name}</option> : null;
                })}
              </select>
              <select name="busId" required style={styles.input}>
                <option value="">Select Bus...</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
              </select>
              <button type="submit" style={styles.btnPrimary}>Assign Driver</button>
            </form>
            <hr style={{margin:'20px 0'}}/>
            <p style={styles.label}>Map Bus to Route</p>
            <form onSubmit={handleAssignBusRoute} style={styles.form}>
              <select name="busId" required style={styles.input}>
                <option value="">Select Bus...</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
              </select>
              <select name="routeId" required style={styles.input}>
                <option value="">Select Route...</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
              </select>
              <button type="submit" style={styles.btnPrimary}>Assign Route</button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Fleet Overview & Summary VIEW */}
        <div style={styles.column}>
           <div style={styles.card}>
              <h3 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                Fleet Overview
                <div style={{display:'flex', gap:'10px'}}>
                  <span style={styles.statLabel}>Active: <b style={{color:'#10b981'}}>{tripSummary.filter(t => t.status === 'IN_PROGRESS').length}</b></span>
                  <span style={styles.statLabel}>Finished: <b style={{color:'#6366f1'}}>{tripSummary.filter(t => t.status === 'COMPLETED').length}</b></span>
                </div>
              </h3>
              
              <div className="transport-fleet-grid">
                {tripSummary.map(trip => (
                  <div key={trip.tripId} style={{...styles.fleetCard, borderLeftColor: trip.status === 'IN_PROGRESS' ? '#10b981' : '#6366f1'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                      <span style={{fontWeight:'700', fontSize:'14px'}}>Bus {trip.busNumber}</span>
                      <span style={{
                        fontSize:'10px', 
                        padding:'2px 6px', 
                        borderRadius:'10px', 
                        background: trip.status === 'IN_PROGRESS' ? '#ecfdf5' : '#f1f5f9',
                        color: trip.status === 'IN_PROGRESS' ? '#065f46' : '#64748b',
                        fontWeight:'700'
                      }}>{trip.status}</span>
                    </div>
                    {trip.status === 'COMPLETED' ? (
                      <div style={{fontSize:'12px', color:'#64748b'}}>
                        <div>🏁 Finished: {new Date(trip.endTime).toLocaleTimeString()}</div>
                        <div style={{marginTop:'4px'}}>📍 Last: {trip.lastStopName || "Unknown"}</div>
                      </div>
                    ) : (
                      <div style={{fontSize:'12px', color:'#64748b'}}>
                        <div>⚡ Started: {new Date(trip.startTime).toLocaleTimeString()}</div>
                        <div style={{marginTop:'4px', color:'#10b981', fontWeight:'600'}}>● Live Tracking...</div>
                      </div>
                    )}
                  </div>
                ))}
                {tripSummary.length === 0 && <p style={{color:'#94a3b8', fontSize:'13px', gridColumn:'1/-1', textAlign:'center'}}>No trip data available for today.</p>}
              </div>

              <hr style={{margin:'20px 0', opacity:0.1}}/>

              <h3>Active Transport Config</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{borderBottom:'2px solid #e2e8f0'}}>
                      <th style={{textAlign:'left', paddingBottom:'10px'}}>Bus</th>
                      <th style={{textAlign:'left', paddingBottom:'10px'}}>Driver</th>
                      <th style={{textAlign:'left', paddingBottom:'10px'}}>Route</th>
                    </tr>
                  </thead>
                   <tbody>
                    {buses.map(b => {
                      const currentDriver = (driversList || []).find(d => d.assignedBus?.id === b.id);
                      const isEditing = editingBusId === b.id;

                      return (
                        <tr key={`${b.id}-${b.route?.id}-${currentDriver?.id}`} style={{borderBottom:'1px solid #f1f5f9'}}>
                            <td style={{padding:'12px 0', fontWeight:'600'}}>
                                <div>{b.busNumber}</div>
                                <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                    <button onClick={() => handleDeleteBus(b.id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'12px'}} title="Delete Bus">🗑️</button>
                                    {!isEditing && <button onClick={() => setEditingBusId(b.id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'12px'}} title="Edit Assignments">✏️</button>}
                                </div>
                            </td>
                            <td style={{padding:'12px 0'}}>
                                {isEditing ? (
                                    <select 
                                        defaultValue={currentDriver?.id || ""}
                                        style={{...styles.input, padding:'4px 8px', fontSize:'12px', width:'100%'}}
                                        id={`driver-select-${b.id}`}
                                    >
                                        <option value="">Not Assigned</option>
                                        {approvedDrivers.map(d => {
                                            const driverEntity = (driversList || []).find(dl => dl.user?.userId === d.userId);
                                            return <option key={d.userId} value={driverEntity?.id || ""}>{d.name}</option>
                                        })}
                                    </select>
                                ) : (
                                    <span style={{fontSize:'14px', color: currentDriver ? '#1e293b' : '#94a3b8'}}>
                                        {currentDriver ? `👤 ${currentDriver.user?.name}` : "Not Assigned"}
                                    </span>
                                )}
                            </td>
                            <td style={{padding:'12px 0'}}>
                                {isEditing ? (
                                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                        <select 
                                            defaultValue={b.route?.id || ""} 
                                            style={{...styles.input, padding:'4px 8px', fontSize:'12px', flex:1}}
                                            id={`route-select-${b.id}`}
                                        >
                                            <option value="">No Route</option>
                                            {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                                        </select>
                                        <button onClick={() => handleSaveAllUpdates(b.id)} style={{...styles.btnTable, background:'#10b981'}}>✅ Save</button>
                                        <button onClick={() => setEditingBusId(null)} style={{...styles.btnTable, background:'#ef4444'}}>❌</button>
                                    </div>
                                ) : (
                                    <span style={{fontSize:'14px', color: b.route ? '#1e293b' : '#94a3b8'}}>
                                        {b.route ? `📍 ${b.route.routeName}` : "No Route"}
                                    </span>
                                )}
                            </td>
                        </tr>
                      );
                    })}
                    {buses.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'20px'}}>No buses added yet.</td></tr>}
                  </tbody>
                </table>
              </div>
           </div>

           <div style={styles.card}>
              <h3>Routes & Network</h3>
              {routes.map(r => (
                <div key={r.id} style={styles.routeBox}>
                  <strong>📍 {r.routeName}</strong>
                  <button onClick={() => handleDeleteRoute(r.id)} style={{marginLeft:'8px', background:'none', border:'none', cursor:'pointer'}}>🗑️</button>
                  <div style={styles.stopList}>
                    {buses.filter(b => b.route?.id === r.id).length > 0 ? (
                      <small style={{color:'#6366f1', fontWeight:'600'}}>Served by: {buses.filter(b => b.route?.id === r.id).map(b => b.busNumber).join(', ')}</small>
                    ) : (
                      <small style={{color:'#94a3b8'}}>No active bus assigned</small>
                    )}
                  </div>
                </div>
              ))}
              {routes.length === 0 && <p style={{color:'#94a3b8'}}>No routes defined yet.</p>}
           </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { padding: "40px", maxWidth: "1300px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "100vh" },
  header: { marginBottom: "30px", color: "#0f172a", fontWeight: "800", fontSize: "32px", letterSpacing: "-0.025em" },
  alert: { padding: "16px", background: "#ecfdf5", color: "#065f46", borderRadius: "12px", marginBottom: "24px", border: "1px solid #a7f3d0", fontWeight: "500" },
  column: { display: "flex", flexDirection: "column", gap: "30px" },
  card: { background: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", backgroundColor: "#fdfdfd", transition: "all 0.2s" },
  label: { fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" },
  btn: { padding: "12px", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.4)" },
  btnPrimary: { padding: "12px", background: "#0f172a", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600" },
  btnSecondary: { padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600" },
  hintText: { fontSize: "13px", color: "#64748b", marginBottom: "15px" },
  hint: { fontSize: "12px", color: "#94a3b8", marginTop: "12px", textAlign: "center" },
  tableWrapper: { marginTop: "20px" },
  table: { width: "100%", borderCollapse: "collapse", color: "#334155" },
  btnTable: { padding: "6px 10px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "600" },
  routeBox: { padding: "16px", background: "#ffffff", borderRadius: "16px", marginBottom: "12px", border: "1px solid #f1f5f9", transition: "transform 0.2s" },
  stopList: { marginTop: "8px" },
  statLabel: { fontSize: "12px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "8px", fontWeight: "600" },
  fleetCard: { padding: "12px", background: "#f8fafc", borderRadius: "12px", borderLeft: "4px solid #e2e8f0" }
};

export default AdminTransportPage;
