import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './Timer.css'; 

function Timer() {
<<<<<<< Updated upstream
  const [isOpen, setIsOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState("Pomodoro");

  const navigate = useNavigate();

  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) {
        navigate("/");
      }
    });
    return () => removeListener();
  }, [navigate]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setCurrentTask("Pomodoro");
  };

  const applyPreset = (minutes: number, taskName: string) => {
    setIsActive(false);
    setTimeLeft(minutes * 60);
    setCurrentTask(taskName);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Timer" />
      <SideBar isOpen={isOpen} />
      
      <main className={`main-content ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="timer-wrapper">
          <h2 className="task-name">{currentTask}</h2>
          
          <div className="timer-display">
            {formatTime(timeLeft)}
          </div>
          
          <div className="timer-controls">
            <button className="control-btn play-pause" onClick={toggleTimer}>
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button className="control-btn reset" onClick={resetTimer}>
              Reset
            </button>
          </div>

          <div className="presets-container">
            <p>Quick Presets</p>
            <div className="preset-buttons">
              <button onClick={() => applyPreset(30, "Focused Work")}>💻 30m Work</button>
              <button onClick={() => applyPreset(10, "Quick Break")}>☕ 10m Break</button>
              <button onClick={() => applyPreset(15, "Taking a Bath")}>🚿 15m Bath</button>
              <button onClick={() => applyPreset(20, "Eating/Lunch")}>🍱 20m Eat</button>
              <button onClick={() => applyPreset(45, "Deep Study")}>📚 45m Study</button>
            </div>
          </div>
        </div>
      </main>

      <BottomBar/>
    </div>
  )
=======
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => removeListener();
  }, [navigate]);

  return (
    <>
      <AppBar onToggle={() => setIsOpen(o => !o)} title="Timer" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="page-content">
        {/* Timer content here */}
      </main>

      <BottomBar />
    </>
  );
>>>>>>> Stashed changes
}

export default Timer;