import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import "./CssBar.css";
import {
  Home, Timer, BookOpen, MapPin, CheckSquare,
  Settings, User, LogOut, X, AlignJustify
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppBarProps {
  onToggle: () => void;
  title: string;
}

const logout = async () => {
  try {
    await signOut(auth);
    localStorage.setItem("CurrentSubject", "");
  } catch (err) {
    alert(err);
  }
};

export const SideBar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const isOtherActive = location.pathname.startsWith("/study");

  const navItems = [
    { to: "/account",        label: auth.currentUser?.displayName ?? "Account", icon: User,        exact: true },
    { to: "/home",           label: "Home",       icon: Home,        exact: true },
    { to: "/timer",          label: "Timer",      icon: Timer,       exact: true },
    { to: "/study/Subjects", label: "Subjects",   icon: BookOpen,    exact: false, forceActive: isOtherActive },
    { to: "/location",       label: "Location",   icon: MapPin,      exact: true },
    { to: "/checklist",      label: "Check List", icon: CheckSquare, exact: true },
    { to: "/Settings",       label: "Settings",   icon: Settings,    exact: true },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <span className="sidebar-brand">Recallica</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map(({ to, label, icon: Icon, exact, forceActive }) => (
              <li key={to} className="nav-item">
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    (forceActive !== undefined ? forceActive : isActive)
                      ? "nav-link nav-link-active"
                      : "nav-link"
                  }
                  end={exact}
                >
                  <span className="nav-link-icon"><Icon size={18} strokeWidth={1.8} /></span>
                  <span className="nav-link-label">{label}</span>
                </NavLink>
              </li>
            ))}

            <li className="nav-item nav-item-logout">
              <button className="nav-link nav-link-logout" onClick={() => { logout(); onClose(); }}>
                <span className="nav-link-icon"><LogOut size={18} strokeWidth={1.8} /></span>
                <span className="nav-link-label">Log out</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export const AppBar = ({ onToggle, title }: AppBarProps) => {
  return (
    <header className="app-bar">
      <button className="toggle-btn" onClick={onToggle} aria-label="Open menu">
        <AlignJustify size={22} strokeWidth={1.8} />
      </button>
      <h1 className="page-title">{title}</h1>
    </header>
  );
};

export const TopBar = () => {
  return (
    <div className="top-bar">
      <NavLink to="/study/subjects" className={({ isActive }) => isActive ? "top-btn top-btn-active" : "top-btn"}>Subjects</NavLink>
      <NavLink to="/study/notes"    className={({ isActive }) => isActive ? "top-btn top-btn-active" : "top-btn"}>Notes</NavLink>
      <NavLink to="/study/flashcards" className={({ isActive }) => isActive ? "top-btn top-btn-active" : "top-btn"}>Flashcards</NavLink>
    </div>
  );
};

export const BottomBar = () => {
  const location = useLocation();
  const isOtherActive = location.pathname.startsWith("/study");

  const items = [
    { to: "/home",           label: "Home",     icon: Home        },
    { to: "/timer",          label: "Timer",    icon: Timer       },
    { to: "/study/subjects", label: "Notes",    icon: BookOpen,   forceActive: isOtherActive },
    { to: "/location",       label: "Location", icon: MapPin      },
    { to: "/checklist",      label: "To-Do",    icon: CheckSquare },
  ];

  return (
    <nav className="bottom-bar">
      {items.map(({ to, label, icon: Icon, forceActive }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            (forceActive !== undefined ? forceActive : isActive)
              ? "bottom-tab bottom-tab-active"
              : "bottom-tab"
          }
        >
          <span className="bottom-tab-icon"><Icon size={22} strokeWidth={1.8} /></span>
          <span className="bottom-tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};