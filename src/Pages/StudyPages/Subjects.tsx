import { useEffect, useState } from "react";
import {SideBar, AppBar, TopBar, BottomBar} from "../../components/Bar";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../../components/Formatting.css';
import { createSubject, DeleteSubjet } from "../../config/StudyHandle";
import { collection, getDocs} from "firebase/firestore";

function Subjects() {
  const [isOpen, setIsOpen] = useState(true);
  const [SN, setSN] = useState('');
  const [Subject, setSubject] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const subid = localStorage.getItem("CurrentSubject");

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
    const fetchAllSubjects = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }
      const snapshot = await getDocs(collection(db, "users", uid, "Subjects"));
      
      const SubList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSubject(SubList);
    };
    fetchAllSubjects();
  });


  function create(){
      if(SN!=null){
        createSubject(SN);
        setSN('');
      } else{
        setErrorMessage('Subject must have a name.');
      }
    }

  function navigateToNotes(id: any){
    localStorage.setItem("CurrentSubject", id);
    navigate("/study/Notes");
  }


  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Subjects" />
      <SideBar isOpen={isOpen} />
      <TopBar />

      {/* error messages */}
      <div>
        {errorMessage}
      </div>

      {/* Create subject */}
      <input type="text" placeholder="Subject name"
      className="s1"
      value={SN}
      onChange={(e)=> setSN(e.target.value)}
      />
      <button onClick={create}>Create</button>
      


      {/* Display subject */}
      {Subject.map((item) => {
      return (
        <div key={item.id} className={item.id == subid ? "active" : "test"} style={{ marginBottom: '10px' }}>
          <button onClick={() => navigateToNotes(item.id)}
            className="s1">
            {item.name}
          </button>
          <button onClick={() => DeleteSubjet(item.id)} className="s1">
            Delete
          </button>
        </div>
      );
    })}

    <BottomBar/>
    </>
  )
}

export default Subjects


