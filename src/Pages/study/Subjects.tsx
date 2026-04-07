import { useState, useEffect } from "react";
// Removed TopBar from imports
import { AppBar, BottomBar, SideBar } from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { createSubject, deleteSubject } from "../../config/StudyHandle";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Plus, Flame, BookOpen, ChevronRight, X, BrainCircuit, FileText, Trash2 } from "lucide-react";
import "./Subjects.css";

function Subjects() {
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6"); 

  const navigate = useNavigate();
  const colorOptions = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    try {
      const snapshot = await getDocs(collection(db, "users", uid, "Subjects"));
      const subjectList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.trim()) return;
    
    try {
      await createSubject(newSubject.trim(), newColor);
      setNewSubject("");
      setShowModal(false);
      fetchSubjects(); 
    } catch (error) {
      console.error("Error creating subject:", error);
    }
  };

  const handleDeleteSubject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (window.confirm("Are you sure? This will delete all notes and flashcards inside this subject!")) {
      try {
        await deleteSubject(id);
        setSubjects(prev => prev.filter(sub => sub.id !== id));
      } catch (error) {
        console.error("Error deleting subject:", error);
      }
    }
  };

  const openSubject = (id: string) => {
    localStorage.setItem("CurrentSubject", id);
    navigate(`/study/lessons`); // Goes straight to the Flashcards hub for this subject
  };

  return (
    <div className="subjects-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Recallica" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="sub-main-content">
        <div className="sub-header-row">
          <div>
            <h1 className="sub-title">My Subjects</h1>
            <p className="sub-subtitle">Select a subject to start active recall.</p>
          </div>
          <button className="sub-add-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New
          </button>
        </div>

        {loading ? (
          <p className="sub-loading">Loading your workspace...</p>
        ) : subjects.length === 0 ? (
          <div className="sub-empty-state">
            <div className="sub-empty-icon">📚</div>
            <h3>No subjects yet</h3>
            <p>Create your first subject to start building your study streaks.</p>
            <button className="sub-add-btn-large" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Create Subject
            </button>
          </div>
        ) : (
          <div className="sub-grid">
            {subjects.map((sub) => (
              <div 
                key={sub.id} 
                className="sub-card" 
                onClick={() => openSubject(sub.id)}
                style={{ borderTopColor: sub.color || "#3b82f6" }}
              >
                <div className="sub-card-header">
                  <div className="sub-icon-box" style={{ backgroundColor: `${sub.color || "#3b82f6"}15`, color: sub.color || "#3b82f6" }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* --- THE UPGRADED FLAME --- */}
                    <div 
                      className="sub-streak" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        color: sub.lastReviewDate === new Date().toDateString() ? '#f97316' : '#cbd5e1',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Flame 
                        size={16} 
                        color={sub.lastReviewDate === new Date().toDateString() ? "#f97316" : "#cbd5e1"} 
                        fill={sub.lastReviewDate === new Date().toDateString() ? "#f97316" : "none"} 
                      />
                      {sub.subjectStreak > 0 && <span>{sub.subjectStreak}</span>}
                    </div>
                    {/* --------------------------- */}
                    <button 
                      className="sub-delete-btn" 
                      onClick={(e) => handleDeleteSubject(e, sub.id)}
                      style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="sub-card-title">{sub.name}</h3>
                
                <div className="sub-card-stats">
                  <span><BrainCircuit size={14}/> Cards</span>
                  <span><FileText size={14}/> Notes</span>
                </div>

                <div className="sub-card-footer">
                  <span>Open workspace</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomBar />

      {/* --- ADD SUBJECT MODAL --- */}
      {showModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal">
            <div className="sub-modal-header">
              <h2>New Subject</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <div className="sub-modal-body">
              <label>Subject Name</label>
              <input 
                type="text" 
                placeholder="e.g. Anatomy, Calculus, History..." 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                autoFocus
              />

              <label>Color Theme</label>
              <div className="sub-color-picker">
                {colorOptions.map(color => (
                  <button 
                    key={color}
                    className={`sub-color-swatch ${newColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>

            <button 
              className="sub-create-btn" 
              onClick={handleCreateSubject}
              disabled={!newSubject.trim()}
              style={{ backgroundColor: newColor }}
            >
              Create Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;