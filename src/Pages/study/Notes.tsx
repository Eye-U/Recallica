import { useState, useEffect } from "react";
import { AppBar, BottomBar, SideBar, TopBar } from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { CreateNotes, DeleteNote } from "../../config/StudyHandle";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Plus, ChevronLeft, Trash2, FileText, X, AlignLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Notes.css";

// Interface for our Notes
interface Note {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

const MAX_CHARS = 10000;

function Notes() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Context States
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [subjectColor, setSubjectColor] = useState("#2563eb");
  const [lessonName, setLessonName] = useState("Loading...");
  
  // Data States
  const [notes, setNotes] = useState<Note[]>([]);

  // Editor Modal States
  const [showEditor, setShowEditor] = useState(false);
  const [activeNoteTitle, setActiveNoteTitle] = useState("");
  const [activeNoteContent, setActiveNoteContent] = useState("");
  const [isViewingOnly, setIsViewingOnly] = useState(false); // If true, hides the "Save" button

  useEffect(() => {
    const currentSub = localStorage.getItem("CurrentSubject");
    const currentLes = localStorage.getItem("CurrentLesson");
    
    if (!currentSub || !currentLes) {
      navigate("/study/subjects");
      return;
    }
    
    setSubjectId(currentSub);
    setLessonId(currentLes);
    fetchNotesData(currentSub, currentLes);
  }, [navigate]);

  const fetchNotesData = async (subId: string, lesId: string) => {
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

      // Get Notes
      const snapshot = await getDocs(collection(db, "users", uid, "Subjects", subId, "Lessons", lesId, "Notes"));
      const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
      
      // Sort newest first
      notesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(notesList);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewEditor = () => {
    setActiveNoteTitle("");
    setActiveNoteContent("");
    setIsViewingOnly(false);
    setShowEditor(true);
  };

  const handleOpenExistingNote = (note: Note) => {
    setActiveNoteTitle(note.name);
    setActiveNoteContent(note.content);
    setIsViewingOnly(true); // Treat as read-only for now, can add edit later
    setShowEditor(true);
  };

  const handleSaveNote = async () => {
    if (!activeNoteTitle.trim() || !activeNoteContent.trim() || !subjectId || !lessonId) return;

    try {
      await CreateNotes(subjectId, lessonId, activeNoteTitle.trim(), activeNoteContent.trim());
      setShowEditor(false);
      fetchNotesData(subjectId, lessonId); // Refresh the list
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!subjectId || !lessonId) return;
    
    if (window.confirm("Delete this note? This cannot be undone.")) {
      try {
        await DeleteNote(subjectId, lessonId, noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  // Format date for the cards
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const charCount = activeNoteContent.length;
  const isNearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <div className="notes-page-container">
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Recallica" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <div className="sub-topbar-wrapper">
        <TopBar />
      </div>

      <main className="nt-main-content">
        
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={() => navigate('/study/lessons')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeft size={18} /> Back to Lessons
          </button>
        </div>

        <div className="nt-header-row">
          <div>
            <h1 className="nt-title">{lessonName} Notes</h1>
            <p className="nt-subtitle">Summarize your learning</p>
          </div>
          <button className="nt-add-btn" onClick={handleOpenNewEditor} style={{ backgroundColor: subjectColor }}>
            <Plus size={18} /> Add Note
          </button>
        </div>

        {loading ? (
          <p className="nt-loading">Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="nt-empty-state">
            <AlignLeft size={48} color={subjectColor} opacity={0.5} />
            <h3>No notes yet!</h3>
            <p>Write down key concepts, formulas, or summaries to help you study.</p>
            <button className="nt-add-btn-large" onClick={handleOpenNewEditor} style={{ backgroundColor: subjectColor }}>
              <Plus size={18} /> Create First Note
            </button>
          </div>
        ) : (
          <div className="nt-grid">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="nt-card" 
                onClick={() => handleOpenExistingNote(note)}
                style={{ borderTopColor: subjectColor }}
              >
                <div className="nt-card-header">
                  <h3 className="nt-card-title">{note.name}</h3>
                  <button className="nt-delete-btn" onClick={(e) => handleDeleteNote(e, note.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Show a preview snippet of the note content */}
                <p className="nt-card-preview">
                  {note.content.substring(0, 100)}...
                </p>
                
                <div className="nt-card-footer">
                  <div className="nt-date"><FileText size={14}/> {formatDate(note.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomBar />

      {/* --- FULL SCREEN EDITOR / READER MODAL --- */}
      {showEditor && (
        <div className="nt-editor-overlay">
          <div className="nt-editor-container">
            <div className="nt-editor-header">
              <input 
                type="text" 
                className="nt-title-input" 
                placeholder="Note Title..." 
                value={activeNoteTitle}
                onChange={(e) => setActiveNoteTitle(e.target.value)}
                readOnly={isViewingOnly}
                autoFocus={!isViewingOnly}
              />
              <button className="nt-close-btn" onClick={() => setShowEditor(false)}><X size={24} /></button>
            </div>
            
            <div className="nt-editor-body">
              <textarea 
                className="nt-content-input"
                placeholder="Start typing your notes here..."
                value={activeNoteContent}
                onChange={(e) => setActiveNoteContent(e.target.value)}
                maxLength={MAX_CHARS}
                readOnly={isViewingOnly}
              />
            </div>
            
            <div className="nt-editor-footer">
              <span className={`nt-char-counter ${isNearLimit ? 'limit-warning' : ''}`}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
              
              {!isViewingOnly && (
                <button 
                  className="nt-save-btn" 
                  onClick={handleSaveNote}
                  disabled={!activeNoteTitle.trim() || !activeNoteContent.trim()}
                  style={{ backgroundColor: subjectColor }}
                >
                  Save Note
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;