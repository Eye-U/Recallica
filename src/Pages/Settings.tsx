import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../style.css";

function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? Number(saved) : 1;
  });

  const toggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", `${scale}`);
    localStorage.setItem("fontScale", `${scale}`);
  }, [scale]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const navigate = useNavigate();
  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => removeListener();
  }, [navigate]);

  const fontPercent = Math.round(scale * 100);
  const sliderValue = Math.round(((scale - 0.7) / 0.8) * 100);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    const newScale = parseFloat((0.7 + (pct / 100) * 0.8).toFixed(2));
    setScale(newScale);
  };

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

            <div className="settings-row settings-row-col">
              <div className="settings-row-info">
                <span className="settings-row-label">Font size</span>
                <span className="settings-row-desc">Drag to adjust text size across the app</span>
              </div>
              <div className="font-slider-control">
                <span className="font-slider-a-small">A</span>
                <div className="font-slider-track-wrap">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sliderValue}
                    onChange={handleSlider}
                    className="font-slider"
                    style={{ ["--slider-pct" as any]: `${sliderValue}%` }}
                    aria-label="Font size"
                  />
                </div>
                <span className="font-slider-a-large">A</span>
                <span className="font-slider-badge">{fontPercent}%</span>
                <button className="reset-btn" onClick={() => setScale(1)}>Reset</button>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-section-title">Preview</h2>
            <div className="preview-card">
              <p className="s1">Heading — Large</p>
              <p className="s2">Subheading — Medium</p>
              <p className="s3">Body text — Regular</p>
              <p className="s4">Caption — Small</p>
              <p className="s5">Label — Extra small</p>
            </div>
          </section>

        </div>
      </main>

      <BottomBar />
    </>
  );
}

export default Settings;