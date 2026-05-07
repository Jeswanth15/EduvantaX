import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBusStatus } from "../utils/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png", iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png", shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png" });

const createCustomIcon = (emoji, color) => L.divIcon({ html: `<div style="background-color: ${color}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 2px solid white;">${emoji}</div>`, className: "", iconSize: [36, 36], iconAnchor: [18, 36] });
const busIcon = createCustomIcon("🚌", "#f59e0b");
const homeIcon = createCustomIcon("🏠", "#10b981");
const stopIcon = createCustomIcon("🚏", "#3b82f6");

const SetViewOnMount = ({ coords }) => { const map = useMap(); useEffect(() => { if (coords) map.setView(coords, 14); }, [coords, map]); return null; };

const LiveBusMap = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try { if (userId) { const res = await getBusStatus(userId); setStatus(res.data); setError(""); } } 
    catch (err) { setError("No active route tracking currently."); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); const int = setInterval(fetchStatus, 10000); return () => clearInterval(int); }, [userId]);

  if (loading) return <div style={{ height:400, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)" }}>Loading Array...</div>;
  if (error || !status) return <div style={{ height:400, border:"2px dashed var(--border-medium)", borderRadius:24, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", fontWeight:800 }}>Tracking frame offline.</div>;

  const busPos = status.currentLocation ? [status.currentLocation.latitude, status.currentLocation.longitude] : null;
  const homePos = status.studentStop ? [status.studentStop.latitude, status.studentStop.longitude] : null;
  const polyline = (status.allRouteStops || []).map(s => [s.latitude, s.longitude]);

  let stopsInBetween = 0;
  if (status.allRouteStops && status.currentStop && status.studentStop) {
      const stops = status.allRouteStops;
      const currentIdx = stops.findIndex(s => s.stopName === status.currentStop.stopName);
      const studentIdx = stops.findIndex(s => s.stopName === status.studentStop.stopName);
      if (currentIdx !== -1 && studentIdx !== -1 && studentIdx > currentIdx) stopsInBetween = studentIdx - currentIdx - 1;
  }

  return (
    <div style={{ position:"relative", height:500, borderRadius:24, overflow:"hidden", border:"1px solid var(--border-light)", boxShadow:"var(--shadow-md)" }}>
       
       {/* UI Telemetry Overlay */}
       <div style={{ position:"absolute", top:20, left:20, right:20, zIndex:1000, display:"flex", justifyContent:"space-between", gap:16, pointerEvents:"none" }}>
          <div style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(10px)", padding:"12px 20px", borderRadius:16, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", display:"flex", alignItems:"center", gap:12, pointerEvents:"auto", border:"1px solid rgba(255,255,255,0.5)" }}>
             <span style={{ fontSize:20 }}>🚌</span>
             <div>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px" }}>Fleet Identifier</div>
                <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>Bus {status.busNumber}</div>
             </div>
          </div>

          <div style={{ display:"flex", gap:12, pointerEvents:"auto" }}>
             <div style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(10px)", padding:"12px 20px", borderRadius:16, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", border:"1px solid rgba(255,255,255,0.5)" }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px" }}>Queue Node Drop</div>
                <div style={{ fontSize:15, fontWeight:800, color:"var(--primary-color)" }}><b>{stopsInBetween}</b> stops remaining</div>
             </div>
             
             {status.eta !== null && (
               <div style={{ background:"linear-gradient(135deg, #10b981, #059669)", padding:"12px 24px", borderRadius:16, boxShadow:"0 4px 12px rgba(16,185,129,0.3)", color:"white", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px", opacity:0.9 }}>Estimated</div>
                  <div style={{ fontSize:18, fontWeight:900, marginTop:2 }}>{Math.round(status.eta)} mins</div>
               </div>
             )}
          </div>
       </div>

       <MapContainer center={homePos || [0,0]} zoom={14} style={{ height:"100%", width:"100%", zIndex:0 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {polyline.length > 0 && <Polyline positions={polyline} color="#3b82f6" weight={5} opacity={0.7} dashArray="8, 12" />}
          {status.allRouteStops?.map((s, idx) => <Marker key={idx} position={[s.latitude, s.longitude]} icon={stopIcon}><Popup>{s.stopName}</Popup></Marker>)}
          {homePos && <Marker position={homePos} icon={homeIcon}><Popup>Your Pickup Point: {status.studentStop.stopName}</Popup></Marker>}
          {busPos && <Marker position={busPos} icon={busIcon}><Popup>Bus {status.busNumber}</Popup></Marker>}
          <SetViewOnMount coords={busPos || homePos} />
       </MapContainer>
    </div>
  );
};

export default LiveBusMap;
