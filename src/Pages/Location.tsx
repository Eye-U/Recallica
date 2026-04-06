import { useState, useEffect } from "react";
import { AppBar, BottomBar, SideBar } from "../components/Bar";
import { Search, Filter, Navigation, BookOpen, Coffee, TreePine, MapPin, Star } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Location.css";

// Fix for default Leaflet icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icon for the User's Location
const userIcon = L.divIcon({
  className: "loc-user-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper to center the map programmatically
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

// Math helper to calculate distance between two coordinates in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Earth radius in miles
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
  // Defaulting to Rodriguez, PH for context, will update if geolocation is allowed
  const [userPos, setUserPos] = useState<[number, number]>([14.73, 121.13]); 
  
  // New States for Real Data
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

// 1. Get User Location on Load (UPDATED FOR HIGH ACCURACY)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.warn("Could not get accurate location:", error.message);
        },
        { 
          enableHighAccuracy: true, // Forces GPS instead of IP guessing
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    }
  }, []);

  // 2. Fetch Real Places from Overpass API
  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true);
      const [lat, lon] = userPos;
      const radius = 3000; // Search within 3000 meters (approx 1.8 miles)

      // Map our UI filters to OpenStreetMap Tags
      let queryTags = "";
      if (activeFilter === "Cafe") queryTags = '["amenity"="cafe"]';
      else if (activeFilter === "Library") queryTags = '["amenity"="library"]';
      else if (activeFilter === "Park") queryTags = '["leisure"="park"]';
      else if (activeFilter === "Study Room") queryTags = '["amenity"="university"]'; // Fallback for study rooms
      else queryTags = '["amenity"~"cafe|library"]["leisure"~"park"]'; // All

      // Construct the Overpass QL Query
      const query = `
        [out:json][timeout:25];
        (
          node${queryTags}(around:${radius},${lat},${lon});
          way${queryTags}(around:${radius},${lat},${lon});
        );
        out center;
      `;

      try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query
        });
        const data = await response.json();

        // Format the raw OSM data into our UI structure
        const formattedPlaces = data.elements.map((el: any, index: number) => {
          const placeLat = el.lat || el.center.lat;
          const placeLon = el.lon || el.center.lon;
          
          // Determine type based on OSM tags
          let type = "Place";
          let tags = ["WIFI"];
          if (el.tags?.amenity === "cafe") { type = "Cafe"; tags = ["Coffee", "WIFI"]; }
          if (el.tags?.amenity === "library") { type = "Library"; tags = ["Quiet", "Books"]; }
          if (el.tags?.leisure === "park") { type = "Park"; tags = ["Nature", "Outdoors"]; }

          return {
            id: el.id,
            name: el.tags?.name || `Unnamed ${type}`,
            type: type,
            distance: `${calculateDistance(lat, lon, placeLat, placeLon)} mi`,
            position: [placeLat, placeLon],
            // Fake data for UI aesthetics (OSM doesn't track these)
            seats: `${Math.floor(Math.random() * 30) + 10} seats`,
            rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
            status: "OPEN",
            tags: tags
          };
        });

        // Remove places without names if you want a cleaner list
        const cleanPlaces = formattedPlaces.filter((p: any) => !p.name.includes("Unnamed"));
        setPlaces(cleanPlaces);

      } catch (error) {
        console.error("Error fetching places:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, [userPos, activeFilter]); // Re-run when location or filter changes

  // 3. Local Search Filter
  const filteredPlaces = places.filter(place => 
    place.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="locations-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Study Spots" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="loc-main-content">
        <div className="loc-map-container">
          <MapContainer center={userPos} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap position={userPos} />
            
            {/* THE NEW USER LOCATION MARKER */}
            <Marker position={userPos} icon={userIcon} zIndexOffset={1000}>
              <Popup>
                <strong>You are here</strong>
              </Popup>
            </Marker>

            {/* Render Real Markers for Places */}
            {filteredPlaces.map(place => (
              <Marker key={place.id} position={place.position as [number, number]}>
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
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserPos([pos.coords.latitude, pos.coords.longitude]);
              });
            }
          }}>
            <Navigation size={20} color="#2563eb" />
          </button>
        </div>

        <div className="loc-bottom-sheet">
          <div className="loc-sheet-handle"></div>
          <div className="loc-sheet-header">
            <div>
              <h2 className="loc-sheet-title">Nearby Places</h2>
              <p className="loc-sheet-subtitle">
                {isLoading ? "Searching area..." : `${filteredPlaces.length} spots found near you`}
              </p>
            </div>
            <div className="loc-live-badge"><span className="loc-live-dot"></span>Live</div>
          </div>

          <div className="loc-filters-scroll">
            {["All", "Library", "Cafe", "Park"].map(f => (
              <button 
                key={f} 
                className={`loc-filter-pill ${activeFilter === f ? "active" : ""}`} 
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="loc-places-list">
            {isLoading && <p className="loc-no-results">Fetching live satellite data...</p>}
            
            {!isLoading && filteredPlaces.length === 0 && (
              <p className="loc-no-results">No places found. Try a different filter or zooming out.</p>
            )}

            {!isLoading && filteredPlaces.map(place => (
              <div key={place.id} className="loc-place-card">
                <div className="loc-place-icon">
                  {place.type === "Library" && <BookOpen size={24} color="#2563eb" />}
                  {place.type === "Cafe" && <Coffee size={24} color="#d97706" />}
                  {place.type === "Park" && <TreePine size={24} color="#16a34a" />}
                  {place.type === "Place" && <MapPin size={24} color="#9333ea" />}
                </div>
                <div className="loc-place-details">
                  <div className="loc-place-name-row">
                    <h3>{place.name}</h3>
                    <div className="loc-rating"><Star size={14} fill="#fbbf24" stroke="none" /> {place.rating}</div>
                  </div>
                  <div className="loc-place-meta">
                    <span className="loc-meta-type">{place.type.toUpperCase()}</span> 
                    <span className="loc-meta-dot">•</span> <span>{place.distance}</span> 
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