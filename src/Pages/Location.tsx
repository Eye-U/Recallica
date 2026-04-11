import { useState, useEffect, useRef } from "react";
import { AppBar, BottomBar, SideBar } from "../components/Bar";
import { Search, Filter, Navigation, BookOpen, Coffee, TreePine, MapPin, Star } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Location.css";

// 1. Default Blue Marker
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 2. Custom User Location Dot
const userIcon = L.divIcon({
  className: "loc-user-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// 3. Red SVG Pin for the Selected Place
const activeIcon = L.divIcon({
  className: "loc-active-svg",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

function MapController({ userPos, selectedPos }: { userPos: [number, number], selectedPos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPos) {
      map.flyTo(selectedPos, 17, { duration: 1.2 });
    } else {
      map.flyTo(userPos, 15, { duration: 1.2 });
    }
  }, [userPos, selectedPos, map]);
  return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return (R * c).toFixed(1);
}

function Locations() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userPos, setUserPos] = useState<[number, number]>([14.73, 121.13]); 
  
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);

  // --- NEW: DRAGGABLE BOTTOM SHEET LOGIC ---
  const [sheetHeight, setSheetHeight] = useState(45); // Starts at 45% of screen height
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startHeight.current = sheetHeight;
    e.currentTarget.setPointerCapture(e.pointerId); // Locks the touch to this element!
  };

