import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBusStatus } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (emoji, color) => {
    return L.divIcon({
        html: `<div style="background-color: ${color}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 2px solid white;">${emoji}</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
};

const busIcon = createCustomIcon("🚌", "#fbbf24");
const homeIcon = createCustomIcon("🏠", "#10b981");
const stopIcon = createCustomIcon("🚏", "#6366f1");

// Helper to auto-recenter map
const SetViewOnMount = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, 14);
    }, [coords, map]);
    return null;
};

const StudentBusStatusDTO_TripStatus = {
    NOT_STARTED: "NOT_STARTED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED"
};

const StudentBusTracking = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const decoded = getDecodedToken();

  const fetchStatus = async () => {
    try {
      if (decoded?.userId) {
        const res = await getBusStatus(decoded.userId);
        setStatus(res.data);
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch bus status. Make sure you are a Day Scholar assigned to a stop.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={styles.loading}>Initializing Live Tracking...</div>;
  if (error) return <div style={styles.errorCard}>{error}</div>;
  if (!status) return <div style={styles.errorCard}>No tracking data available.</div>;

  const busPos = status.currentLocation ? [status.currentLocation.latitude, status.currentLocation.longitude] : null;
  const homePos = status.studentStop ? [status.studentStop.latitude, status.studentStop.longitude] : null;
  const polyline = (status.allRouteStops || []).map(s => [s.latitude, s.longitude]);

  return (
    <div style={styles.container}>
      <div className="transport-grid-student">
        <div style={styles.statusCard}>
           <div style={styles.statusBadge}>
              {status.status === "IN_PROGRESS" ? "🟢 Live Tracking" : "⚪ " + status.status.replace('_', ' ')}
           </div>
           <h2 style={styles.busNo}>Bus {status.busNumber}</h2>
           <p style={styles.routeName}>{status.studentStop?.stopName} Route</p>
           
           {status.status === "IN_PROGRESS" && status.eta !== null && (
             <div style={styles.etaBox}>
                <span style={styles.etaLabel}>Arriving in</span>
                <span style={styles.etaValue}>{Math.round(status.eta)} mins</span>
             </div>
           )}
           {status.status === "NOT_STARTED" && <p style={styles.hint}>Bus hasn't started its journey yet.</p>}
        </div>

        <div style={styles.stopsPanel}>
           <div style={styles.stopItem}>
              <small>CURRENT STOP</small>
              <p>{status.currentStop?.stopName || "None"}</p>
           </div>
           <div style={styles.stopItem}>
              <small>NEXT STOP</small>
              <p>{status.nextStop?.stopName || "End of Route"}</p>
           </div>
           <div style={{...styles.stopItem, border:'none'}}>
              <small>YOUR STOP</small>
              <p style={{color:'#10b981', fontWeight:'700'}}>📍 {status.studentStop?.stopName}</p>
           </div>
        </div>
      </div>

      <div style={styles.mapCard}>
         <MapContainer center={homePos || [0,0]} zoom={14} style={{ height: "100%", width: "100%", borderRadius:'20px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {polyline.length > 0 && <Polyline positions={polyline} color="#6366f1" weight={4} opacity={0.6} />}
            
            {status.allRouteStops?.map((s, idx) => (
                <Marker key={idx} position={[s.latitude, s.longitude]} icon={stopIcon}>
                    <Popup>{s.stopName}</Popup>
                </Marker>
            ))}

            {homePos && (
                <Marker position={homePos} icon={homeIcon}>
                    <Popup>Your Pickup Point: {status.studentStop.stopName}</Popup>
                </Marker>
            )}

            {busPos && (
                <Marker position={busPos} icon={busIcon}>
                    <Popup>Bus {status.busNumber}</Popup>
                </Marker>
            )}
            
            <SetViewOnMount coords={busPos || homePos} />
         </MapContainer>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "40px", maxWidth: "1200px", margin: "0 auto", height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", gap: "20px" },
  statusCard: { background: "white", padding: "30px", borderRadius: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", position: "relative", overflow: "hidden" },
  statusBadge: { position: "absolute", top: "20px", right: "20px", padding: "6px 14px", borderRadius: "100px", background: "#f1f5f9", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
  busNo: { fontSize: "32px", fontWeight: "800", margin: "0 0 5px 0" },
  routeName: { color: "#64748b", fontSize: "16px", margin: 0 },
  etaBox: { marginTop: "20px", padding: "15px", background: "#f0fdf4", borderRadius: "16px", display: "inline-flex", flexDirection: "column" },
  etaLabel: { fontSize: "12px", color: "#166534", fontWeight: "600", textTransform: "uppercase" },
  etaValue: { fontSize: "24px", color: "#166534", fontWeight: "800" },
  stopsPanel: { background: "#1e293b", padding: "30px", borderRadius: "24px", color: "white", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  stopItem: { borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px", marginBottom: "15px" },
  mapCard: { flex: 1, borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "4px solid white" },
  loading: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#64748b" },
  errorCard: { background: "#fee2e2", padding: "20px", borderRadius: "16px", color: "#991b1b", margin: "40px", textAlign: "center" },
  hint: { marginTop:'20px', color:'#94a3b8', fontStyle:'italic' }
};

export default StudentBusTracking;
