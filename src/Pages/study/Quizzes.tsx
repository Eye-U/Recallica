import { useState, useEffect } from "react";
import { AppBar, BottomBar, SideBar, TopBar } from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { UpdateStreak } from "../../config/StudyHandle"; 
import { collection, getDocs, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { ChevronLeft, Brain, CheckCircle, XCircle, RefreshCcw, Flame, Wand2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Quizzes.css";

// Interfaces for our new setup
interface Flashcard { id: string; question: string; answer: string; }
interface QuizDraft { id: string; question: string; correctAnswer: string; fakes: string[]; }
interface ActiveQuestion { question: string; correctAnswer: string; options: string[]; }

function Quizzes() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Context
  const [subjectColor, setSubjectColor] = useState("#2563eb");
  const [lessonName, setLessonName] = useState("Loading...");
  
  // Data
  const [rawCards, setRawCards] = useState<Flashcard[]>([]);
  const [quizDraft, setQuizDraft] = useState<QuizDraft[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<ActiveQuestion[]>([]);
  
  // App Phase: 'setup' | 'playing' | 'results'
  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup');
  
  // Playing State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);

  useEffect(() => {
    // Grab BOTH IDs to point to the specific lesson
    const currentSub = localStorage.getItem("CurrentSubject");
    const currentLes = localStorage.getItem("CurrentLesson");
    
    if (!currentSub || !currentLes) {
      navigate("/study/subjects");
      return;
    }
    fetchFlashcards(currentSub, currentLes);
  }, [navigate]);

  const fetchFlashcards = async (subId: string, lesId: string) => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // Get Subject Color
      const subDoc = await getDoc(doc(db, "users", uid, "Subjects", subId));
      if (subDoc.exists()) setSubjectColor(subDoc.data().color || "#2563eb");

      // Get Lesson Name
      const lesDoc = await getDoc(doc(db, "users", uid, "Subjects", subId, "Lessons", lesId));
      if (lesDoc.exists()) setLessonName(lesDoc.data().name);

      // Fetch Flashcards from this exact lesson
      const snapshot = await getDocs(collection(db, "users", uid, "Subjects", subId, "Lessons", lesId, "FlashCards"));
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Flashcard[];
      
      setRawCards(cards);

      // Initialize the Draft Board (empty fakes by default)
      const initialDraft = cards.map(c => ({
        id: c.id,
        question: c.question,
        correctAnswer: c.answer,
        fakes: ["", "", ""]
      }));
      setQuizDraft(initialDraft);

    } catch (error) {
      console.error("Error fetching for quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  // THE AUTO-GENERATOR TOOL
  const autoFillFakes = () => {
    const updatedDraft = quizDraft.map(draftItem => {
      // Find all OTHER flashcards to steal answers from
      const otherCards = rawCards.filter(c => c.id !== draftItem.id);
      const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
      
      // Grab up to 3 fake answers
      const newFakes = [
        shuffledOthers[0]?.answer || "Fake A",
        shuffledOthers[1]?.answer || "Fake B",
        shuffledOthers[2]?.answer || "Fake C",
      ];

      return { ...draftItem, fakes: newFakes };
    });
    setQuizDraft(updatedDraft);
  };

  // Manual Input Handler
  const handleFakeChange = (draftId: string, fakeIndex: number, value: string) => {
    setQuizDraft(prev => prev.map(d => {
      if (d.id === draftId) {
        const newFakes = [...d.fakes];
        newFakes[fakeIndex] = value;
        return { ...d, fakes: newFakes };
      }
      return d;
    }));
  };

  // Start the Quiz!
  const startQuiz = () => {
    // Make sure no inputs are empty
    const isReady = quizDraft.every(d => d.fakes.every(f => f.trim() !== ""));
    if (!isReady) {
      alert("Please fill in all fake answers, or use the Auto-Fill button!");
      return;
    }

    // Combine and shuffle the options for the actual game
    const finalizedQuestions = quizDraft.map(draft => {
      const allOptions = [draft.correctAnswer, ...draft.fakes].sort(() => 0.5 - Math.random());
      return {
        question: draft.question,
        correctAnswer: draft.correctAnswer,
        options: allOptions
      };
    });

    // Shuffle the question order too
    const shuffledExam = finalizedQuestions.sort(() => 0.5 - Math.random());

    setActiveQuestions(shuffledExam);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setPhase('playing');
    setQuizStartTime(Date.now()); 
  };

  const handleSelectOption = (option: string) => {
    if (selectedAnswer !== null) return; 
    setSelectedAnswer(option);
    if (option === activeQuestions[currentIndex].correctAnswer) setScore(prev => prev + 1);
  };

const nextQuestion = async () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      const currentSub = localStorage.getItem("CurrentSubject");
      const uid = auth.currentUser?.uid;
      
      try {
        if (currentSub && uid) {
          // 1. Update the Streak
          await UpdateStreak(currentSub);

          // 2. Calculate time spent and send to Firebase!
          const timeSpentSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
          
          if (timeSpentSeconds > 0) {
            const subRef = doc(db, "users", uid, "Subjects", currentSub);
            await updateDoc(subRef, {
              TotalStudytime: increment(timeSpentSeconds)
            });
            console.log(`Auto-logged ${timeSpentSeconds} seconds from Quiz!`);
          }
        }
      } catch (error) {
        console.error("Error saving quiz results:", error);
      } finally {
        setPhase('results');
      }
    }
  };

  return (
    <div className="quiz-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Recallica" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div className="sub-topbar-wrapper"><TopBar /></div>

      <main className="quiz-main-content">
        
        {/* Navigation Header */}
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={() => navigate('/study/lessons')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft size={18} /> Back to Lessons
          </button>
        </div>

        <div className="quiz-header-row">
          <div>
            <h1 className="quiz-title">{lessonName} Quiz</h1>
            <p className="quiz-subtitle">
              {phase === 'setup' && "Build your exam"}
              {phase === 'playing' && `Question ${currentIndex + 1} of ${activeQuestions.length}`}
              {phase === 'results' && "Exam Complete"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="quiz-loading">Loading workspace...</p>
        ) : rawCards.length < 4 ? (
          <div className="quiz-empty-state">
            <Brain size={48} color={subjectColor} opacity={0.5} />
            <h3>Not enough cards!</h3>
            <p>You need at least <strong>4 flashcards</strong> in this lesson to build a multiple-choice quiz.</p>
            <button className="quiz-btn-primary" onClick={() => navigate('/study/flashcards')} style={{ backgroundColor: subjectColor }}>
              Go to Flashcards
            </button>
          </div>
        ) : phase === 'setup' ? (
          
          /* --- PHASE 1: QUIZ BUILDER --- */
          <div className="quiz-builder-container">
            <div className="quiz-builder-toolbar">
              <p>Type your own fake answers, or let Recallica generate them.</p>
              <button className="quiz-magic-btn" onClick={autoFillFakes} style={{ color: subjectColor, borderColor: subjectColor }}>
                <Wand2 size={16} /> Auto-Fill All
              </button>
            </div>

            <div className="quiz-builder-list">
              {quizDraft.map((draft, idx) => (
                <div key={draft.id} className="quiz-builder-card" style={{ borderLeftColor: subjectColor }}>
                  <div className="qb-question-row">
                    <span className="qb-num">{idx + 1}.</span>
                    <strong>{draft.question}</strong>
                  </div>
                  <div className="qb-answer-row correct">
                    <CheckCircle size={16} color="#10b981"/> {draft.correctAnswer}
                  </div>
                  
                  <div className="qb-fakes-grid">
                    {draft.fakes.map((fakeVal, fIdx) => (
                      <input 
                        key={fIdx}
                        type="text" 
                        placeholder={`Fake Answer ${fIdx + 1}`}
                        value={fakeVal}
                        onChange={(e) => handleFakeChange(draft.id, fIdx, e.target.value)}
                        className="qb-fake-input"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="quiz-btn-primary play-btn" onClick={startQuiz} style={{ backgroundColor: subjectColor }}>
              <Play size={18} fill="white" /> Start Quiz
            </button>
          </div>

        ) : phase === 'playing' ? (
          
          /* --- PHASE 2: ACTIVE QUIZ --- */
          <div className="quiz-arena" style={{ "--theme-color": subjectColor } as React.CSSProperties}>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${((currentIndex) / activeQuestions.length) * 100}%`, backgroundColor: subjectColor }} />
            </div>

            <div className="quiz-question-box">
              <h2>{activeQuestions[currentIndex]?.question}</h2>
            </div>

            <div className="quiz-options-grid">
              {activeQuestions[currentIndex]?.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === activeQuestions[currentIndex].correctAnswer;
                const showStatus = selectedAnswer !== null; 

                let statusClass = "";
                if (showStatus) {
                  if (isCorrect) statusClass = "correct";
                  else if (isSelected) statusClass = "wrong";
                  else statusClass = "disabled";
                }

                return (
                  <button 
                    key={idx}
                    className={`quiz-option-btn ${statusClass}`}
                    onClick={() => handleSelectOption(option)}
                    disabled={showStatus}
                  >
                    <span>{option}</span>
                    {showStatus && isCorrect && <CheckCircle size={20} color="#10b981" />}
                    {showStatus && isSelected && !isCorrect && <XCircle size={20} color="#ef4444" />}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <button className="quiz-next-btn" onClick={nextQuestion} style={{ backgroundColor: subjectColor }}>
                {currentIndex === activeQuestions.length - 1 ? "View Results" : "Next Question"}
              </button>
            )}
          </div>

        ) : (

          /* --- PHASE 3: RESULTS --- */
          <div className="quiz-results-card" style={{ "--theme-color": subjectColor } as React.CSSProperties}>
            <div className="quiz-results-icon"><Flame size={48} color="#f97316" fill="#f97316" /></div>
            <h2>Quiz Complete!</h2>
            <div className="quiz-score-circle">
              <span className="quiz-score-number">{Math.round((score / activeQuestions.length) * 100)}%</span>
            </div>
            <p>You scored {score} out of {activeQuestions.length}. Streak updated!</p>
            
            <button className="quiz-btn-primary" onClick={() => setPhase('setup')} style={{ backgroundColor: subjectColor }}>
              <RefreshCcw size={18} /> Rebuild Quiz
            </button>
          </div>
        )}
      </main>
      <BottomBar />
    </div>
  );
}

export default Quizzes;