import { useEffect, useState } from "react"
import { auth, googleProvider, db } from "./config/firebase";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [username, setUsername] = useState('');
  const [emailS, setEmailS] = useState('');
  const [passwordS, setPasswordS] = useState('');
  const [emailL, setEmailL] = useState('');
  const [passwordL, setPasswordL] = useState('');
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        navigate("/home");
      }
    });

    return () => removeListener();
  }, [navigate]);
  

  const signIn = async() =>{
    try{
      if(username!=null){
        const user = await createUserWithEmailAndPassword(auth, emailS, passwordS);
      
        await updateProfile(user.user, { displayName: username});

        await setDoc(doc(db, "users", user.user.uid), {
          username: user.user.displayName,
          email: user.user.email,
        });
      }else{
        setErrorMessage("Invalid Username.");
      }

    } catch(err: any){
      switch (err.code) {
        case "auth/email-already-in-use":
          setErrorMessage("This email is already registered. Try logging in.");
          break;
        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setErrorMessage("Password should be at least 6 characters.");
          break;
        case "auth/operation-not-allowed":
          setErrorMessage("Email/password accounts are not enabled. Contact support.");
          break;
        default:
          setErrorMessage("Registration failed. Please try again later.");
      }
    }
  }

  const GoogleSignIn = async() =>{
    try{
      const user = await signInWithPopup(auth, googleProvider);

      await setDoc(doc(db, "users", user.user.uid), {
          username: user.user.displayName,
          email: user.user.email,
        });
    } catch(err: any){
      setErrorMessage("Something Went wrong");
    }
  }

  const logIn = async() =>{
    try{
      await signInWithEmailAndPassword(auth, emailL, passwordL);
    } catch(err: any){
      switch (err.code) {
        case "auth/user-not-found":
          setErrorMessage("This email is not registered.");
          break;
        default:
          setErrorMessage("Login failed. Please try again.");
      }
    }
  }

  console.log(auth?.currentUser?.email);

  return (
    <>
      <p className="s1 txt-chaneg">Create account</p>
      <input type="text" placeholder="Email"
      onChange={(e)=> setEmailS(e.target.value)}
      />

      <input type="password" placeholder="Password"
      onChange={(e)=> setPasswordS(e.target.value)}
      />

      <input type="text" placeholder="Username for sign up"
      onChange={(e)=> setUsername(e.target.value)}
      />

      <br />

      <p className="s1 txt-chaneg">Login</p>
      <input type="text" placeholder="Email"
      onChange={(e)=> setEmailL(e.target.value)}
      />

      <input type="password" placeholder="Password"
      onChange={(e)=> setPasswordL(e.target.value)}
      />

      <br />

      <button onClick={signIn}>Sign in</button>
      <button onClick={logIn}>Log in</button>
      <button onClick={GoogleSignIn}>sign in with google</button>


      {/* error messages */}
      <div>
        {errorMessage}
      </div>
    </>
  )
}

export default Login
