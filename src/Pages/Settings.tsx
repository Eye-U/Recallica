import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../style.css";

function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  useEffect(() => {
    // Load saved dark mode preference on boot
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const navigate = useNavigate();
  
  useEffect(() => {
    // Security redirect if not logged in
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => removeListener();
  }, [navigate]);

  return (
    <>
      <AppBar onToggle={() => setIsOpen(o => !o)} title="Settings" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="page-content">
        <div className="settings-wrapper">

          <section className="settings-section">
            <h2 className="settings-section-title">Appearance</h2>

            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Dark mode</span>
                <span className="settings-row-desc">Switch between light and dark theme</span>
              </div>
              <button
                className={`dm-toggle ${darkMode ? "dm-toggle-on" : ""}`}
                onClick={toggleDark}
                aria-label="Toggle dark mode"
                role="switch"
                aria-checked={darkMode}
              >
                <span className="dm-toggle-icon">{darkMode ? "🌙" : "☀️"}</span>
                <span className="dm-toggle-label">{darkMode ? "On" : "Off"}</span>
              </button>
            </div>
            
          </section>

          {/* Room to add Account / Notifications / Study Preferences later! */}

        </div>
      </main>

      <BottomBar />
    </>
  );
}

export default Settings;