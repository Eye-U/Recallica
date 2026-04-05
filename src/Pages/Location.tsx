import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../style.css';
import './Location.css';
import {
  MapPin, Star, Navigation, ChevronRight,
  BookOpen, Coffee, Trees, Users,
  Loader, Search, Filter, ChevronUp,
  type LucideIcon,
} from "lucide-react";

/* ─── Icon map (string → component, avoids Illegal constructor) ──────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Coffee,
  Trees,
  Users,
};

/* ─── Mock data ──────────────────────────────────────────────────────────────── */
const NEARBY_PLACES = [
  {
    id: 1, name: "City Central Library", type: "Library",
    distance: "0.2 mi", rating: 4.8, iconName: "BookOpen",
    color: "#2563eb", bg: "#eff6ff",
    tags: ["Quiet", "WiFi", "24hr"], open: true, seats: 42,
  },
  {
    id: 2, name: "Bean & Book Cafe", type: "Cafe",
    distance: "0.5 mi", rating: 4.5, iconName: "Coffee",
    color: "#ea580c", bg: "#fff7ed",
    tags: ["Coffee", "Cozy", "Music"], open: true, seats: 18,
  },
  {
    id: 3, name: "Sunset Park", type: "Park",
    distance: "1.2 mi", rating: 4.2, iconName: "Trees",
    color: "#16a34a", bg: "#f0fdf4",
    tags: ["Outdoor", "Quiet"], open: true, seats: 0,
  },
  {
    id: 4, name: "Northside Study Hub", type: "Study Room",
    distance: "1.8 mi", rating: 4.7, iconName: "Users",
    color: "#7c3aed", bg: "#f5f3ff",
    tags: ["Group", "WiFi", "Whiteboard"], open: false, seats: 26,
  },
];

const FILTERS = ["All", "Library", "Cafe", "Park", "Study Room"];
const MAP_PINS = [
  { id: 1, x: 26, y: 34, active: false },
  { id: 2, x: 59, y: 54, active: true },
];

