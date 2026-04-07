import { useEffect, useState, useRef } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './Timer.css'; 

function Timer() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState("Pomodoro");

// We use a ref for the interval so we can clear it safely anywhere
  const intervalRef = useRef<number | null>(null);

  // Custom Preset States
  const [customPresets, setCustomPresets] = useState<{time: number, name: string, emoji: string}[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTime, setCustomTime] = useState<number | "">("");
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => removeListener();
  }, [navigate]);

  // --- BACKGROUND TIMER SYNC ---
  useEffect(() => {
    // 1. Load saved presets so they don't disappear on refresh!
    const savedPresets = localStorage.getItem("customTimerPresets");
    if (savedPresets) setCustomPresets(JSON.parse(savedPresets));

    // 2. Check if a timer was running in the background
    const targetTimeStr = localStorage.getItem("timerTargetTime");
    const savedTask = localStorage.getItem("timerTaskName");

    if (targetTimeStr) {
      const targetTime = parseInt(targetTimeStr, 10);
      const now = Date.now();
      const remainingSeconds = Math.floor((targetTime - now) / 1000);

      if (remainingSeconds > 0) {
        // Resume the timer seamlessly
        setTimeLeft(remainingSeconds);
        setIsActive(true);
        if (savedTask) setCurrentTask(savedTask);
      } else {
        // Timer finished while we were away!
        clearTimerStorage();
        setTimeLeft(0);
        setIsActive(false);
        if (savedTask) setCurrentTask(savedTask);
      }
    }
  }, []);

  // --- THE TICKING CLOCK ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearTimerStorage();
            setIsActive(false);
            return 0; // Timer hits zero!
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  // --- CONTROLS ---

  const toggleTimer = () => {
    if (!isActive) {
      // STARTING: Save the target end time to local storage
      const targetTime = Date.now() + (timeLeft * 1000);
      localStorage.setItem("timerTargetTime", targetTime.toString());
      localStorage.setItem("timerTaskName", currentTask);
    } else {
      // PAUSING: Clear the target time so it stops counting down in the background
      clearTimerStorage();
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    clearTimerStorage();
    setIsActive(false);
    setTimeLeft(25 * 60);
    setCurrentTask("Pomodoro");
  };

  const applyPreset = (minutes: number, taskName: string) => {
    clearTimerStorage();
    setIsActive(false);
    setTimeLeft(minutes * 60);
    setCurrentTask(taskName);
  };

  const clearTimerStorage = () => {
    localStorage.removeItem("timerTargetTime");
    localStorage.removeItem("timerTaskName");
  };

  // --- CUSTOM PRESETS ---

  const saveCustomPreset = () => {
    if (customTime !== "" && Number(customTime) > 0 && customName.trim() !== "") {
      const newPreset = { 
        time: Number(customTime), 
        name: customName, 
        emoji: customEmoji || "⏱️" 
      };
      
      const updatedPresets = [...customPresets, newPreset];
      setCustomPresets(updatedPresets);
      localStorage.setItem("customTimerPresets", JSON.stringify(updatedPresets)); // Save permanently!
      
      setIsAddingCustom(false);
      setCustomTime("");
      setCustomName("");
      setCustomEmoji("");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Timer" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
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
            
            {isAddingCustom ? (
              <div className="custom-preset-form">
                <input 
                  className="input-emoji" 
                  value={customEmoji} 
                  onChange={e => setCustomEmoji(e.target.value)} 
                  placeholder="✨"
                  maxLength={2}
                />
                <input 
                  className="input-time" 
                  type="number" 
                  value={customTime} 
                  onChange={e => setCustomTime(e.target.value === "" ? "" : Number(e.target.value))} 
                  placeholder="Min"
                />
                <input 
                  className="input-name" 
                  value={customName} 
                  onChange={e => setCustomName(e.target.value)} 
                  placeholder="e.g. Code Review"
                />
                <div className="form-actions">
                  <button className="btn-save" onClick={saveCustomPreset}>Save</button>
                  <button className="btn-cancel" onClick={() => setIsAddingCustom(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="preset-buttons">
                <button onClick={() => applyPreset(30, "Focused Work")}>💻 30m Work</button>
                <button onClick={() => applyPreset(10, "Quick Break")}>☕ 10m Break</button>
                <button onClick={() => applyPreset(15, "Taking a Bath")}>🚿 15m Bath</button>
                <button onClick={() => applyPreset(20, "Eating/Lunch")}>🍱 20m Eat</button>
                <button onClick={() => applyPreset(45, "Deep Study")}>📚 45m Study</button>
                
                {customPresets.map((preset, index) => (
                  <button key={index} onClick={() => applyPreset(preset.time, preset.name)}>
                    {preset.emoji} {preset.time}m {preset.name}
                  </button>
                ))}
                
                <button className="add-custom-btn" onClick={() => setIsAddingCustom(true)}>
                  ➕ Add Custom
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomBar/>
    </div>
  )
}

export default Timer;