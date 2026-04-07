import { useEffect, useState, useRef } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import './Timer.css'; 

function Timer() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [sessionDuration, setSessionDuration] = useState(25 * 60); // Tracks how much time to add at the end
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState("Pomodoro");

  // Subject Tracking State
  const [activeSubjectName, setActiveSubjectName] = useState("General Focus");
  const [activeSubjectColor, setActiveSubjectColor] = useState("#64748b");

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

  // --- FETCH ACTIVE SUBJECT ---
  useEffect(() => {
    const fetchSubjectContext = async () => {
      const subId = localStorage.getItem("CurrentSubject");
      const uid = auth.currentUser?.uid;
      if (subId && uid) {
        try {
          const subDoc = await getDoc(doc(db, "users", uid, "Subjects", subId));
          if (subDoc.exists()) {
            setActiveSubjectName(subDoc.data().name);
            setActiveSubjectColor(subDoc.data().color || "#3b82f6");
          }
        } catch (error) {
          console.error("Error fetching subject for timer:", error);
        }
      }
    };
    fetchSubjectContext();
  }, []);

  // --- THE TIME LOGGER ---
  const logStudyTime = async (secondsToAdd: number) => {
    const subId = localStorage.getItem("CurrentSubject");
    const uid = auth.currentUser?.uid;
    
    if (uid && subId && secondsToAdd > 0) {
      try {
        const subRef = doc(db, "users", uid, "Subjects", subId);
        await updateDoc(subRef, {
          TotalStudytime: increment(secondsToAdd)
        });
        console.log(`Successfully logged ${secondsToAdd} seconds to subject!`);
      } catch (error) {
        console.error("Error logging time to database:", error);
      }
    }
  };

  // --- BACKGROUND TIMER SYNC ---
  useEffect(() => {
    const savedPresets = localStorage.getItem("customTimerPresets");
    if (savedPresets) setCustomPresets(JSON.parse(savedPresets));

    const targetTimeStr = localStorage.getItem("timerTargetTime");
    const savedTask = localStorage.getItem("timerTaskName");
    const savedDurationStr = localStorage.getItem("timerDuration");

    if (targetTimeStr && savedDurationStr) {
      const targetTime = parseInt(targetTimeStr, 10);
      const savedDuration = parseInt(savedDurationStr, 10);
      const now = Date.now();
      const remainingSeconds = Math.floor((targetTime - now) / 1000);

      setSessionDuration(savedDuration);

      if (remainingSeconds > 0) {
        setTimeLeft(remainingSeconds);
        setIsActive(true);
        if (savedTask) setCurrentTask(savedTask);
      } else {
        // Timer finished in the background! Log the time automatically.
        logStudyTime(savedDuration);
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
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Timer finished actively on screen!
            logStudyTime(sessionDuration);
            clearTimerStorage();
            setIsActive(false);
            return 0; 
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, sessionDuration]);

  // --- CONTROLS ---
  const toggleTimer = () => {
    if (!isActive) {
      const targetTime = Date.now() + (timeLeft * 1000);
      localStorage.setItem("timerTargetTime", targetTime.toString());
      localStorage.setItem("timerTaskName", currentTask);
      localStorage.setItem("timerDuration", sessionDuration.toString()); // Save duration to know how much to log
    } else {
      clearTimerStorage();
    }
    setIsActive(!isActive);
  };
  
const resetTimer = () => {
    // 1. Calculate how many seconds they actually studied before resetting
    const timeSpent = sessionDuration - timeLeft;
    
    // 2. If they studied for at least 1 second, give them credit!
    if (timeSpent > 0) {
      logStudyTime(timeSpent);
    }

    clearTimerStorage();
    setIsActive(false);
    setTimeLeft(25 * 60);
    setSessionDuration(25 * 60);
    setCurrentTask("Pomodoro");
  };

  const applyPreset = (minutes: number, taskName: string) => {
    // 1. Give them credit for the current session before switching to the new preset
    const timeSpent = sessionDuration - timeLeft;
    if (timeSpent > 0) {
      logStudyTime(timeSpent);
    }

    clearTimerStorage();
    setIsActive(false);
    setTimeLeft(minutes * 60);
    setSessionDuration(minutes * 60);
    setCurrentTask(taskName);
  };

  const clearTimerStorage = () => {
    localStorage.removeItem("timerTargetTime");
    localStorage.removeItem("timerTaskName");
    localStorage.removeItem("timerDuration");
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
      localStorage.setItem("customTimerPresets", JSON.stringify(updatedPresets));
      
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
          
          {/* NEW: Subject Indicator Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${activeSubjectColor}15`, color: activeSubjectColor, padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '16px' }}>
            <BookOpen size={14} /> Tracking for: {activeSubjectName}
          </div>

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