import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';
import './Home.css';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";

function Home() {
  const [isOpen, setIsOpen] = useState(true);
  const [BotSub, setBotSub] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  // Log out navigation
  const navigate = useNavigate();
  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) {
        navigate("/");
      }
    });
    return () => removeListener();
  }, [navigate]);

  // Retrieve subjects needing attention
  const getBotSubjects = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
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
  }

  async function retrieveStreak() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    const user = snapshot.data();
    return user?.Streak ?? 0;
  }

  useEffect(() => {
    const loadStreak = async () => {
      const s = await retrieveStreak();
      setStreak(s ?? 0);
    };
    loadStreak();
  }, []);

  useEffect(() => {
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
    </div>
  );
}

export default Home;