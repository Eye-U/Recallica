
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAP837Ze4d3xHTkq191y2lWinCJpbsfYhU",
  authDomain: "recallica-3bdda.firebaseapp.com",
  projectId: "recallica-3bdda",
  storageBucket: "recallica-3bdda.firebasestorage.app",
  messagingSenderId: "53243670936",
  appId: "1:53243670936:web:d83e23bd90fbfce1c1fbed",
  measurementId: "G-6QMS34KZRP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);