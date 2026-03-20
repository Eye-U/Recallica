import { useEffect, useState } from "react";
import {SideBar, AppBar, BottomBar} from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';

import DatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { createSTask, DeleteTask } from "../config/ChecklistHandle";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

function Checklist() {
  const [isOpen, setIsOpen] = useState(true);
  const [Task, setTask ] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [CurrentDate, setCurrentDate] = useState('');
  const [TaskList, setTaskList] = useState<any[]>([]);;
  const [editingId, setEditingId] = useState<string | null>(null);

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


  useEffect(() => {
    if(!selectedDate) return;
    const date = selectedDate ? format(selectedDate, "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy");
    setCurrentDate(date)
  })

  function create(){
    const date = CurrentDate
    createSTask(Task, date);
  }


  useEffect(() => {
    const fetchAllTasks = async () => {
    if (editingId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const snapshot = await getDocs(collection(db, "users", uid, "toDo"));
            
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));  
      setTaskList(tasks);
    };
      fetchAllTasks();
  },);
  
  const handleLocalChange = (id: string, field: string, value: string) => {
    setTaskList(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleToggleCheck = async (id: string, isChecked: boolean) => {
  setTaskList(prev => prev.map(item => 
    item.id === id ? { ...item, checked: isChecked } : item
  ));
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const docRef = doc(db, "users", uid, "toDo", id);
    await updateDoc(docRef, {
      checked: isChecked
    });
  } catch (error) {
    console.error("Error updating checkbox:", error);
  }
};
  
  const saveToFirebase = async (item: any) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
  
    const docRef = doc(db, "users", uid, "toDo", item.id); 
    await updateDoc(docRef, {
      task: item.task
    });
    setEditingId(null); 
  };
  
  
    const Clear = () => {
      setTask('');
    };


  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Check list" />
      <SideBar isOpen={isOpen} />

      <DatePicker
        selected={selectedDate}
        onChange={(date: any) => setSelectedDate(date)}
        dateFormat="MMMM d, yyyy"
        inline
        calendarClassName="datez"
      />


      <br />
      <input type="text" onChange={(e)=> setTask(e.target.value)} placeholder="Task"/>
      <button onClick={() => {create(); Clear();}}>Create Task</button>

      {/* Display all Notes */}
      {TaskList.map((item) => {
        const isEditing = editingId === item.id;
        if(item.date==CurrentDate){
          return(
            <div key={item.id} className="test" style={{ marginBottom: '10px' }}>
              <input 
              type="checkbox" 
              checked={item.checked || false} 
              onChange={(e) => handleToggleCheck(item.id, e.target.checked)}
            />

              <input
                type="text"
                value={item.task}
                readOnly={!isEditing}
                onChange={(e) => handleLocalChange(item.id, 'task', e.target.value)}
                className="txt-change"
                style={{
                  color: !isEditing ? '' : 'black',
                  display: 'block',
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
                }}>
                {isEditing ? "Save" : "Edit"}
              </button>

              <button onClick={() => DeleteTask( item.id)}>Delete</button>
            </div>
          )
        }
      })}
      
        
      <BottomBar/>
    </>
  )
}

export default Checklist
