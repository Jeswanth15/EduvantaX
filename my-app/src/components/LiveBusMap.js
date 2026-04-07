import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBusStatus } from "../utils/api";
import { FaBus, FaMapMarkerAlt, FaRoute } from "react-icons/fa";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (emoji, color) => {
    return L.divIcon({
        html: `<div style="background-color: ${color}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 2px solid white;">${emoji}</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
};

const busIcon = createCustomIcon("🚌", "#fbbf24");
const homeIcon = createCustomIcon("🏠", "#10b981");
const stopIcon = createCustomIcon("🚏", "#6366f1");

const SetViewOnMount = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, 14);
    }, [coords, map]);
    return null;
};

const LiveBusMap = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      if (userId) {
        const res = await getBusStatus(userId);
        setStatus(res.data);
        setError("");
      }
    } catch (err) {
      setError("No active route tracking currently.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 10s for dashboard
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) return <div style={styles.loading}>Loading Map...</div>;
  if (error || !status) return <div style={styles.error}>{error || "Tracking data unavailable"}</div>;

  const busPos = status.currentLocation ? [status.currentLocation.latitude, status.currentLocation.longitude] : null;
  const homePos = status.studentStop ? [status.studentStop.latitude, status.studentStop.longitude] : null;
  const polyline = (status.allRouteStops || []).map(s => [s.latitude, s.longitude]);

  // Calculate stops in between
  let stopsInBetween = 0;
  if (status.allRouteStops && status.currentStop && status.studentStop) {
      const stops = status.allRouteStops;
      const currentIdx = stops.findIndex(s => s.stopName === status.currentStop.stopName);
      const studentIdx = stops.findIndex(s => s.stopName === status.studentStop.stopName);
      
      if (currentIdx !== -1 && studentIdx !== -1 && studentIdx > currentIdx) {
          stopsInBetween = studentIdx - currentIdx - 1;
      }
  }

  return (
    <div style={styles.container}>
      <div style={styles.infoBar}>
        <div style={styles.infoItem}>
          <FaBus style={{color: '#fbbf24'}} />
          <span>Bus {status.busNumber}</span>
        </div>
        <div style={styles.infoItem}>
          <FaMapMarkerAlt style={{color: '#10b981'}} />
          <span><b>{stopsInBetween}</b> stops until your pickup point</span>
        </div>
        {status.eta !== null && (
          <div style={styles.etaBadge}>
            ETA: {Math.round(status.eta)} mins
          </div>
        )}
      </div>

      <div style={styles.mapWrapper}>
        <MapContainer center={homePos || [0,0]} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {polyline.length > 0 && <Polyline positions={polyline} color="#6366f1" weight={3} opacity={0.5} />}
          
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '400px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
  },
  infoBar: {
    padding: '12px 20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  infoItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  etaBadge: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
  },
  mapWrapper: { flex: 1, position: 'relative' },
  loading: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  error: { height: '100px', padding: '20px', color: '#64748b', textAlign: 'center', fontSize: '14px', fontStyle: 'italic' }
};

export default LiveBusMap;
