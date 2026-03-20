import { useEffect, useState } from "react";
import {SideBar, AppBar, BottomBar} from "../components/Bar";
import { auth } from "../config/firebase";
import { onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../components/Formatting.css';

function Location() {
  const [isOpen, setIsOpen] = useState(true);

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


  return (
    <>
      <AppBar onToggle={() => setIsOpen(!isOpen)} title="Location" />
      <SideBar isOpen={isOpen} />
        

      <BottomBar/>
    </>
  )
}

export default Location
