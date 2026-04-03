import { useEffect, useState, useRef } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// @ts-ignore
import "leaflet-routing-machine"; 
// @ts-ignore
import "leaflet-control-geocoder"; 

import markerIcon from "leaflet/dist/images/marker-icon.png?url";
import markerShadow from "leaflet/dist/images/marker-shadow.png?url";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

interface StudySpot {
  id: number; lat: number; lon: number; name: string; type: string;
}

const Location = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routingRef = useRef<any>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const coordsRef = useRef({ lat: 14.5995, lng: 120.9842 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (!user?.email) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  // 🛠️ Route Drawing Logic
  const drawRoute = (dLat: number, dLon: number) => {
    if (!mapRef.current) return;
    if (routingRef.current) mapRef.current.removeControl(routingRef.current);

    routingRef.current = (L as any).Routing.control({
      waypoints: [L.latLng(coordsRef.current.lat, coordsRef.current.lng), L.latLng(dLat, dLon)],
      lineOptions: { styles: [{ color: "#3b82f6", weight: 6, opacity: 0.8 }] },
      createMarker: () => null,
      addWaypoints: false,
      show: false 
    }).addTo(mapRef.current);
  };

  // 🔎 Overpass API: Find Libraries, Cafes, Bookstores
  const fetchData = async (lat: number, lng: number) => {
    setLoading(true);
    const query = `[out:json];(node["amenity"~"library|cafe"](around:3000,${lat},${lng});node["shop"="books"](around:3000,${lat},${lng}););out;`;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
      const data = await res.json();
      const found = data.elements.map((e: any) => ({
        id: e.id, lat: e.lat, lon: e.lon,
        name: e.tags.name || "Study Spot",
        type: e.tags.amenity || e.tags.shop || "Spot"
      }));
      setSpots(found);

      if (markersRef.current) {
        markersRef.current.clearLayers();
        found.forEach((p: StudySpot) => {
          L.marker([p.lat, p.lon]).addTo(markersRef.current!)
            .bindPopup(`<b>${p.name}</b>`)
            .on('click', () => drawRoute(p.lat, p.lon));
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current!, { zoomControl: false }).setView([14.5995, 120.9842], 15);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    markersRef.current = L.layerGroup().addTo(map);

    userMarkerRef.current = L.circleMarker([14.5995, 120.9842], {
      radius: 9, color: "white", fillColor: "#3b82f6", fillOpacity: 1, weight: 3,
    }).addTo(map);

    // 🔍 SEARCH BAR (Geocoder)
    const ControlAny = L.Control as any;
    if (ControlAny.geocoder) {
      ControlAny.geocoder({
        defaultMarkGeocode: false,
        placeholder: "Search for a place...",
      }).on('markgeocode', (e: any) => {
        const { center } = e.geocode;
        map.flyTo(center, 16);
        fetchData(center.lat, center.lng);
      }).addTo(map);
    }

    // 📍 LIVE TRACKER
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        coordsRef.current = { lat: latitude, lng: longitude };
        userMarkerRef.current?.setLatLng([latitude, longitude]);
        if (spots.length === 0) {
            map.setView([latitude, longitude], 15);
            fetchData(latitude, longitude);
        }
      },
      (err) => console.error(err), { enableHighAccuracy: true }
    );

    setTimeout(() => map.invalidateSize(), 500);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Recallica Map" />
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        <SideBar isOpen={isOpen} />
        <div ref={mapContainerRef} style={{ flex: 1, height: "100%", zIndex: 1 }} />
        
        {/* Nearby Spots List */}
        <div style={{ 
          position: "absolute", bottom: "90px", right: "15px", left: "15px",
          maxHeight: "30%", backgroundColor: "white", borderRadius: "15px",
          zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", overflowY: "auto", padding: "15px"
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Nearby Study Spots</h4>
          {loading ? <p>Locating...</p> : spots.map(spot => (
            <div key={spot.id} onClick={() => { mapRef.current?.flyTo([spot.lat, spot.lon], 17); drawRoute(spot.lat, spot.lon); }}
              style={{ padding: "10px 0", borderBottom: "1px solid #eee", cursor: "pointer" }}>
              <div style={{ fontWeight: "600" }}>{spot.name}</div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{spot.type}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomBar />
    </div>
  );
};

export default Location;