import React, { useState, useEffect, useRef, useCallback } from "react";
import { getBusStatus } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const StudentTransportPage = () => {
  const SockJS = window.SockJS;
  const Stomp = window.Stomp;
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;

  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busLocation, setBusLocation] = useState(null);
  const mapRef = useRef(null);
  const busMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const stompClientRef = useRef(null);

  const connectWebSocket = (busId) => {
    const socket = new SockJS("http://localhost:8080/ws-transport");
    const client = Stomp.over(socket);
    client.debug = null;
    client.connect({}, () => {
      client.subscribe(`/topic/bus-location/${busId}`, (msg) => {
        const newLoc = JSON.parse(msg.body);
        setBusLocation({ lat: newLoc.latitude, lng: newLoc.longitude });
      });
    });
    stompClientRef.current = client;
  };

  const fetchStatus = async () => {
    try {
      const res = await getBusStatus(studentId);
      setStatus(res.data);
      if (res.data.currentLatitude) setBusLocation({ lat: res.data.currentLatitude, lng: res.data.currentLongitude });
      setError("");
      if (res.data.busId && !stompClientRef.current) connectWebSocket(res.data.busId);
    } catch (err) { setError("Error fetching bus system"); }
  };

  const fetchOSRMRoute = async (stops) => {
    if (!stops || stops.length < 2) return;
    try {
      const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const roadCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        if (polylineRef.current) polylineRef.current.setLatLngs(roadCoords);
        else if (mapRef.current) polylineRef.current = window.L.polyline(roadCoords, { color: '#8b5cf6', weight: 4, opacity: 0.7 }).addTo(mapRef.current);
      }
    } catch (error) { console.error(error); }
  };

  const initMap = useCallback(() => {
    if (mapRef.current || !window.L || !status || !status.currentLatitude) return;
    mapRef.current = window.L.map('student-map', { zoomControl: false }).setView([status.currentLatitude, status.currentLongitude], 14);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    
    if (status.stops) {
      status.stops.forEach((stop, idx) => {
        window.L.circleMarker([stop.latitude, stop.longitude], { radius:6, fillColor:"#8b5cf6", color:"#fff", weight:2, fillOpacity:1 }).bindPopup(`Stop ${idx + 1}: ${stop.stopName}`).addTo(mapRef.current);
      });
      fetchOSRMRoute(status.stops);
    }

    const busIcon = window.L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', iconSize: [40, 40], iconAnchor: [20, 20] });
    busMarkerRef.current = window.L.marker([status.currentLatitude, status.currentLongitude], { icon: busIcon, zIndexOffset: 1000 }).bindPopup("Your Bus").addTo(mapRef.current);
  }, [status]);

  useEffect(() => {
    fetchStatus();
    return () => { if (stompClientRef.current) stompClientRef.current.disconnect(); };
  }, [studentId]);

  useEffect(() => {
    if (!window.L) {
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true; document.head.appendChild(script);
      const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      script.onload = initMap;
    } else initMap();
  }, [initMap, status]);

  useEffect(() => {
    if (busMarkerRef.current && busLocation) busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng]);
  }, [busLocation]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40, height: "calc(100vh - 100px)", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Transport Mapping</h1>
          <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Live geographical positioning protocol.</p>
        </div>
        {status?.tripStatus === "IN_PROGRESS" && (
           <div style={{ padding:"8px 16px", borderRadius:99, background:"#ef4444", color:"white", fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px", boxShadow:"0 0 16px rgba(239, 68, 68, 0.4)", animation:"pulseGlow 2s infinite" }}>● LIVE TRACKING</div>
        )}
      </div>

      {error ? <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#ef4444", padding:20, borderRadius:16, fontWeight:600 }}>{error}</div> : status ? (
        <div className="responsive-grid-2-1" style={{ flex:1 }}>
           
           {/* Map Canvas */}
           <div style={{ background:"var(--surface-1)", borderRadius:24, border:"4px solid white", boxShadow:"0 20px 40px rgba(0,0,0,0.1)", overflow:"hidden", position:"relative" }}>
              <div id="student-map" style={{ width:"100%", height:"100%" }} />
              {/* Overlay */}
              <div style={{ position:"absolute", top:20, left:20, zIndex:1000, background:"rgba(255,255,255,0.9)", backdropFilter:"blur(8px)", padding:"12px 20px", borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", border:"1px solid rgba(0,0,0,0.05)" }}>
                 <div style={{ fontSize:10, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Network Status</div>
                 <div style={{ fontSize:14, fontWeight:800, color:"var(--primary-color)" }}>Connected via WebSocket</div>
              </div>
           </div>

           {/* Dashboard Stats */}
           <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, boxShadow:"var(--shadow-lg)", border:"1px solid var(--border-light)" }}>
                 <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)", margin:"0 0 24px" }}>Telemetry Data</h3>

                 <div style={{ background:"var(--surface-2)", padding:16, borderRadius:16, marginBottom:20 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Trip State</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)" }}>{status.tripStatus.replace("_", " ")}</div>
                 </div>

                 <div className="grid-2-col-responsive" style={{ gap:16, marginBottom:24 }}>
                    <div style={{ background:"var(--surface-2)", padding:16, borderRadius:16, border:"1px solid var(--border-light)" }}>
                       <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Est. Time</div>
                       <div style={{ fontSize:24, fontWeight:900, color:"var(--primary-color)" }}>{status.estimatedMinutes ? `${Math.round(status.estimatedMinutes)}m` : "--"}</div>
                    </div>
                    <div style={{ background:"var(--surface-2)", padding:16, borderRadius:16, border:"1px solid var(--border-light)" }}>
                       <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Next Node</div>
                       <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>{status.nextStopName || "N/A"}</div>
                    </div>
                 </div>

                 <div style={{ background:"linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.1))", border:"1px solid rgba(139,92,246,0.1)", borderRadius:16, padding:20 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)", lineHeight:1.5 }}>
                       Map telemetry refreshes automatically without polling. Be present at your coordinates 5 minutes early.
                    </div>
                 </div>
              </div>
           </div>

        </div>
      ) : <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Establishing secure connection to transport server...</div>}
    </div>
  );
};

export default StudentTransportPage;
