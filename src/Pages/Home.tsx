import { useEffect, useState } from "react";
import {SideBar, AppBar, BottomBar} from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';
import { getDate } from "date-fns";
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";

function Home() {
  const [isOpen, setIsOpen] = useState(true);
  const [BotSub, setBotSub] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

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

  //retrieve subjects
  const getBotSubjects = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if(!uid) return;
      const subjectsRef = collection(db, "users", uid, "Subjects");
      const q = query(subjectsRef, orderBy("TotalStudytime", "asc"), limit(5));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching top subjects: ", error);
    }
  };

  function FormatTime(seconds: number){
    let time = '';
    if(seconds>=86400){
      time = Math.trunc(seconds/86400) + ' days'
    } else if (seconds>=3600){
      time = Math.trunc(seconds/3600) + ' hours'
    } else if (seconds>=60){
      time = Math.trunc(seconds/60) + ' minutes'
    } else{
      time = seconds + ' seconds'
    }
    return time;
  }

  async function retrieveStreak(){
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    const user = snapshot.data();
    let streak = user?.Streak   ?? 0;
    return streak;
  }

  useEffect(() => {
    const loadStreak = async () => {
      const s = await retrieveStreak();
      setStreak(s ?? 0);
    };
    loadStreak();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await getBotSubjects(); 
      if (data) setBotSub(data);
    };
    loadData();
  });

  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Home" />
      <SideBar isOpen={isOpen} />
        <div className="test">
          <p className="s1">test</p>
          <p className="s2">test</p>
          <p className="s3">test</p>
          <p className="s4">test</p>
        </div>

        <div className="active">
          current Streak {streak} 
        </div>

        <br />

        <div className="test">
          Subjects that need your attention or something IDK
        </div>
        {BotSub.map((item) => (
          <div className="test" key={item.id}>
            <p>{item.name}</p>
            <p>{FormatTime(item.TotalStudytime)} </p>
          </div>
        ))}


        <BottomBar/>
        
    </>
  )
}

export default Home
