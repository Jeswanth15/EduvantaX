import React, { useState, useEffect, useRef, useCallback } from "react";
import { startTrip, endTrip, updateLocation, getDriverTripInfo } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const DriverPortal = () => {
  const [tripInfo, setTripInfo] = useState(null);
  const [tripStatus, setTripStatus] = useState("NOT_STARTED");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentPosMarkerRef = useRef(null);
  
  const decoded = getDecodedToken();
  const userId = decoded?.userId;

  const updateMapMarker = useCallback((pos) => {
    if (!mapRef.current || !window.L) return;
    
    if (!currentPosMarkerRef.current) {
        const busIcon = window.L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        currentPosMarkerRef.current = window.L.marker([pos.lat, pos.lng], { icon: busIcon })
            .bindPopup("<b>Your Current Position</b>")
            .addTo(mapRef.current);
    } else {
        currentPosMarkerRef.current.setLatLng([pos.lat, pos.lng]);
    }
  }, []);

  const fetchOSRMRoute = useCallback(async (stops) => {
    if (stops.length < 2) return;
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
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDriverTripInfo(userId);
      setTripInfo(res.data);
      
      if (!res.data.profileExists) {
        setMessage("Driver profile not found. Please contact admin.");
        return;
      }
      if (!res.data.approved) {
        setMessage("Your transport profile is awaiting admin approval.");
        return;
      }

      if (res.data.activeTrip) {
        setTripStatus("IN_PROGRESS");
      }
      if (res.data.stops?.length > 0 && tripStatus === "NOT_STARTED") {
        const startPos = { lat: res.data.stops[0].latitude, lng: res.data.stops[0].longitude };
        setLocation(startPos);
        updateMapMarker(startPos);
        fetchOSRMRoute(res.data.stops);
      }
    } catch (err) {
      console.error("Error fetching trip info", err);
      setMessage("Failed to load trip information.");
    }
  }, [userId, updateMapMarker, fetchOSRMRoute, tripStatus]);




  // Initialize Map

  const initMap = useCallback(() => {
    if (mapRef.current || !window.L || !tripInfo || !tripInfo.profileExists) return;
    
    const center = tripInfo.stops?.length > 0 
        ? [tripInfo.stops[0].latitude, tripInfo.stops[0].longitude] 
        : [13.0827, 80.2707];

    mapRef.current = window.L.map('driver-map').setView(center, 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

    // Add Stops
    if (tripInfo.stops) {
      const pathCoords = tripInfo.stops.map(s => [s.latitude, s.longitude]);
      
      tripInfo.stops.forEach((stop, idx) => {
        const marker = window.L.marker([stop.latitude, stop.longitude])
          .bindPopup(`<b>Stop ${idx + 1}:</b> ${stop.stopName}`)
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      });

      // Draw Route Path (Initially straight, OSRM will update it)
      polylineRef.current = window.L.polyline(pathCoords, { color: '#6366f1', weight: 4, opacity: 0.5, dashArray: '5, 10' }).addTo(mapRef.current);
      if (pathCoords.length > 0) {
        mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
      }
      
      fetchOSRMRoute(tripInfo.stops);
    }
  }, [tripInfo, fetchOSRMRoute]);

  // Location Updates during Trip

  const handleStartTrip = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    try {
      // First, request current location to ensure permission is granted
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const currentPos = { lat: latitude, lng: longitude };
          setLocation(currentPos);
          updateMapMarker(currentPos);

          try {
            await startTrip(userId);
            setTripStatus("IN_PROGRESS");
            setMessage("Ride started! Safe travels. 🚌");
            
            // Immediate location share with real coordinates
            await updateLocation(userId, { latitude, longitude });
            fetchData();
          } catch (error) {
            setMessage("Error starting trip: " + (error.response?.data?.message || error.response?.data || error.message));
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Location sharing is required to start the trip. Please enable location permissions.");
        },
        { enableHighAccuracy: true }
      );
    } catch (error) {
      setMessage("Error searching status: " + (error.message));
    }
  };

  const handleEndTrip = async () => {
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      await endTrip(userId);
      setTripStatus("COMPLETED");
      setMessage("Ride finished. Thank you! ✅");
      fetchData();
    } catch (error) {
      setMessage("Error ending trip: " + (error.response?.data || error.message));
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    updateMapMarker(location);
  }, [updateMapMarker, location]);

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
    
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, [initMap, tripInfo]);

  useEffect(() => {
    if (tripStatus === "IN_PROGRESS") {
      if (!navigator.geolocation) {
        console.error("Geolocation not supported");
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          setLocation(newPos);
          updateMapMarker(newPos);

          updateLocation(userId, { latitude, longitude })
            .catch(err => console.error("GPS Update Failed", err));
        },
        (error) => {
          console.error("GPS Watch Error", error);
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, 
          timeout: 5000 
        }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tripStatus, userId, updateMapMarker]);

  if (!tripInfo) return <div style={styles.loading}>Loading Trip Profile...</div>;

  return (
    <div style={styles.container}>
      <div className="transport-flex-header" style={{ marginBottom: "30px" }}>
        <div>
          <h1 style={styles.title}>Driver Navigator</h1>
          <p style={styles.subtitle}>{tripInfo.bus?.busNumber} • {tripInfo.route?.routeName || "No Route Assigned"}</p>
        </div>
        <div style={styles.statusBadge(tripStatus)}>{tripStatus.replace("_", " ")}</div>
      </div>

      {message && <div style={styles.alert}>{message}</div>}

      <div className="transport-grid-driver">
        <div style={styles.leftCol}>
          <div style={styles.card}>
              <div id="driver-map" style={styles.mapContainer}></div>
          </div>

          <div style={styles.card}>
            <h3>Trip Controls</h3>
            <div style={styles.buttonRow}>
                {tripStatus !== "IN_PROGRESS" ? (
                <button 
                    style={(!tripInfo.approved || !tripInfo.bus) ? styles.btnDisabled : styles.btnStart} 
                    onClick={handleStartTrip}
                    disabled={!tripInfo.approved || !tripInfo.bus}
                >
                    Start Morning Ride
                </button>
                ) : (
                <button style={styles.btnEnd} onClick={handleEndTrip}>Finish Ride</button>
                )}
            </div>
            <p style={styles.hint}>Current GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
          </div>
        </div>

        <div style={styles.rightCol}>
            <div style={styles.card}>
                <h3>Route Stops</h3>
                <div style={styles.stopList}>
                    {tripInfo.stops?.map((stop, idx) => (
                        <div key={stop.id} style={styles.stopItem}>
                            <div style={styles.stopNumber}>{idx + 1}</div>
                            <div style={styles.stopInfo}>
                                <strong>{stop.stopName}</strong>
                                <span>{stop.latitude.toFixed(2)}°N, {stop.longitude.toFixed(2)}°E</span>
                            </div>
                        </div>
                    ))}
                    {(!tripInfo.stops || tripInfo.stops.length === 0) && <p>No stops defined for this route.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "30px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "100vh" },
  title: { fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 },
  subtitle: { color: "#64748b", margin: "4px 0 0 0", fontWeight: "500" },
  statusBadge: (status) => ({
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: status === "IN_PROGRESS" ? "#dcfce7" : "#f1f5f9",
    color: status === "IN_PROGRESS" ? "#166534" : "#475569",
    border: `1px solid ${status === "IN_PROGRESS" ? "#bbf7d0" : "#e2e8f0"}`
  }),
  alert: { padding: "16px", background: "#ecfdf5", color: "#065f46", borderRadius: "12px", marginBottom: "24px", border: "1px solid #a7f3d0", fontWeight: "600" },
  card: { background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", marginBottom: "24px" },
  mapContainer: { width: "100%", height: "400px", borderRadius: "12px", backgroundColor: "#f1f5f9" },
  buttonRow: { display: "flex", gap: "12px", marginTop: "16px" },
  btnStart: { flex: 1, padding: "14px", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)" },
  btnEnd: { flex: 1, padding: "14px", background: "#ef4444", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)" },
  btnDisabled: { flex: 1, padding: "14px", background: "#cbd5e1", color: "#64748b", border: "none", borderRadius: "12px", cursor: "not-allowed", fontWeight: "700" },
  hint: { fontSize: "12px", color: "#94a3b8", marginTop: "12px", textAlign: "center" },
  stopList: { display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" },
  stopItem: { display: "flex", alignItems: "center", gap: "16px", padding: "12px", borderRadius: "12px", border: "1px solid #f1f5f9" },
  stopNumber: { width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#475569" },
  stopInfo: { display: "flex", flexDirection: "column" },
  loading: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#64748b" }
};

export default DriverPortal;
