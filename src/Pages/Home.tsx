import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';
import './Home.css';
import { collection, doc, getDoc, getDocs, addDoc, orderBy, query } from "firebase/firestore";
import { Flame, Plus, BookOpen, ChevronRight } from "lucide-react";

function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  
  // Real UI States
  const [isStreakActive, setIsStreakActive] = useState(false); 
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const navigate = useNavigate();

  // Retrieve all user subjects
  const getUserSubjects = async (uid: string) => {
    try {
      const subjectsRef = collection(db, "users", uid, "Subjects");
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

  // Retrieve User Data for Global Streak
  const retrieveUserData = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const snapshot = await getDoc(userRef);
      return snapshot.data();
    } catch (error) {
      console.error("Error fetching user data: ", error);
      return null;
    }
  };

  const loadData = async (uid: string) => {
    const [userData, subjectsData] = await Promise.all([
      retrieveUserData(uid),
      getUserSubjects(uid)
    ]);
    
    // Set Streak and calculate if active today
    if (userData) {
      setStreak(userData.Streak || 0);
      const todayStr = new Date().toDateString();
      setIsStreakActive(userData.lastDate === todayStr);
    }

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
        color: "#3b82f6", // Default color so the UI doesn't break
        createdAt: new Date().toISOString()
      });
      
      setNewSubjectName("");
      setIsAddingSubject(false);
      await loadData(auth.currentUser.uid);
    } catch (error) {
      console.error("Error adding subject: ", error);
    }
  };

  // THE ROUTING FIX
  const openSubject = (id: string) => {
    localStorage.setItem("CurrentSubject", id);
    navigate(`/study/lessons`); 
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

  const todayString = new Date().toDateString();

  return (
    <div className="home-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Home" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <main className={`main-content ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* Massive Centered Streak Section */}
        <section className="streak-hero">
          <div className={`flame-wrapper ${isStreakActive ? 'flame-active' : 'flame-inactive'}`} style={{ color: isStreakActive ? '#f97316' : '#cbd5e1' }}>
            <Flame size={120} strokeWidth={1.5} fill={isStreakActive ? '#f97316' : 'none'} />
          </div>
          <div className="streak-info">
            <h1 className="streak-count" style={{ fontSize: '3rem', margin: '10px 0' }}>{streak}</h1>
            <p className="streak-label" style={{ margin: 0, fontWeight: 'bold' }}>Day Streak</p>
            {!isStreakActive && <p className="streak-warning" style={{ color: '#ef4444', marginTop: '8px' }}>Review today to keep your fire lit!</p>}
          </div>
        </section>

        {/* User Subjects Section */}
        <section className="subjects-container" style={{ marginTop: '40px' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Your Subjects</h2>
            {!isAddingSubject && (
              <button 
                className="add-subject-btn" 
                onClick={() => setIsAddingSubject(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <Plus size={18} /> Add Subject
              </button>
            )}
          </div>
          
          {/* Inline Form to Add Subject */}
          {isAddingSubject && (
            <div className="add-subject-form" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Enter subject name..." 
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                autoFocus
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
              />
              <div className="form-actions" style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-save" onClick={handleAddSubject} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                <button className="btn-cancel" onClick={() => setIsAddingSubject(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* THE UPDATED IDENTICAL CARDS */}
          <div className="subjects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {subjects.length > 0 ? (
              subjects.map((sub) => (
                <div 
                  key={sub.id} 
                  className="sub-card" 
                  onClick={() => openSubject(sub.id)}
                  style={{ 
                    background: 'var(--surface, #ffffff)', 
                    borderRadius: '16px', 
                    padding: '20px', 
                    borderTop: `4px solid ${sub.color || "#3b82f6"}`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div className="sub-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sub-icon-box" style={{ backgroundColor: `${sub.color || "#3b82f6"}15`, color: sub.color || "#3b82f6", width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                      <BookOpen size={20} />
                    </div>
                    
                    {/* The Identical Subject Streak Flame */}
                    <div 
                      className="sub-streak" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        color: sub.lastReviewDate === todayString ? '#f97316' : '#cbd5e1',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Flame 
                        size={16} 
                        color={sub.lastReviewDate === todayString ? "#f97316" : "#cbd5e1"} 
                        fill={sub.lastReviewDate === todayString ? "#f97316" : "none"} 
                      />
                      {sub.subjectStreak > 0 && <span>{sub.subjectStreak}</span>}
                    </div>
                  </div>
                  
                  <h3 className="sub-card-title" style={{ margin: '8px 0 0 0', fontSize: '1.2rem', color: 'var(--text-color, #1e293b)' }}>{sub.name || 'Unnamed Subject'}</h3>
                  
                  <span className="time-badge" style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    🕒 {FormatTime(sub.TotalStudytime || 0)} spent
                  </span>

                  <div className="sub-card-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', color: sub.color || '#3b82f6', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <span>Open workspace</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'var(--surface, #ffffff)', borderRadius: '16px', border: '2px dashed #cbd5e1', color: '#64748b' }}>
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