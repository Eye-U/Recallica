import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function createSTask(task: string, date: any){
    if(task.replace(/\s+/g, "")=="") return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "toDo"), {
        task: task,
        date: date,
        checked: false,
    });
}

export async function DeleteTask(taskid: any) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "ToDo", taskid));
}