/* ─── StarRating ─────────────────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <Star size={11} fill="#f59e0b" color="#f59e0b" />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{rating}</span>
    </span>
  );
}

/* ─── PlaceCard ──────────────────────────────────────────────────────────────── */
function PlaceCard({ place, index, onSelect, selected }: {
  place: typeof NEARBY_PLACES[0];
  index: number;
  onSelect: (id: number) => void;
  selected: boolean;
}) {
  const Icon = ICON_MAP[place.iconName];
  return (
    <button
      className="loc-place-card"
      data-selected={selected}
      onClick={() => onSelect(place.id)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="loc-place-icon" style={{ background: place.bg, color: place.color }}>
        {Icon && <Icon size={20} strokeWidth={2} />}
      </div>
      <div className="loc-place-info">
        <div className="loc-place-name">{place.name}</div>
        <div className="loc-place-meta">
          <span className="loc-place-type">{place.type}</span>
          <span className="loc-place-dot">·</span>
          <span className="loc-place-dist">{place.distance}</span>
          {place.seats > 0 && (
            <><span className="loc-place-dot">·</span>
            <span className="loc-place-seats">{place.seats} seats</span></>
          )}
        </div>
        <div className="loc-place-tags">
          {place.tags.map(t => <span key={t} className="loc-tag">{t}</span>)}
        </div>
      </div>
      <div className="loc-place-right">
        <StarRating rating={place.rating} />
        <span className={`loc-open-badge ${place.open ? "loc-open" : "loc-closed"}`}>
          {place.open ? "Open" : "Closed"}
        </span>
        <ChevronRight size={14} color="var(--gray-300)" />
      </div>
    </button>
  );
}

/* ─── MapView ────────────────────────────────────────────────────────────────── */
function MapView({ selectedPin, onPinClick }: {
  selectedPin: number | null;
  onPinClick: (id: number) => void;
}) {
  return (
    <div className="loc-map">
      <svg width="100%" height="100%" viewBox="0 0 400 340"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="340" fill="#e8edf5" />
        <rect x="0"   y="130" width="400" height="18" fill="#f5f7fa" />
        <rect x="0"   y="230" width="400" height="14" fill="#f5f7fa" />
        <rect x="140" y="0"   width="16"  height="340" fill="#f5f7fa" />
        <rect x="260" y="0"   width="14"  height="340" fill="#f5f7fa" />
        <rect x="60"  y="60"  width="12"  height="200" fill="#f5f7fa" />
        <rect x="330" y="80"  width="10"  height="180" fill="#f5f7fa" />
        <line x1="0" y1="139" x2="400" y2="139" stroke="#dde3ef" strokeWidth="1" strokeDasharray="12 8" />
        <line x1="148" y1="0" x2="148" y2="340" stroke="#dde3ef" strokeWidth="1" strokeDasharray="12 8" />
        <line x1="267" y1="0" x2="267" y2="340" stroke="#dde3ef" strokeWidth="1" strokeDasharray="12 8" />
        {([
          [20,20,110,100],[170,20,80,100],[270,20,110,100],
          [170,160,70,60],[270,160,110,60],
          [20,255,100,70],[170,255,70,70],[270,255,110,70],
        ] as [number,number,number,number][]).map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#dde3ef" opacity="0.6" />
        ))}
        <rect x="20" y="160" width="100" height="60" rx="3" fill="#c8e6c9" opacity="0.7" />
        <text x="70" y="195" textAnchor="middle" fontSize="9" fill="#4caf50" fontFamily="sans-serif">Park</text>
        <ellipse cx="350" cy="290" rx="55" ry="40" fill="#b3d4f5" opacity="0.5" />
        <text x="225" y="72" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="sans-serif">NORTHSIDE</text>
        <text x="70"  y="72" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="sans-serif">WESTVIEW</text>
        <text x="200" y="143" fontSize="7" fill="#9ca3af" fontFamily="sans-serif">MAIN ST</text>
      </svg>

      {MAP_PINS.map(pin => {
        const isActive = pin.active || selectedPin === pin.id;
        return (
          <button key={pin.id} className={`loc-pin ${isActive ? "loc-pin-active" : ""}`}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            onClick={() => onPinClick(pin.id)} aria-label={`Pin ${pin.id}`}
          >
            <MapPin size={isActive ? 26 : 20} strokeWidth={2.2} fill="currentColor" />
            {isActive && <span className="loc-pin-ring" />}
          </button>
        );
      })}

      <div className="loc-search-bar">
        <Search size={15} color="var(--gray-400)" />
        <span className="loc-search-placeholder">Search study spots…</span>
        <button className="loc-filter-btn" aria-label="Filters"><Filter size={14} /></button>
      </div>

      <button className="loc-locate-btn" aria-label="My location">
        <Navigation size={17} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/* ─── Bottom Sheet ───────────────────────────────────────────────────────────── */
function BottomSheet({ children, expanded, onToggle }: {
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`loc-sheet ${expanded ? "loc-sheet-expanded" : ""}`}>
      <button className="loc-sheet-handle-wrap" onClick={onToggle} aria-label="Toggle sheet">
        <div className="loc-sheet-handle" />
        <ChevronUp size={16} color="var(--gray-400)"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}
        />
      </button>
      {children}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
function Location() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedPlace, setSelectedPlace] = useState<number | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [locating, setLocating] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const t = setTimeout(() => setLocating(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const filtered =
    activeFilter === "All"
      ? NEARBY_PLACES
      : NEARBY_PLACES.filter(p => p.type === activeFilter);

  return (
    <>
      <AppBar onToggle={() => setIsOpen(o => !o)} title="Study Spots" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <div className="loc-wrapper">
        <div className="loc-map-area">
          {locating ? (
            <div className="loc-map-loading">
              <Loader size={28} className="loc-spin" color="var(--blue-600)" />
              <span>Finding your location…</span>
            </div>
          ) : (
            <MapView
              selectedPin={selectedPlace}
              onPinClick={id => { setSelectedPlace(id); setSheetExpanded(false); }}
            />
          )}
        </div>

        <BottomSheet expanded={sheetExpanded} onToggle={() => setSheetExpanded(e => !e)}>
          <div className="loc-sheet-header">
            <div>
              <p className="loc-sheet-title">Nearby Places</p>
              <p className="loc-sheet-sub">{filtered.length} spots found near you</p>
            </div>
            <div className="loc-live-badge">
              <span className="loc-live-dot" />
              Live
            </div>
          </div>

          <div className="loc-filters">
            {FILTERS.map(f => (
              <button key={f}
                className={`loc-filter-pill ${activeFilter === f ? "loc-filter-active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >{f}</button>
            ))}
          </div>

          <div className="loc-place-list">
            {filtered.length === 0 ? (
              <div className="loc-empty">
                <MapPin size={32} color="var(--gray-300)" />
                <p>No spots found for this filter.</p>
              </div>
            ) : (
              filtered.map((place, i) => (
                <PlaceCard key={place.id} place={place} index={i} selected={selectedPlace === place.id}
                  onSelect={id => { setSelectedPlace(id); setSheetExpanded(false); }}
                />
              ))
            )}
          </div>
        </BottomSheet>
      </div>

      <BottomBar />
    </>
  );
}

export default Location;