import React, { useState, useEffect } from "react";
import { getAllStudents, getAllBuses, getAllRoutes, updateStudentType, assignStudentStop } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const AdminStudentTransport = () => {
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [msg, setMsg] = useState("");
  const [filters, setFilters] = useState({ name: "", type: "ALL" });

  const fetchData = async () => {
    try {
      const decoded = getDecodedToken();
      if (decoded?.schoolId) {
        const [sRes, bRes, rRes] = await Promise.all([
          getAllStudents(decoded.schoolId),
          getAllBuses(),
          getAllRoutes()
        ]);
        setStudents(sRes.data);
        setBuses(bRes.data);
        setRoutes(rRes.data);
      }
    } catch (err) {
      setMsg("Error loading data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTypeChange = async (studentId, newType) => {
    try {
      await updateStudentType(studentId, newType);
      setMsg("Student type updated");
      fetchData();
    } catch (err) {
      setMsg("Update failed");
    }
  };

  const handleStopAssignment = async (studentId, stopId) => {
    if (!stopId) return;
    try {
      await assignStudentStop(studentId, stopId);
      setMsg("Pickup point assigned successfully");
      fetchData();
    } catch (err) {
      setMsg("Assignment failed");
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesName = s.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesType = filters.type === "ALL" || s.studentType === filters.type;
    return matchesName && matchesType;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Student Transport Management</h2>
        <p style={styles.subtitle}>Assign students to pickup points and manage transport types.</p>
      </div>

      {msg && <div style={{...styles.alert, background: msg.includes('Error') || msg.includes('failed') ? '#fee2e2' : '#ecfdf5', color: msg.includes('Error') || msg.includes('failed') ? '#991b1b' : '#065f46'}}>{msg}</div>}

      <div style={styles.searchBar}>
        <input 
          placeholder="Search student by name..." 
          style={styles.searchInput}
          value={filters.name}
          onChange={(e) => setFilters({...filters, name: e.target.value})}
        />
        <select 
          style={styles.selectFilter}
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="ALL">All Types</option>
          <option value="DAY_SCHOLAR">Day Scholar</option>
          <option value="HOSTELLER">Hosteller</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Bus & Pickup Point</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => (
              <tr key={s.userId} style={styles.tr}>
                <td style={styles.td}>
                   <div style={{fontWeight:'600'}}>{s.name}</div>
                   <div style={{fontSize:'12px', color:'#64748b'}}>{s.email}</div>
                </td>
                <td style={styles.td}>
                  <select 
                    value={s.studentType || "DAY_SCHOLAR"} 
                    onChange={(e) => handleTypeChange(s.userId, e.target.value)}
                    style={styles.selectCompact}
                  >
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                    <option value="HOSTELLER">Hosteller</option>
                  </select>
                </td>
                <td style={styles.td}>
                  {(!s.studentType || s.studentType === "DAY_SCHOLAR") ? (
                    <StudentAssignmentActions 
                      student={s} 
                      buses={buses} 
                      routes={routes} 
                      onAssign={(stopId) => handleStopAssignment(s.userId, stopId)}
                    />
                  ) : (
                    <span style={{color:'#94a3b8', fontSize:'13px'}}>No transport for Hostellers</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>No students found matching filters.</div>}
      </div>
    </div>
  );
};

// Helper component for complex assignment logic
const StudentAssignmentActions = ({ student, buses, routes, onAssign }) => {
  const [selectedBusId, setSelectedBusId] = useState("");
  
  // Find current assignment info if exists
  const currentStopId = student.assignedStopId;
  let currentBusId = "";
  let currentRouteStops = [];

  // Derive current bus from stop
  if (currentStopId) {
    const route = routes.find(r => (r.stops || []).some(st => st.id === currentStopId));
    if (route) {
        const bus = buses.find(b => b.route?.id === route.id);
        if (bus) currentBusId = bus.id;
    }
  }

  // Effect to set initial bus view
  useEffect(() => {
    if (currentBusId) setSelectedBusId(currentBusId);
  }, [currentBusId]);

  const activeBus = buses.find(b => b.id === parseInt(selectedBusId));
  const activeRouteStops = activeBus?.route?.stops || [];

  return (
    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
      <select 
        value={selectedBusId} 
        onChange={(e) => setSelectedBusId(e.target.value)}
        style={styles.selectCompact}
      >
        <option value="">Select Bus...</option>
        {buses.map(b => <option key={b.id} value={b.id}>Bus {b.busNumber} ({b.route?.routeName || 'No Route'})</option>)}
      </select>

      <select 
        defaultValue={currentStopId || ""}
        onChange={(e) => onAssign(e.target.value)}
        style={styles.selectCompact}
        disabled={!selectedBusId}
      >
        <option value="">Select Stop...</option>
        {activeRouteStops.map(st => <option key={st.id} value={st.id}>{st.stopName}</option>)}
      </select>
      
      {currentStopId && <span style={{fontSize:'12px', color:'#10b981'}}>✅</span>}
    </div>
  );
};

const styles = {
  container: { padding: "40px", maxWidth: "1200px", margin: "0 auto", minHeight: "100vh", backgroundColor: "#f8fafc" },
  header: { marginBottom: "30px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" },
  subtitle: { color: "#64748b", fontSize: "16px" },
  card: { backgroundColor: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", padding: "20px", overflow: "hidden" },
  searchBar: { display: "flex", gap: "15px", marginBottom: "20px" },
  searchInput: { flex: 1, padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px" },
  selectFilter: { padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "white", outline: "none", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 15px", borderBottom: "2px solid #f1f5f9", color: "#64748b", fontWeight: "600", fontSize: "13px" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "15px", verticalAlign: "middle" },
  selectCompact: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: "#fff", fontSize: "13px", outline: "none" },
  alert: { padding: "12px 20px", borderRadius: "10px", marginBottom: "20px", fontWeight: "500", fontSize: "14px" }
};

export default AdminStudentTransport;
