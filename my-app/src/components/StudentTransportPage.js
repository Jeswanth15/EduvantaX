import React, { useState, useEffect, useRef, useCallback } from "react";
import { getBusStatus } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const StudentTransportPage = () => {
  const SockJS = window.SockJS;
  const Stomp = window.Stomp;
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busLocation, setBusLocation] = useState(null);
  const mapRef = useRef(null);
  const busMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const stompClientRef = useRef(null);
  
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;

  const fetchStatus = async () => {
    try {
      const res = await getBusStatus(studentId);
      setStatus(res.data);
      if (res.data.currentLatitude) {
        setBusLocation({ lat: res.data.currentLatitude, lng: res.data.currentLongitude });
      }
      setError("");
      
      // Connect to WebSocket if busId is available
      if (res.data.busId && !stompClientRef.current) {
        connectWebSocket(res.data.busId);
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching bus status: " + (err.response?.data?.message || err.message));
    }
  };

  const connectWebSocket = (busId) => {
    const socket = new SockJS("http://localhost:8080/ws-transport");
    const client = Stomp.over(socket);
    client.debug = null; // Disable logging
    client.connect({}, () => {
      client.subscribe(`/topic/bus-location/${busId}`, (message) => {
        const newLoc = JSON.parse(message.body);
        setBusLocation({ lat: newLoc.latitude, lng: newLoc.longitude });
      });
    });
    stompClientRef.current = client;
  };


  const fetchOSRMRoute = async (stops) => {
    if (!stops || stops.length < 2) return;
    try {
      const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const roadCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(roadCoords);
        } else if (mapRef.current) {
          polylineRef.current = window.L.polyline(roadCoords, { color: '#6366f1', weight: 5, opacity: 0.8 }).addTo(mapRef.current);
        }
      }
    } catch (error) {
      console.error("OSRM Routing failed", error);
    }
  };

  // Leaflet Map Initialization

  const initMap = useCallback(() => {
    if (mapRef.current || !window.L || !status || !status.currentLatitude) return;
    
    mapRef.current = window.L.map('student-map').setView([status.currentLatitude, status.currentLongitude], 14);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    
    // Add Stops Markers
    if (status.stops) {
      status.stops.forEach((stop, idx) => {
        window.L.circleMarker([stop.latitude, stop.longitude], {
            radius: 6,
            fillColor: "#6366f1",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`<b>Stop ${idx + 1}:</b> ${stop.stopName}`)
          .addTo(mapRef.current);
      });
      fetchOSRMRoute(status.stops);
    }

    const busIcon = window.L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
        iconSize: [35, 35],
        iconAnchor: [17, 17]
    });
    
    busMarkerRef.current = window.L.marker([status.currentLatitude, status.currentLongitude], { icon: busIcon, zIndexOffset: 1000 })
        .bindPopup("<b>Your Bus</b>")
        .addTo(mapRef.current);
  }, [status]);


  useEffect(() => {
    fetchStatus();
    return () => {
      if (stompClientRef.current) stompClientRef.current.disconnect();
    };
  }, [studentId]);

  useEffect(() => {
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      document.head.appendChild(script);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      script.onload = initMap;
    } else {
      initMap();
    }
  }, [initMap, status]);

  useEffect(() => {
    if (busMarkerRef.current && busLocation) {
      busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng]);
    }
  }, [busLocation]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>School Bus Tracker</h1>
        {status?.tripStatus === "IN_PROGRESS" && <span style={styles.liveBadge}>● LIVE</span>}
      </header>

      {error ? (
        <div style={styles.errorCard}>{error}</div>
      ) : status ? (
        <div style={styles.mainGrid}>
            <div style={styles.mapCard}>
                <div id="student-map" style={styles.map}></div>
            </div>

            <div style={styles.infoCol}>
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>Trip Details</h3>
                    <div style={styles.statusRow}>
                        <span style={styles.label}>Status:</span>
                        <span style={styles.statusVal}>{status.tripStatus.replace("_", " ")}</span>
                    </div>
                    <div style={styles.grid}>
                        <div style={styles.infoBox}>
                            <p style={styles.smallLabel}>ETA</p>
                            <h3>{status.estimatedMinutes ? `${Math.round(status.estimatedMinutes)} min` : "--"}</h3>
                        </div>
                        <div style={styles.infoBox}>
                            <p style={styles.smallLabel}>Next Stop</p>
                            <h4 style={styles.stopText}>{status.nextStopName || "N/A"}</h4>
                        </div>
                    </div>
                </div>

                <div style={styles.hintCard}>
                    <p>The map updates in real-time as the bus moves. Please be at your stop 5 minutes early!</p>
                </div>
            </div>
        </div>
      ) : (
        <div style={styles.loading}>Connecting to tracking system...</div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: "40px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: 0 },
  liveBadge: { background: "#ef4444", color: "white", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)" },
  mainGrid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" },
  mapCard: { background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", height: "500px" },
  map: { width: "100%", height: "100%" },
  infoCol: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { background: "white", padding: "24px", borderRadius: "20px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" },
  sectionTitle: { margin: "0 0 20px 0", color: "#334155", fontSize: "18px", fontWeight: "700" },
  statusRow: { display: "flex", justifyContent: "space-between", marginBottom: "20px", padding: "12px", background: "#f8fafc", borderRadius: "12px" },
  label: { color: "#64748b", fontWeight: "500" },
  statusVal: { color: "#6366f1", fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  infoBox: { padding: "16px", background: "#f1f5f9", borderRadius: "16px", textAlign: "center" },
  smallLabel: { fontSize: "12px", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" },
  stopText: { margin: 0, color: "#1e293b", fontSize: "16px" },
  hintCard: { padding: "20px", background: "#e0e7ff", color: "#3730a3", borderRadius: "16px", fontSize: "14px", lineHeight: "1.5", fontWeight: "500" },
  errorCard: { padding: "20px", background: "#fee2e2", color: "#991b1b", borderRadius: "16px", border: "1px solid #fecaca" },
  loading: { textAlign: "center", padding: "100px", color: "#64748b", fontSize: "18px" }
};

export default StudentTransportPage;
