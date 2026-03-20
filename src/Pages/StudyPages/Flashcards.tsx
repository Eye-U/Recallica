import { useEffect, useRef, useState } from "react";
import {SideBar, AppBar, TopBar, BottomBar} from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../../components/Formatting.css';
import { CreateFlashCard, DeleteFlashCard, UpdateStreak } from "../../config/StudyHandle";
import { collection, doc, getDocs, increment, updateDoc } from "firebase/firestore";

function Flashcards() {
  const [isOpen, setIsOpen] = useState(true);
  const [Term, setTerm]  = useState('');
  const [Definition, setDefinition]  = useState('');
  const [FlashCards, setFlashCards] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
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
          
          if(seconds>60){
            UpdateStreak();
          }
        }, 1000 );
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
      const fetchAllFC = async () => {
      if (editingId) return;
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      if (!subid) return;
      const snapshot = await getDocs(collection(db, "users", uid, "Subjects", subid, "FlashCards"));
            
      const FC = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));  
        setFlashCards(FC);
      };
        fetchAllFC();
    },);
  
    const handleLocalChange = (id: string, field: string, value: string) => {
      setFlashCards(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
    };
  
    const saveToFirebase = async (item: any) => {
      const uid = auth.currentUser?.uid;
      if (!uid || !subid) return;
  
      const docRef = doc(db, "users", uid, "Subjects", subid, "FlashCards", item.id); 
      await updateDoc(docRef, {
        answer: item.answer,
        question: item.question,
      });
      setEditingId(null); 
    };

    const toggleCard = (id: any) => {
      setShowAnswer(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };

    const Clear = () => {
      setTerm('');
      setDefinition('');
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
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Flashcards" />
      <SideBar isOpen={isOpen} />
      <TopBar />

      <input type="text" onChange={(e)=> setTerm(e.target.value)} placeholder="Term " className="s1"/>
      <input type="text" onChange={(e)=> setDefinition(e.target.value)} placeholder="Definition" className="s1"/>
      <button onClick={() => {CreateFlashCard(subid, Term, Definition); Clear();}} className="s1">Create Flashcard</button>

      {/* Display all Notes */}
      {FlashCards.map((item) => {
        const isEditing = editingId === item.id;
        const isAnswerShown = showAnswer[item.id];

        return (
          <div key={item.id} className="test" style={{ marginBottom: '10px' }}>

            {/* Show ONLY one side */}
            {isAnswerShown ? (
              <input
                type="text"
                value={item.answer}
                readOnly={!isEditing}
                onChange={(e) =>
                  handleLocalChange(item.id, 'answer', e.target.value)
                }
                className="txt-change s1"
                style={{
                  border: isEditing ? '1px solid blue' : 'none',
                  background: isEditing ? 'white' : 'transparent'
                }}
              />
            ) : (
              <input
                type="text"
                value={item.question}
                readOnly={!isEditing}
                onChange={(e) =>
                  handleLocalChange(item.id, 'question', e.target.value)
                }
                className="txt-change s1"
                style={{
                  border: isEditing ? '1px solid blue' : 'none',
                  background: isEditing ? 'white' : 'transparent'
                }}
              />
            )}

            {/* Flip button */}
            <button onClick={() => toggleCard(item.id)} className="s1">
              {isAnswerShown ? "Show Question" : "Show Answer"}
            </button>

            {/* Edit / Save */}
            <button
              onClick={() => {
                if (isEditing) {
                  saveToFirebase(item);
                } else {
                  setEditingId(item.id);
                }
              }}
              className="s1"
            >
              {isEditing ? "Save" : "Edit"}
            </button>

            {/* Delete */}
            <button onClick={() => DeleteFlashCard(subid, item.id)} className="s1">
              Delete
            </button>
          </div>
        );
      })}
      
      <BottomBar/>
    </>
  )
}

export default Flashcards
