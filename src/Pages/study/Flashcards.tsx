import { useState, useEffect } from "react";
import { AppBar, BottomBar, SideBar, TopBar } from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { CreateFlashCard, DeleteFlashCard } from "../../config/StudyHandle"; 
// NEW: Added updateDoc and increment!
import { collection, getDocs, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { Plus, ChevronLeft, ChevronRight, RotateCcw, Trash2, X, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Flashcards.css";

function Flashcards() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Data States
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  
  const [subjectColor, setSubjectColor] = useState("#2563eb");
  const [lessonName, setLessonName] = useState("Loading...");
  const [flashcards, setFlashcards] = useState<any[]>([]);

  // Study UX States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // NEW: The Hidden Stopwatch!
  const [studyStartTime, setStudyStartTime] = useState<number>(0);

  useEffect(() => {
    const currentSub = localStorage.getItem("CurrentSubject");
    const currentLes = localStorage.getItem("CurrentLesson");
    
    if (!currentSub || !currentLes) {
      navigate("/study/subjects"); 
      return;
    }
    
    setSubjectId(currentSub);
    setLessonId(currentLes);
    fetchDeckData(currentSub, currentLes);
  }, [navigate]);

  const fetchDeckData = async (subId: string, lesId: string) => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const subDoc = await getDoc(doc(db, "users", uid, "Subjects", subId));
      if (subDoc.exists()) setSubjectColor(subDoc.data().color || "#2563eb");

      const lesDoc = await getDoc(doc(db, "users", uid, "Subjects", subId, "Lessons", lesId));
      if (lesDoc.exists()) setLessonName(lesDoc.data().name);

      const snapshot = await getDocs(collection(db, "users", uid, "Subjects", subId, "Lessons", lesId, "FlashCards"));
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFlashcards(cards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setLoading(false);
      // NEW: Start the clock the second the cards finish loading!
      setStudyStartTime(Date.now());
    }
  };

  // NEW: The Auto-Logger Function
  const handleExitToLessons = async () => {
    const timeSpentSeconds = Math.floor((Date.now() - studyStartTime) / 1000);
    const uid = auth.currentUser?.uid;

    if (timeSpentSeconds > 0 && subjectId && uid) {
      try {
        const subRef = doc(db, "users", uid, "Subjects", subjectId);
        await updateDoc(subRef, {
          TotalStudytime: increment(timeSpentSeconds)
        });
        console.log(`Auto-logged ${timeSpentSeconds} seconds from Flashcards!`);
      } catch (error) {
        console.error("Error logging flashcard time:", error);
      }
    }
    
    // Finally, actually leave the page
    navigate('/study/lessons');
  };

  const handleAddCard = async () => {
    if (!newQuestion.trim() || !newAnswer.trim() || !subjectId || !lessonId) return;

    try {
      await CreateFlashCard(subjectId, lessonId, newAnswer.trim(), newQuestion.trim());
      setNewQuestion("");
      setNewAnswer("");
      setShowModal(false);
      fetchDeckData(subjectId, lessonId); 
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!subjectId || !lessonId) return;
    if (window.confirm("Delete this flashcard?")) {
      try {
        await DeleteFlashCard(subjectId, lessonId, cardId);
        setFlashcards(prev => prev.filter(c => c.id !== cardId));
        if (currentIndex >= flashcards.length - 1) {
          setCurrentIndex(Math.max(0, flashcards.length - 2));
        }
        setIsFlipped(false);
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150); 
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  return (
    <div className="flashcards-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Recallica" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <div className="sub-topbar-wrapper">
        <TopBar />
      </div>

      <main className="fc-main-content">
        
        <div style={{ marginBottom: '16px' }}>
          {/* UPDATED: Now triggers the save function before leaving! */}
          <button 
            onClick={handleExitToLessons}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft size={18} /> Back to Lessons
          </button>
        </div>

        <div className="fc-header-row">
          <div>
            <h1 className="fc-title">{lessonName} Deck</h1>
            <p className="fc-subtitle">
              {flashcards.length > 0 ? `Card ${currentIndex + 1} of ${flashcards.length}` : "No cards yet."}
            </p>
          </div>
          <button className="fc-add-btn" onClick={() => setShowModal(true)} style={{ backgroundColor: subjectColor }}>
            <Plus size={18} /> Add Card
          </button>
        </div>

        {loading ? (
          <p className="fc-loading">Loading deck...</p>
        ) : flashcards.length === 0 ? (
          <div className="fc-empty-state">
            <Brain size={48} color={subjectColor} opacity={0.5} />
            <h3>Your deck is empty!</h3>
            <p>Active recall is the best way to study. Add some question/answer pairs to get started.</p>
            <button className="fc-add-btn-large" onClick={() => setShowModal(true)} style={{ backgroundColor: subjectColor }}>
              <Plus size={18} /> Create First Card
            </button>
          </div>
        ) : (
          <div className="fc-study-arena" style={{ "--theme-color": subjectColor } as React.CSSProperties}>
            
            <div className={`fc-card-container ${isFlipped ? "is-flipped" : ""}`} onClick={() => setIsFlipped(!isFlipped)}>
              <div className="fc-card-front">
                <span className="fc-card-label">QUESTION</span>
                <h2 className="fc-card-text">{flashcards[currentIndex]?.question}</h2>
                <div className="fc-card-hint"><RotateCcw size={14} /> Tap to flip</div>
              </div>

              <div className="fc-card-back">
                <span className="fc-card-label answer-label">ANSWER</span>
                <h2 className="fc-card-text">{flashcards[currentIndex]?.answer}</h2>
                <button className="fc-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCard(flashcards[currentIndex].id); }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="fc-controls">
              <button className="fc-nav-btn" onClick={prevCard} disabled={currentIndex === 0}>
                <ChevronLeft size={24} />
              </button>
              <div className="fc-progress-bar">
                <div className="fc-progress-fill" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} />
              </div>
              <button className="fc-nav-btn" onClick={nextCard} disabled={currentIndex === flashcards.length - 1}>
                <ChevronRight size={24} />
              </button>
            </div>

          </div>
        )}
      </main>

      <BottomBar />

      {/* --- ADD FLASHCARD MODAL --- */}
      {showModal && (
        <div className="fc-modal-overlay">
          <div className="fc-modal">
            <div className="fc-modal-header">
              <h2>New Flashcard</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <div className="fc-modal-body">
              <label>Question (Front)</label>
              <textarea 
                placeholder="What is the powerhouse of the cell?" 
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                autoFocus
                rows={3}
              />

              <label>Answer (Back)</label>
              <textarea 
                placeholder="Mitochondria" 
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={3}
              />
            </div>

            <button 
              className="fc-create-btn" 
              onClick={handleAddCard}
              disabled={!newQuestion.trim() || !newAnswer.trim()}
              style={{ backgroundColor: subjectColor }}
            >
              Add to Deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcards;