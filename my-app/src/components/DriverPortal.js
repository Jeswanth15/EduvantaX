import React, { useState, useEffect, useRef, useCallback } from "react";
import { startTrip, endTrip, updateLocation, getDriverTripInfo, proposeStop } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const DriverPortal = () => {
  const [tripInfo, setTripInfo] = useState(null);
  const [tripStatus, setTripStatus] = useState("NOT_STARTED");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [nextStopIndex, setNextStopIndex] = useState(0);

  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentPosMarkerRef = useRef(null);
  const lastRouteFetchLocRef = useRef(null);
  
  const decoded = getDecodedToken();
  const userId = decoded?.userId;

  const updateMapMarker = useCallback((pos) => {
    if (!mapRef.current || !window.L) return;
    if (!currentPosMarkerRef.current) {
        const busIcon = window.L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', iconSize: [32, 32], iconAnchor: [16, 16] });
        currentPosMarkerRef.current = window.L.marker([pos.lat, pos.lng], { icon: busIcon, zIndexOffset: 1000 }).bindPopup("<b>Your Current Position</b>").addTo(mapRef.current);
    } else currentPosMarkerRef.current.setLatLng([pos.lat, pos.lng]);
  }, []);

  const fetchOSRMRoute = useCallback(async (currentPos, stops) => {
    const allPoints = currentPos ? [{latitude: currentPos.lat, longitude: currentPos.lng}, ...stops] : stops;
    if (allPoints.length < 2) {
       if (polylineRef.current) polylineRef.current.setLatLngs([]);
       return;
    }
    try {
      const coords = allPoints.map(s => `${s.longitude},${s.latitude}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const roadCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        if (polylineRef.current) polylineRef.current.setLatLngs(roadCoords);
        else if (mapRef.current) polylineRef.current = window.L.polyline(roadCoords, { color: '#3b82f6', weight: 6, opacity: 0.9 }).addTo(mapRef.current);
      }
    } catch (error) { console.error("OSRM Routing failed", error); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDriverTripInfo(userId);
      setTripInfo(res.data);
      if (!res.data.profileExists) return setMessage("Driver profile not found. Please contact admin.");
      if (!res.data.approved) return setMessage("Profile awaiting platform clearance.");
      
      let initialNextIdx = 0;
      if (res.data.activeTrip && res.data.activeTrip.lastReachedStopId && res.data.stops) {
          const reachedIdx = res.data.stops.findIndex(s => s.id === res.data.activeTrip.lastReachedStopId);
          if (reachedIdx !== -1 && reachedIdx < res.data.stops.length - 1) initialNextIdx = reachedIdx + 1;
      }
      setNextStopIndex(initialNextIdx);

      if (res.data.activeTrip) {
        setTripStatus("IN_PROGRESS");
        if (res.data.stops?.length > 0) fetchOSRMRoute(null, res.data.stops.slice(initialNextIdx));
      } else {
        setTripStatus("NOT_STARTED");
        if (res.data.stops?.length > 0) {
          const startPos = { lat: res.data.stops[0].latitude, lng: res.data.stops[0].longitude };
          setLocation(startPos); updateMapMarker(startPos); fetchOSRMRoute(null, res.data.stops);
        }
      }
    } catch (err) { setMessage("Failed to load tracking node."); }
  }, [userId, updateMapMarker, fetchOSRMRoute]);

  const initMap = useCallback(() => {
    if (mapRef.current || !window.L || !tripInfo || !tripInfo.profileExists) return;
    const center = tripInfo.stops?.length > 0 ? [tripInfo.stops[0].latitude, tripInfo.stops[0].longitude] : [13.0827, 80.2707];
    mapRef.current = window.L.map('driver-map', { zoomControl:false }).setView(center, 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

    if (tripInfo.stops) {
      tripInfo.stops.forEach((stop, idx) => {
        const marker = window.L.marker([stop.latitude, stop.longitude]).bindPopup(`<b>Stop ${idx + 1}:</b> ${stop.stopName}`).addTo(mapRef.current);
        markersRef.current.push(marker);
      });
      // Initial route setup runs in fetchData/useEffect so we just do bounds here
      const pathCoords = tripInfo.stops.map(s => [s.latitude, s.longitude]);
      if (pathCoords.length > 0) {
          polylineRef.current = window.L.polyline(pathCoords, { color: '#3b82f6', weight: 6, opacity: 0.9 }).addTo(mapRef.current);
          mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
      }
    }
  }, [tripInfo]);

  const handleStartTrip = async () => {
    if (!navigator.geolocation) return alert("Geolocation unsupported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const currentPos = { lat: latitude, lng: longitude };
      setLocation(currentPos); updateMapMarker(currentPos);
      try {
        await startTrip(userId); setTripStatus("IN_PROGRESS"); setMessage("Route activated.");
        await updateLocation(userId, { latitude, longitude }); fetchData();
      } catch (err) { setMessage("Error starting trip."); }
    }, err => alert("Location sharing required"), { enableHighAccuracy: true });
  };

  const handleEndTrip = async () => {
    try {
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      await endTrip(userId); setTripStatus("COMPLETED"); setMessage("Route officially signed off."); fetchData();
    } catch (error) { setMessage("Error ending trip."); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { updateMapMarker(location); }, [updateMapMarker, location]);

  useEffect(() => {
    if (tripStatus === "IN_PROGRESS" && tripInfo?.stops) {
      let curNextIdx = nextStopIndex;
      const nextStop = tripInfo.stops[curNextIdx];
      if (nextStop) {
        const dist = getDistanceFromLatLonInKm(location.lat, location.lng, nextStop.latitude, nextStop.longitude);
        if (dist < 0.05 && curNextIdx < tripInfo.stops.length - 1) {
           curNextIdx += 1;
           setNextStopIndex(curNextIdx);
        }
      }
      
      const lastLoc = lastRouteFetchLocRef.current;
      const movedDist = lastLoc ? getDistanceFromLatLonInKm(location.lat, location.lng, lastLoc.lat, lastLoc.lng) : 999;
      
      if (movedDist > 0.05) {
        lastRouteFetchLocRef.current = location;
        const remainingStops = tripInfo.stops.slice(curNextIdx);
        fetchOSRMRoute(location, remainingStops);
      }
    }
  }, [location, tripStatus, tripInfo, nextStopIndex, fetchOSRMRoute]);

  const handleProposeStop = async () => {
    const stopName = window.prompt("Enter a name for this new location (e.g. 'Village Square Checkpoint'):");
    if (!stopName) return;
    try {
      await proposeStop(userId, stopName, location.lat, location.lng);
      alert(`Location '${stopName}' submitted to admin for approval as a Route Node.`);
    } catch (e) {
      alert("Failed to submit location.");
    }
  };

  useEffect(() => {
    if (!window.L) {
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true; document.head.appendChild(script);
      const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      script.onload = initMap;
    } else initMap();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [initMap, tripInfo]);

  useEffect(() => {
    if (tripStatus === "IN_PROGRESS") {
      if (!navigator.geolocation) return;
      watchIdRef.current = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords; const newPos = { lat: latitude, lng: longitude };
        setLocation(newPos); updateMapMarker(newPos);
        fetchOSRMRoute(newPos, tripInfo?.stops?.slice(nextStopIndex) || []);
        updateLocation(userId, { latitude, longitude }).catch(err => console.error(err));
      }, err => console.error("GPS Error"), { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });
    } else if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [tripStatus, userId, updateMapMarker, tripInfo, nextStopIndex, fetchOSRMRoute]);

  if (!tripInfo) return <div style={{height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)"}}>Establishing secure tracking connection...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Driver Dashboard</h1>
            <p style={{ margin:0, fontSize:15, color:"var(--text-secondary)", fontWeight:600 }}>{tripInfo.bus?.busNumber} • {tripInfo.route?.routeName || "Standby"}</p>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:99, fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:"1px", ...(tripStatus==="IN_PROGRESS"?{background:"rgba(16,185,129,0.1)", color:"#10b981", border:"1px solid rgba(16,185,129,0.3)"}:{background:"rgba(100,116,139,0.1)", color:"var(--text-secondary)", border:"1px solid var(--border-medium)"}) }}>
             {tripStatus}
          </div>
       </div>

       {message && <div style={{ background:"var(--primary-color)", color:"white", padding:16, borderRadius:16, marginBottom:24, fontWeight:700, animation:"slideDown 0.3s ease" }}>{message}</div>}

       <div className="responsive-grid-2-1">
          
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
             <div style={{ background:"var(--surface-1)", borderRadius:24, padding:20, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-md)" }}>
                <div id="driver-map" style={{ width:"100%", height:500, borderRadius:16, zIndex:0 }}></div>
             </div>

             <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                <h3 style={{ fontSize:18, fontWeight:800, margin:"0 0 20px" }}>Mission Commands</h3>
                {tripStatus !== "IN_PROGRESS" ? (
                   <button disabled={!tripInfo.approved || !tripInfo.bus} onClick={handleStartTrip} style={{ width:"100%", padding:20, background:(!tripInfo.approved || !tripInfo.bus)?"var(--surface-2)":"var(--primary-color)", color:(!tripInfo.approved || !tripInfo.bus)?"var(--text-muted)":"white", border:"none", borderRadius:16, fontWeight:800, fontSize:18, cursor:(!tripInfo.approved || !tripInfo.bus)?"not-allowed":"pointer", boxShadow:(!tripInfo.approved || !tripInfo.bus)?"none":"0 8px 24px rgba(37,99,235,0.3)", transition:"transform 0.2s" }} onMouseEnter={e=>{if(tripInfo.approved && tripInfo.bus)e.currentTarget.style.transform="scale(1.02)"}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
                      Initiate Run
                   </button>
                ) : (
                   <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      <button onClick={handleEndTrip} style={{ width:"100%", padding:20, background:"#ef4444", color:"white", border:"none", borderRadius:16, fontWeight:800, fontSize:18, cursor:"pointer", boxShadow:"0 8px 24px rgba(239,68,68,0.3)", transition:"transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                         Sign Off Mission
                      </button>
                      <button onClick={handleProposeStop} style={{ width:"100%", padding:16, background:"#8b5cf6", color:"white", border:"none", borderRadius:16, fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:"0 8px 24px rgba(139,92,246,0.3)", transition:"transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                         Mark Current Location as Stop
                      </button>
                   </div>
                )}
                <p style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"var(--text-muted)", marginTop:16, textTransform:"uppercase", letterSpacing:"1px" }}>Loc: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
             </div>
          </div>

          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", height:"100%" }}>
             <h3 style={{ fontSize:18, fontWeight:800, margin:"0 0 24px" }}>Route for Travel</h3>
             <div style={{ display:"flex", flexDirection:"column", gap:16, position:"relative" }}>
                <div style={{ position:"absolute", left:15, top:0, bottom:0, width:2, background:"var(--border-medium)", zIndex:0 }}></div>
                {tripInfo.stops?.map((s, idx) => {
                   const isPassed = tripStatus === "IN_PROGRESS" && idx < nextStopIndex;
                   const isNext = tripStatus === "IN_PROGRESS" && idx === nextStopIndex;
                   return (
                   <div key={s.id} style={{ display:"flex", gap:16, position:"relative", zIndex:1, background:"var(--surface-1)", padding:"12px 0", opacity: isPassed ? 0.4 : 1 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:isNext?"#3b82f6":"var(--surface-2)", color:isNext?"white":"var(--text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, border:isNext?"none":"2px solid var(--border-light)", flexShrink:0, transition:"all 0.2s", boxShadow:isNext?"0 4px 12px rgba(59,130,246,0.3)":"none" }}>
                         {isPassed ? "✓" : (idx+1)}
                      </div>
                      <div style={{ paddingTop:6 }}>
                         <div style={{ fontSize:15, fontWeight:800, color:isNext?"#3b82f6":"var(--text-primary)", marginBottom:4 }}>{s.stopName} {isNext && <span style={{fontSize:11, padding:"2px 6px", background:"rgba(59,130,246,0.1)", borderRadius:4, marginLeft:4}}>NEXT STOP</span>}</div>
                         <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)" }}>{s.latitude.toFixed(3)}N, {s.longitude.toFixed(3)}E</div>
                      </div>
                   </div>
                )})}
                {(!tripInfo.stops || tripInfo.stops.length === 0) && <div style={{ padding:20, color:"var(--text-tertiary)" }}>No nodes programmed.</div>}
             </div>
          </div>

       </div>
    </div>
  );
};

export default DriverPortal;
