import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const createSTask = async (task: string, date: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
 
  await addDoc(collection(db, "users", uid, "toDo"), {
    task,
    date,
    checked: false,
    createdAt: new Date().toISOString(),
  });
};
 
export const DeleteTask = async (id: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
 
  await deleteDoc(doc(db, "users", uid, "toDo", id));
};
 