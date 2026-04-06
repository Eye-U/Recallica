import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './Timer.css'; 

function Timer() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState("Pomodoro");

  // State for Custom Presets
  const [customPresets, setCustomPresets] = useState<{time: number, name: string, emoji: string}[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  
  // FIXED: Set initial states to empty so placeholders actually show up
  const [customTime, setCustomTime] = useState<number | "">("");
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

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

  const saveCustomPreset = () => {
    if (customTime !== "" && Number(customTime) > 0 && customName.trim() !== "") {
      setCustomPresets([...customPresets, { 
        time: Number(customTime), 
        name: customName, 
        emoji: customEmoji || "⏱️" // Fallback if they leave emoji blank
      }]);
      setIsAddingCustom(false);
      
      // Reset form fields back to empty for the next time
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
                
                {/* Render User's Custom Presets */}
                {customPresets.map((preset, index) => (
                  <button key={index} onClick={() => applyPreset(preset.time, preset.name)}>
                    {preset.emoji} {preset.time}m {preset.name}
                  </button>
                ))}
                
                {/* Add Custom Button */}
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