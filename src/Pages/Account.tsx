import { useEffect, useState } from "react";
import {SideBar, AppBar, BottomBar} from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, updateEmail, updatePassword, updateProfile} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

function Account() {
  const [isOpen, setIsOpen] = useState(true);
  const [User, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [highestTime, setHighestTime] = useState(0);

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

      useEffect( () => {
        async function retrieveUserInfo() {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          const snapshot = await getDoc(doc(db, "users", uid));
          const data = snapshot.data();
          setUser(data);
          }
        retrieveUserInfo();
      }, []);

      async function UpdateAccount(){
        const Current = auth.currentUser
        if(!Current) return;

        await updateProfile(Current, { displayName: username});
        await updateEmail(Current, email);
        await updatePassword(Current, password);
      }

  const getAllsStats = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const subjectsRef = collection(db, "users", uid, "Subjects");
      const querySnapshot = await getDocs(subjectsRef);
          
      const allData = querySnapshot.docs.map(doc => doc.data());
      const total = allData.reduce((acc, curr) => acc + (curr.TotalStudytime || 0), 0);
      const highest = allData.length > 0 
        ? Math.max(...allData.map(s => s.TotalStudytime || 0)) 
        : 0;

      setTotalTime(total);
      setHighestTime(highest);
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  getAllsStats();

  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Account" />
      <SideBar isOpen={isOpen} />
        <div className="test">
          username: {auth.currentUser?.displayName} <br />
          Email: {auth.currentUser?.email}
        </div>

        <div>
          <p className="s1 txt-chaneg">Update account</p>
          <input type="text" placeholder="Username"
          onChange={(e)=> setUsername(e.target.value)}/>

          <input type="text" placeholder="Email"
          onChange={(e)=> setEmail(e.target.value)}
          />

          <input type="password" placeholder="Password"
          onChange={(e)=> setPassword(e.target.value)}
          />
          <button onClick={UpdateAccount}>Update</button>
        </div>

        <br />

        <div className="test">
          Achivements: <br />
          Best Streak: {User?.BestStreak ?? 0} <br />
          Highest Study Time in a subject: {FormatTime(highestTime)} 
          <br />
          Total Study Time: {FormatTime(totalTime)}
        </div>
        
      <BottomBar/>
    </>
  )
}

export default Account
