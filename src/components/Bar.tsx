  import { NavLink, useLocation } from "react-router-dom";
  import { auth } from "../config/firebase";
  import { signOut } from "firebase/auth";
  import "./CssBar.css";

  interface SidebarProps {
    isOpen: boolean;
  }

  const logout = async() =>{
      try{
        await signOut(auth);
        localStorage.setItem("CurrentSubject", "")
      } catch(err){
        alert(err);
      }
    }

  export const SideBar = ({ isOpen }: SidebarProps) => {
    const location = useLocation();

    const isOtherActive = location.pathname.startsWith("/study");
    return (
      <aside className={`sidebar ${isOpen ? 'closed' : 'open'}`}>
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink 
            to="/account" 
            className={({ isActive }) =>
              isActive ? "nav-btn-active" : "nav-link"
            }>
              {auth.currentUser?.displayName}
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
            to="/home" 
            className={({ isActive }) =>
              isActive ? "nav-btn-active" : "nav-link"
            }>
              Home
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink 
            to="/timer" 
            className={({ isActive }) =>
              isActive ? "nav-btn-active" : "nav-link"
            }>
              Timer
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink 
            to="/study/Subjects" 
            className={() =>
              isOtherActive  ? "nav-btn-active" : "nav-link"
            }>
              Subjects
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink 
            to="/location" 
            className={({ isActive }) =>
              isActive ? "nav-btn-active" : "nav-link"
            }>
              Location
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink 
            to="/checklist" 
            className={({ isActive }) =>
              isActive ? "nav-btn-active" : "nav-link"
            }>
              Check list
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink 
            to="/Settings" 
            className={({ isActive }) =>
              isActive ? "nav-btn-active" : "nav-link"
            }>
              Settings
            </NavLink>
          </li>

          <li className="nav-item" onClick={logout}>
            <p className="nav-link">Log out</p>
          </li>
        </ul>
      </aside>
    );
  };

  interface AppBarProps {
    onToggle: () => void;
    title: string;
  }

  export const AppBar = ({ onToggle, title }: AppBarProps) => {
    return (
      <header className="app-bar">
        <button className="toggle-btn" onClick={onToggle}>
          ☰
        </button>
        <h1 className="page-title">{title}</h1>
      </header>
    );
  };

  export const TopBar = () => {
    return(
      <div className="top-bar">
        <NavLink
          to="/study/subjects"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Subjects
        </NavLink>

        <NavLink
          to="/study/notes"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Notes
        </NavLink>

        <NavLink
          to="/study/flashcards"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Flashcards
        </NavLink>

      </div>
    )
  }


  export const BottomBar = () => {
    const location = useLocation();

    const isOtherActive = location.pathname.startsWith("/study");
    return(
      <div className="bottom-bar">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/timer"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Timer
        </NavLink>

        <NavLink
          to="/study/subjects"
          className={() =>
            isOtherActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Subjects
        </NavLink>

        <NavLink
          to="/location"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Location
        </NavLink>

        <NavLink
          to="/checklist"
          className={({ isActive }) =>
            isActive ? "top-btn-active" : "top-bar-btn"
          }
        >
          Check List
        </NavLink>

      </div>
    )
  }