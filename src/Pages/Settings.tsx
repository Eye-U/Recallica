import { useEffect, useState } from "react";
import {SideBar, AppBar, BottomBar} from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';

function Settings() {
  const [isOpen, setIsOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem("fontScale");
    return saved ? Number(saved) : 1;
  });

  //toggle
  const toggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  //load font size change
  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", `${scale}`);
    localStorage.setItem("fontScale", `${scale}`);
  }, [scale]);
  //load dark mode changes
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);


  //log out navigation
  const navigate = useNavigate();
  useEffect(() => {
      const removeListener = onAuthStateChanged(auth, (user) => {
        if (!user?.email) {
          navigate("/");
        }
      });
      return () => removeListener();
    }, [navigate]);


  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Settings" />
      <SideBar isOpen={isOpen} />
      {/*font size change */}
      <button onClick={() => setScale((s) => s - 0.1)}>A-</button>
      <button onClick={() => setScale(1)}>Reset</button>
      <button onClick={() => setScale((s) => s + 0.1)}>A+</button>

      {/*light mode/ dark mode */}
      <button onClick={toggleDark}>
        Toggle Dark Mode
      </button>

      <div className="test">
        <p className="s1">test</p>
        <p className="s2">test</p>
        <p className="s3">test</p>
        <p className="s4">test</p>
        <p className="s5">test</p>
      </div>

      <BottomBar/>
    </>
  )
}

export default Settings
