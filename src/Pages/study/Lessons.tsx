import { useState, useEffect } from "react";
import { AppBar, BottomBar, SideBar } from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { CreateLesson, DeleteLesson } from "../../config/StudyHandle";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, X, Trash2, FolderOpen, ChevronLeft } from "lucide-react";
import "./Lessons.css";

function Lessons() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Subject Context
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("Loading...");
  const [subjectColor, setSubjectColor] = useState("#2563eb");
  
  // Lessons Data
  const [lessons, setLessons] = useState<any[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState("");

  useEffect(() => {
    const currentSub = localStorage.getItem("CurrentSubject");
    if (!currentSub) {
      navigate("/study/subjects");
      return;
    }
    setSubjectId(currentSub);
    fetchSubjectAndLessons(currentSub);
  }, [navigate]);

  const fetchSubjectAndLessons = async (subId: string) => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // 1. Get Subject Meta (for the title and color theme)
      const subDoc = await getDoc(doc(db, "users", uid, "Subjects", subId));
      if (subDoc.exists()) {
        setSubjectName(subDoc.data().name);
        setSubjectColor(subDoc.data().color || "#2563eb");
      }

      // 2. Get Lessons
      const snapshot = await getDocs(collection(db, "users", uid, "Subjects", subId, "Lessons"));
      const lessonList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort chronologically (oldest to newest is usually best for chapters/lessons)
      lessonList.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setLessons(lessonList);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!newLesson.trim() || !subjectId) return;
    
    try {
      await CreateLesson(subjectId, newLesson.trim());
      setNewLesson("");
      setShowModal(false);
      fetchSubjectAndLessons(subjectId); 
    } catch (error) {
      console.error("Error creating lesson:", error);
    }
  };

  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation(); 
    if (!subjectId) return;

    if (window.confirm("Delete this lesson? All flashcards and notes inside will be lost forever!")) {
      try {
        await DeleteLesson(subjectId, lessonId);
        setLessons(prev => prev.filter(l => l.id !== lessonId));
      } catch (error) {
        console.error("Error deleting lesson:", error);
      }
    }
  };

  const openLesson = (lessonId: string) => {
    // Save the specific lesson we clicked
    localStorage.setItem("CurrentLesson", lessonId);
    // Route to the Flashcards hub for this specific lesson
    navigate(`/study/flashcards`); 
  };

  return (
    <div className="lessons-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Recallica" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="les-main-content">
        
        {/* Navigation Header */}
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={() => navigate('/study/subjects')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft size={18} /> Back to Subjects
          </button>
        </div>

        <div className="les-header-row">
          <div>
            <h1 className="les-title" style={{ color: subjectColor }}>{subjectName}</h1>
            <p className="les-subtitle">Select a lesson to open your study workspace.</p>
          </div>
          <button className="les-add-btn" onClick={() => setShowModal(true)} style={{ backgroundColor: subjectColor }}>
            <Plus size={18} /> Add
          </button>
        </div>

        {loading ? (
          <p className="les-loading">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <div className="les-empty-state">
            <FolderOpen size={48} color={subjectColor} opacity={0.5} />
            <h3>No lessons yet</h3>
            <p>Break down {subjectName} into smaller, manageable topics.</p>
            <button className="les-add-btn-large" onClick={() => setShowModal(true)} style={{ backgroundColor: subjectColor }}>
              <Plus size={18} /> Create First Lesson
            </button>
          </div>
        ) : (
          <div className="les-list">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="les-card" 
                onClick={() => openLesson(lesson.id)}
                style={{ "--theme-color": subjectColor } as React.CSSProperties}
              >
                <div className="les-card-icon">
                  <FolderOpen size={20} color={subjectColor} />
                </div>
                
                <h3 className="les-card-title">{lesson.name}</h3>
                
                <div className="les-card-actions">
                  <button 
                    className="les-delete-btn" 
                    onClick={(e) => handleDeleteLesson(e, lesson.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={20} className="les-chevron" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomBar />

      {/* --- ADD LESSON MODAL --- */}
      {showModal && (
        <div className="les-modal-overlay">
          <div className="les-modal">
            <div className="les-modal-header">
              <h2>New Lesson in {subjectName}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <div className="les-modal-body">
              <label>Lesson / Chapter Name</label>
              <input 
                type="text" 
                placeholder="e.g. Chapter 1, Cell Structure, WWI..." 
                value={newLesson}
                onChange={(e) => setNewLesson(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if(e.key === 'Enter') handleCreateLesson(); }}
              />
            </div>

            <button 
              className="les-create-btn" 
              onClick={handleCreateLesson}
              disabled={!newLesson.trim()}
              style={{ backgroundColor: subjectColor }}
            >
              Create Lesson
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lessons;