const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY.current;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    let newHeight = startHeight.current - deltaVh;

    // BOUNDS: Cap it at 75 so it doesn't cover your header!
    if (newHeight < 15) newHeight = 15;
    if (newHeight > 75) newHeight = 75; 
    
    setSheetHeight(newHeight);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    // SNAP LOGIC: Synced with the new 75 max
    if (sheetHeight < 30) setSheetHeight(15);      // Minimized Map view
    else if (sheetHeight > 60) setSheetHeight(75); // Full List view
    else setSheetHeight(45);                       // Half-and-Half view
  };
  // -----------------------------------------

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        (error) => console.warn("Location error:", error.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true);
      const [lat, lon] = userPos;
      const radius = 4000; 
      let finalPlaces: any[] = []; 

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"cafe|library|university"](around:${radius},${lat},${lon});
          way["amenity"~"cafe|library|university"](around:${radius},${lat},${lon});
          node["leisure"="park"](around:${radius},${lat},${lon});
          way["leisure"="park"](around:${radius},${lat},${lon});
        );
        out center;
      `;

      try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query
        });
        const data = await response.json();

        let formattedPlaces = data.elements.map((el: any) => {
          const placeLat = el.lat || el.center.lat;
          const placeLon = el.lon || el.center.lon;
          
          let type = "Place";
          let tags = ["WIFI"];
          if (el.tags?.amenity === "cafe") { type = "Cafe"; tags = ["Coffee", "WIFI"]; }
          if (el.tags?.amenity === "library") { type = "Library"; tags = ["Quiet", "Books"]; }
          if (el.tags?.leisure === "park") { type = "Park"; tags = ["Nature", "Outdoors"]; }
          if (el.tags?.amenity === "university") { type = "Study Room"; tags = ["Focus", "Campus"]; }

          return {
            id: el.id,
            name: el.tags?.name || `Unnamed ${type}`,
            type: type,
            distance: calculateDistance(lat, lon, placeLat, placeLon),
            position: [placeLat, placeLon],
            seats: `${Math.floor(Math.random() * 30) + 10} seats`,
            rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
            status: "OPEN",
            tags: tags
          };
        });

        finalPlaces = formattedPlaces.filter((p: any) => !p.name.includes("Unnamed"));
      } catch (error) {
        console.warn("API limit reached or failed. Relying on fallback data.");
      } finally {
        if (finalPlaces.length === 0) {
           finalPlaces = [
             { id: 901, name: "Project Demo Library", type: "Library", distance: "0.2", position: [lat + 0.002, lon + 0.002], seats: "24 seats", rating: "4.8", status: "CLOSED", tags: ["Quiet", "WIFI"] },
             { id: 902, name: "Local Brews Cafe", type: "Cafe", distance: "0.5", position: [lat - 0.003, lon + 0.001], seats: "12 seats", rating: "4.5", status: "OPEN", tags: ["Coffee", "Music"] },
             { id: 903, name: "Community Park", type: "Park", distance: "0.8", position: [lat + 0.001, lon - 0.004], seats: "Outdoor", rating: "4.2", status: "OPEN", tags: ["Nature"] }
           ];
        }
        finalPlaces.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        setPlaces(finalPlaces);
        setIsLoading(false);
      }
    };
    fetchPlaces();
  }, [userPos]);

  const filteredPlaces = places.filter(place => {
    const matchesFilter = activeFilter === "All" || place.type === activeFilter;
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedPlaceData = places.find(p => p.id === activePlaceId);
  const mapFocusPos = selectedPlaceData ? (selectedPlaceData.position as [number, number]) : null;

  return (
    <div className="locations-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Study Spots" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* NEW: Passed CSS variables and dragging class dynamically */}
      <main 
        className={`loc-main-content ${isDragging ? "dragging" : ""}`}
        style={{ ["--sheet-height" as any]: `${sheetHeight}vh` }}
      >
        <div className="loc-map-container">
          <MapContainer center={userPos} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController userPos={userPos} selectedPos={mapFocusPos} />
            
            <Marker position={userPos} icon={userIcon} zIndexOffset={1000}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>

            {filteredPlaces.map(place => (
              <Marker 
                key={place.id} 
                position={place.position as [number, number]}
                icon={activePlaceId === place.id ? activeIcon : DefaultIcon}
                zIndexOffset={activePlaceId === place.id ? 999 : 0}
              >
                <Popup>
                  <strong>{place.name}</strong> <br /> {place.type}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="loc-search-overlay">
            <div className="loc-search-bar">
              <Search size={20} color="#6c757d" />
              <input 
                type="text" 
                placeholder="Search study spots..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="loc-filter-icon"><Filter size={18} /></button>
            </div>
          </div>

          <button className="loc-recenter-btn" onClick={() => {
            setActivePlaceId(null);
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserPos([pos.coords.latitude, pos.coords.longitude]);
              });
            }
          }}>
            <Navigation size={20} color="#2563eb" />
          </button>
        </div>

        {/* BOTTOM SHEET */}
        <div className="loc-bottom-sheet">
          {/* DRAG AREA */}
          <div 
            className="loc-sheet-drag-area"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp} // Safety net
          >
            <div className="loc-sheet-handle"></div>
          </div>

          <div className="loc-sheet-header">
            <div>
              <h2 className="loc-sheet-title">Nearby Places</h2>
              <p className="loc-sheet-subtitle">
                {isLoading ? "Searching area..." : `${filteredPlaces.length} spots found`}
              </p>
            </div>
            <div className="loc-live-badge"><span className="loc-live-dot"></span>Live</div>
          </div>

          <div className="loc-filters-scroll">
            {["All", "Library", "Cafe", "Park"].map(f => (
              <button 
                key={f} 
                className={`loc-filter-pill ${activeFilter === f ? "active" : ""}`} 
                onClick={() => {
                  setActiveFilter(f);
                  setActivePlaceId(null);
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="loc-places-list">
            {isLoading && <p className="loc-no-results">Fetching live satellite data...</p>}
            {!isLoading && filteredPlaces.length === 0 && <p className="loc-no-results">No places found. Try a different filter.</p>}

            {!isLoading && filteredPlaces.map(place => (
              <div 
                key={place.id} 
                className={`loc-place-card ${activePlaceId === place.id ? "active-card" : ""}`}
                onClick={() => {
                  setActivePlaceId(place.id);
                  // NEW: Automatically slide the sheet down so they can see the map!
                  if (sheetHeight > 60) setSheetHeight(45);
                }}
              >
                <div className="loc-place-icon">
                  {place.type === "Library" && <BookOpen size={24} color="#2563eb" />}
                  {place.type === "Cafe" && <Coffee size={24} color="#d97706" />}
                  {place.type === "Park" && <TreePine size={24} color="#16a34a" />}
                  {place.type === "Study Room" && <MapPin size={24} color="#9333ea" />}
                </div>
                <div className="loc-place-details">
                  <div className="loc-place-name-row">
                    <h3>{place.name}</h3>
                    <div className="loc-rating"><Star size={14} fill="#fbbf24" stroke="none" /> {place.rating}</div>
                  </div>
                  <div className="loc-place-meta">
                    <span className="loc-meta-type">{place.type.toUpperCase()}</span> 
                    <span className="loc-meta-dot">•</span> <span>{place.distance} mi</span> 
                    <span className="loc-meta-dot">•</span> <span>{place.seats}</span>
                    <span className={`loc-status ${place.status.toLowerCase()}`}>{place.status}</span>
                  </div>
                  <div className="loc-place-tags">
                    {place.tags.map((tag: string) => (
                      <span key={tag} className="loc-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomBar />
    </div>
  );
}

export default Locations;