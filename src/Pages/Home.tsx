import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
import '../components/Formatting.css';
import './Home.css';
=======
import "../style.css";
>>>>>>> Stashed changes
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { Timer, BookOpen, MapPin, CheckSquare, ChevronRight, Flame, Zap } from "lucide-react";

function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [botSub, setBotSub] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [username, setUsername] = useState("");

<<<<<<< Updated upstream
  // Log out navigation
  const navigate = useNavigate();
  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) {
        navigate("/");
      }
=======
  const navigate = useNavigate();
  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
      else setUsername(user.displayName?.split(" ")[0] ?? "");
>>>>>>> Stashed changes
    });
    return () => removeListener();
  }, [navigate]);

<<<<<<< Updated upstream
  // Retrieve subjects needing attention
=======
>>>>>>> Stashed changes
  const getBotSubjects = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
<<<<<<< Updated upstream
      const subjectsRef = collection(db, "users", uid, "Subjects");
      const q = query(subjectsRef, orderBy("TotalStudytime", "asc"), limit(5));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching top subjects: ", error);
    }
  };

  function FormatTime(seconds: number) {
    let time = '';
    if (seconds >= 86400) {
      time = Math.trunc(seconds / 86400) + ' days';
    } else if (seconds >= 3600) {
      time = Math.trunc(seconds / 3600) + ' hours';
    } else if (seconds >= 60) {
      time = Math.trunc(seconds / 60) + ' minutes';
    } else {
      time = seconds + ' seconds';
    }
    return time;
=======
      const q = query(
        collection(db, "users", uid, "Subjects"),
        orderBy("TotalStudytime", "asc"),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(e);
    }
  };

  function formatTime(seconds: number) {
    if (seconds >= 86400) return Math.trunc(seconds / 86400) + " days ago";
    if (seconds >= 3600)  return Math.trunc(seconds / 3600)  + " hours ago";
    if (seconds >= 60)    return Math.trunc(seconds / 60)    + " minutes ago";
    return seconds + " seconds ago";
>>>>>>> Stashed changes
  }

  async function retrieveStreak() {
    const uid = auth.currentUser?.uid;
<<<<<<< Updated upstream
    if (!uid) return;
    
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    const user = snapshot.data();
    return user?.Streak ?? 0;
=======
    if (!uid) return 0;
    const snap = await getDoc(doc(db, "users", uid));
    return snap.data()?.Streak ?? 0;
>>>>>>> Stashed changes
  }

  useEffect(() => {
    retrieveStreak().then((s) => setStreak(s ?? 0));
  }, []);

  useEffect(() => {
<<<<<<< Updated upstream
    const loadData = async () => {
      const data = await getBotSubjects(); 
      if (data) setBotSub(data);
    };
    loadData();
  }, []); // Added empty dependency array to prevent infinite re-renders

  return (
    <div className="home-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Home" />
      <SideBar isOpen={isOpen} />
      
      <main className={`main-content ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* Top 4-Grid Section (s1, s2, s3, s4 placeholders) */}
        <section className="stats-grid">
          <div className="stat-card s1">
            <h4>Daily Goal</h4>
            <p>2/4 Hrs</p>
          </div>
          <div className="stat-card s2">
            <h4>Flashcards</h4>
            <p>45 Due</p>
          </div>
          <div className="stat-card s3">
            <h4>Upcoming</h4>
            <p>2 Exams</p>
          </div>
          <div className="stat-card s4">
            <h4>Accuracy</h4>
            <p>87%</p>
          </div>
        </section>

        {/* Streak Display Section */}
        <section className="streak-container">
          <div className="streak-card">
            <h2>🔥 Current Streak</h2>
            <div className="streak-number">{streak}</div>
            <p>Days in a row. Keep it up!</p>
          </div>
        </section>

        {/* Subjects that need attention */}
        <section className="attention-container">
          <div className="section-header">
            <h2>Needs Your Attention</h2>
            <p>Subjects with the least study time</p>
          </div>
          
          <div className="subjects-list">
            {BotSub.length > 0 ? (
              BotSub.map((item) => (
                <div className="subject-card" key={item.id}>
                  <div className="subject-info">
                    <h3>{item.name || 'Unnamed Subject'}</h3>
                    <span className="time-badge">🕒 {FormatTime(item.TotalStudytime)} total</span>
                  </div>
                  <button className="action-btn">Study Now</button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Loading subjects or you're all caught up!</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <BottomBar/>
=======
    getBotSubjects().then((data) => { if (data) setBotSub(data); });
  }, []);

  const quickActions = [
    { label: "Focus Timer", icon: <Timer size={26} />,   color: "qa-blue",   path: "/timer" },
    { label: "Study Notes", icon: <BookOpen size={26} />, color: "qa-purple", path: "/study/notes" },
    { label: "Find Spots",  icon: <MapPin size={26} />,   color: "qa-green",  path: "/location" },
    { label: "Tasks",       icon: <CheckSquare size={26}/>,color: "qa-orange", path: "/checklist" },
  ];

  return (
    <div className="app-layout">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Home" />
      <SideBar 
      isOpen={isOpen} 
       onClose={() => setIsOpen(false)} 
      />
      <main className="page-content">
        <div className="home-wrapper">

          {/* ── Streak card ── */}
          <div className="home-streak-card">
            <div className="home-streak-top">
              <div>
                <p className="home-streak-label">Daily Streak</p>
                <div className="home-streak-number">
                  <span className="home-streak-count">{streak}</span>
                  <span className="home-streak-unit">days</span>
                </div>
                <p className="home-streak-sub">
                  {streak > 0 ? "Keep it up! You're doing great." : "Start your streak today!"}
                </p>
              </div>
              <div className={`home-streak-badge ${streak > 0 ? "home-streak-badge-on" : ""}`}>
                <Flame size={14} />
                {streak > 0 ? "ON FIRE" : "START"}
              </div>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <section className="home-section">
            <h2 className="home-section-title">Quick Actions</h2>
            <div className="home-qa-grid">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  className={`home-qa-card ${a.color}`}
                  onClick={() => navigate(a.path)}
                >
                  <div className="home-qa-icon">{a.icon}</div>
                  <span className="home-qa-label">{a.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent Activity (lowest study time = needs attention) ── */}
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">Needs Attention</h2>
              <button className="home-view-all" onClick={() => navigate("/study/subjects")}>
                View All
              </button>
            </div>
            <div className="home-activity-list">
              {botSub.length === 0 ? (
                <div className="home-activity-empty">
                  <Zap size={20} />
                  <span>No subjects yet — add some to get started</span>
                </div>
              ) : (
                botSub.map((item) => (
                  <button
                    key={item.id}
                    className="home-activity-row"
                    onClick={() => navigate("/study/subjects")}
                  >
                    <div className="home-activity-icon">
                      <BookOpen size={16} />
                    </div>
                    <div className="home-activity-info">
                      <p className="home-activity-name">{item.name}</p>
                      <p className="home-activity-time">{formatTime(item.TotalStudytime)}</p>
                    </div>
                    <ChevronRight size={16} className="home-activity-chevron" />
                  </button>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      <BottomBar />
>>>>>>> Stashed changes
    </div>
  );
}

export default Home;