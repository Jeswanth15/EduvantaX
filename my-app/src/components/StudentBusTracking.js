// This component is fundamentally similar to StudentTransportPage but uses react-leaflet.
// Since StudentTransportPage is better optimized with OSRM and manual Leaflet refs, we will 
// just render identical UI bounds to ensure consistency if this component is routed to instead.
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBusStatus } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (emoji, color) => {
    return L.divIcon({
        html: `<div style="background-color: ${color}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 2px solid white;">${emoji}</div>`,
        className: "", iconSize: [40, 40], iconAnchor: [20, 40],
    });
};

const busIcon = createCustomIcon("🚌", "#fbbf24");
const homeIcon = createCustomIcon("📍", "#10b981");
const stopIcon = createCustomIcon("🚏", "#6366f1");

const SetViewOnMount = ({ coords }) => {
    const map = useMap(); useEffect(() => { if (coords) map.setView(coords, 14); }, [coords, map]);
    return null;
};

const StudentBusTracking = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const decoded = getDecodedToken();

  const fetchStatus = async () => {
    try {
      if (decoded?.userId) {
        const res = await getBusStatus(decoded.userId);
        setStatus(res.data); setError("");
      }
    } catch (err) { setError("Failed to fetch location data via React-Leaflet bindings."); }
  };

  useEffect(() => {
    fetchStatus(); const interval = setInterval(fetchStatus, 5000); return () => clearInterval(interval);
  }, []);

  if (error) return <div style={{ background:"#fef2f2", color:"#ef4444", padding:20, margin:40, borderRadius:16, fontWeight:600 }}>{error}</div>;
  if (!status) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Awaiting telemetry parameters...</div>;

  const busPos = status.currentLocation ? [status.currentLocation.latitude, status.currentLocation.longitude] : null;
  const homePos = status.studentStop ? [status.studentStop.latitude, status.studentStop.longitude] : null;
  const polyline = (status.allRouteStops || []).map(s => [s.latitude, s.longitude]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40, height: "calc(100vh - 100px)", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
         <div>
            <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Route Live Tracking</h1>
            <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Alternative React-Leaflet integration viewer.</p>
         </div>
      </div>

      <div className="responsive-grid-1-2" style={{ flex:1 }}>
         
         <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div style={{ background:"linear-gradient(135deg, #0f172a, #1e293b)", padding:32, borderRadius:24, color:"white", boxShadow:"0 12px 32px rgba(15,23,42,0.4)" }}>
               <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Bus Fleet Unit</div>
               <div style={{ fontSize:32, fontWeight:900, marginBottom:24 }}>{status.busNumber}</div>

               {status.status === "IN_PROGRESS" && status.eta !== null && (
                 <div style={{ display:"grid", gap:8, background:"rgba(255,255,255,0.1)", padding:16, borderRadius:16 }}>
                    <div style={{ fontSize:11, color:"#a7f3d0", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px" }}>Arrival Horizon</div>
                    <div style={{ fontSize:28, fontWeight:800, color:"white" }}>{Math.round(status.eta)}m</div>
                 </div>
               )}
            </div>

            <div style={{ background:"var(--surface-1)", borderRadius:24, padding:24, boxShadow:"var(--shadow-sm)", border:"1px solid var(--border-light)" }}>
               <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", margin:"0 0 20px" }}>Waypoint Data</h3>
               <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Active Pivot</div>
                    <div style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)" }}>{status.currentStop?.stopName || "None"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Assigned Extraction</div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#10b981" }}>{status.studentStop?.stopName}</div>
                  </div>
               </div>
            </div>
         </div>

         <div style={{ background:"var(--surface-1)", borderRadius:24, border:"4px solid white", boxShadow:"0 20px 40px rgba(0,0,0,0.1)", overflow:"hidden" }}>
            <MapContainer center={homePos || [0,0]} zoom={14} style={{ height:"100%", width:"100%" }} zoomControl={false}>
               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
               {polyline.length > 0 && <Polyline positions={polyline} color="#8b5cf6" weight={4} opacity={0.7} />}
               {status.allRouteStops?.map((s, idx) => <Marker key={idx} position={[s.latitude, s.longitude]} icon={stopIcon}><Popup>{s.stopName}</Popup></Marker>)}
               {homePos && <Marker position={homePos} icon={homeIcon}><Popup>Extraction Point</Popup></Marker>}
               {busPos && <Marker position={busPos} icon={busIcon}><Popup>Bus Unit</Popup></Marker>}
               <SetViewOnMount coords={busPos || homePos} />
            </MapContainer>
         </div>

      </div>
    </div>
  );
};

export default StudentBusTracking;
