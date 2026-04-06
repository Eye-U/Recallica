import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';
import './Home.css';
import { collection, doc, getDoc, getDocs, addDoc, orderBy, query } from "firebase/firestore";
import { Flame, Plus, BookOpen } from "lucide-react";

function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  
  // New States for UI and Adding Subjects
  const [isStreakActive, setIsStreakActive] = useState(true); // TODO: Tie this to actual daily review logic
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const navigate = useNavigate();

  // Retrieve all user subjects
  const getUserSubjects = async (uid: string) => {
    try {
      const subjectsRef = collection(db, "users", uid, "Subjects");
      // Removed the limit so we can see all subjects
      const q = query(subjectsRef, orderBy("TotalStudytime", "asc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching subjects: ", error);
      return [];
    }
  };

  async function retrieveStreak(uid: string) {
    try {
      const userRef = doc(db, "users", uid);
      const snapshot = await getDoc(userRef);
      const user = snapshot.data();
      return user?.Streak ?? 0;
    } catch (error) {
      console.error("Error fetching streak: ", error);
      return 0;
    }
  }

  const loadData = async (uid: string) => {
    const [streakData, subjectsData] = await Promise.all([
      retrieveStreak(uid),
      getUserSubjects(uid)
    ]);
    setStreak(streakData);
    if (subjectsData) setSubjects(subjectsData);
  };

  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
      } else {
        await loadData(user.uid);
      }
    });
    
    return () => removeListener();
  }, [navigate]);

  // Function to add a new subject to Firebase
  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !auth.currentUser) return;

    try {
      const subjectsRef = collection(db, "users", auth.currentUser.uid, "Subjects");
      await addDoc(subjectsRef, {
        name: newSubjectName,
        TotalStudytime: 0,
        createdAt: new Date()
      });
      
      // Reset form and reload list
      setNewSubjectName("");
      setIsAddingSubject(false);
      await loadData(auth.currentUser.uid);
    } catch (error) {
      console.error("Error adding subject: ", error);
    }
  };

  function FormatTime(seconds: number) {
    if (!seconds) return "0 mins";
    let time = '';
    if (seconds >= 86400) {
      time = Math.trunc(seconds / 86400) + ' days';
    } else if (seconds >= 3600) {
      time = Math.trunc(seconds / 3600) + ' hours';
    } else if (seconds >= 60) {
      time = Math.trunc(seconds / 60) + ' mins';
    } else {
      time = seconds + ' secs';
    }
    return time;
  }

  return (
    <div className="home-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Home" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <main className={`main-content ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* Massive Centered Streak Section */}
        <section className="streak-hero">
          <div className={`flame-wrapper ${isStreakActive ? 'flame-active' : 'flame-inactive'}`}>
            <Flame size={120} strokeWidth={1.5} />
          </div>
          <div className="streak-info">
            <h1 className="streak-count">{streak}</h1>
            <p className="streak-label">Day Streak</p>
            {!isStreakActive && <p className="streak-warning">Review today to keep your fire lit!</p>}
          </div>
        </section>

        {/* User Subjects Section */}
        <section className="subjects-container">
          <div className="section-header">
            <h2>Your Subjects</h2>
            {!isAddingSubject && (
              <button className="add-subject-btn" onClick={() => setIsAddingSubject(true)}>
                <Plus size={18} /> Add Subject
              </button>
            )}
          </div>
          
          {/* Inline Form to Add Subject */}
          {isAddingSubject && (
            <div className="add-subject-form">
              <input 
                type="text" 
                placeholder="Enter subject name..." 
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                autoFocus
              />
              <div className="form-actions">
                <button className="btn-save" onClick={handleAddSubject}>Save</button>
                <button className="btn-cancel" onClick={() => setIsAddingSubject(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="subjects-grid">
            {subjects.length > 0 ? (
              subjects.map((item) => (
                <div className="subject-card" key={item.id}>
                  <div className="subject-icon">
                    <BookOpen size={24} />
                  </div>
                  <div className="subject-info">
                    <h3>{item.name || 'Unnamed Subject'}</h3>
                    <span className="time-badge">🕒 {FormatTime(item.TotalStudytime || 0)} spent</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No subjects found. Create one to get started!</p>
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