import { useEffect, useRef, useState } from "react";
import {SideBar, AppBar, TopBar, BottomBar} from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../../components/Formatting.css';
import { CreateNotes, DeleteNote, UpdateStreak } from "../../config/StudyHandle";
import { collection, doc, getDocs, increment, updateDoc } from "firebase/firestore";

function Notes() {
  const [isOpen, setIsOpen] = useState(true);
  const [Search, setSearch] = useState('');
  const [NotesName, setNotesName] = useState('');
  const [NotesContent, setNotesContent] = useState('');
  const [NotesList, setNotesList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const subid = localStorage.getItem("CurrentSubject");


  // Tracks time
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const secondsRef = useRef(0); 
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);
  const saveAndResetTime = async () => {
    const uid = auth.currentUser?.uid;
    const timeToSave = secondsRef.current;

    if (uid && subid && timeToSave > 0) {
      try {
        const subjectRef = doc(db, "users", uid, "Subjects", subid);
        await updateDoc(subjectRef, {
          TotalStudytime: increment(timeToSave)
        });
        setSeconds(0);
        secondsRef.current = 0;
      } catch (error) {
        console.error("Error updating study time:", error);
      }
    }
  };

  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);

        UpdateStreak();
      }, 1000);
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setIsActive(false);
        saveAndResetTime(); 
      } else {
        setIsActive(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      saveAndResetTime();
    };
  }, [isActive, subid]);

  


  //log out navigation
  const navigate = useNavigate();
  useEffect(() => {
      const removeListener = onAuthStateChanged(auth, (user) => {
        if (!user?.email) {
          navigate("/");
        }
      });
      return () => removeListener();
    }, [navigate]);

  //to display
  useEffect(() => {
    const fetchAllSubjects = async () => {
    if (editingId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (!subid) return;
    const snapshot = await getDocs(collection(db, "users", uid, "Subjects", subid, "Notes"));
          
    const Notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));  
      setNotesList(Notes);
    };
      fetchAllSubjects();
  },);

  //editting the Notes
  const handleLocalChange = (id: string, field: string, value: string) => {
    setNotesList(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const saveToFirebase = async (item: any) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !subid) return;

    const docRef = doc(db, "users", uid, "Subjects", subid, "Notes", item.id); 
    await updateDoc(docRef, {
      name: item.name,
      content: item.content
    });
    setEditingId(null); 
  };


  const Clear = () => {
    setNotesName('');
    setNotesContent('');
  };
  

  //if no subject is selected
  if(subid==null){
    return(
      <>
        <AppBar onToggle={() => setIsOpen(!isOpen)} title="Notes" />
        <SideBar isOpen={isOpen} />
        <TopBar />

        no subject selected

      </>
    )
  } 


  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Notes" />
      <SideBar isOpen={isOpen} />
      <TopBar />
      <input type="text" onChange={(e)=> setNotesName(e.target.value)} placeholder="Note Name" className="s1"/>
      <input type="text" onChange={(e)=> setNotesContent(e.target.value)} placeholder="Note Content" className="s1"/>
      <button onClick={() => {CreateNotes(subid, NotesName, NotesContent); Clear();}} className="s1">Save notes</button>

      <input type="text" placeholder="search" onChange={(e)=> setSearch(e.target.value)} className="s1"/>
      

      {/* Display all Notes */}
      {NotesList.map((item) => {
      if(item.name.startsWith(Search) && Search!=null){
        const isEditing = editingId === item.id;
      return (
        <div key={item.id} className="test" style={{ marginBottom: '10px' }}>
          {/* Display note name */}
          <input
            type="text"
            value={item.name}
            readOnly={!isEditing}
            onChange={(e) => handleLocalChange(item.id, 'name', e.target.value)}
            className="txt-change s2"
            style={{
              color: !isEditing ? '' : 'black',
              display: 'block',
              border: isEditing ? '1px solid blue' : 'none',
              background: isEditing ? 'white' : 'transparent'
            }}
          />
          {/* Display note content */}
          <input
            type="text"
            value={item.content}
            readOnly={!isEditing}
            onChange={(e) => handleLocalChange(item.id, 'content', e.target.value)}
            className="txt-change s1"
            style={{
              color: !isEditing ? '' : 'black',
              display: 'block',
              marginTop: '5px',
              border: isEditing ? '1px solid blue' : 'none',
              background: isEditing ? 'white' : 'transparent'
            }}
          />
                  
          <button onClick={() => {
            if (isEditing) {
              saveToFirebase(item);
            } else {
              setEditingId(item.id);
            }
          }}
          className="s1">
            {isEditing ? "Save" : "Edit"}
            </button>

            <button onClick={() => DeleteNote(subid, item.id)} className="s1">
              Delete
            </button>
        </div>
        );
      }
      })}

      <BottomBar/>
    </>
  )
}

export default Notes
