import { db, auth } from "./firebase";
import { collection, addDoc, deleteDoc, doc, getDocs, getDoc, updateDoc } from "firebase/firestore";

export async function createSubject(subject: string){
    if(subject.replace(/\s+/g, "")=="") return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "Subjects"), {
        name: subject,
        TotalStudytime: 0,
    });
}

export async function DeleteSubjet(id: any) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "Subjects", id));
    const colRef1 = collection(db, "users", uid, "Subjects", id, "Notes");
    const snapshot1 = await getDocs(colRef1);
    for (const docSnap of snapshot1.docs) {
        await deleteDoc(docSnap.ref); 
    }

    const colRef2 = collection(db, "users", uid, "Subjects", id, "FlashCards");
    const snapshot2 = await getDocs(colRef2);
    for (const docSnap of snapshot2.docs) {
        await deleteDoc(docSnap.ref); 
    }
}

export async function CreateNotes(id: any, name: string, content: string){
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if(name.replace(/\s+/g, "")==""||content.replace(/\s+/g, "")=="")return;

    await addDoc(collection(db, "users", uid, "Subjects", id, "Notes"), {
        name: name,
        content: content,
    });
}

export async function DeleteNote(id: any, noteid: any) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "Subjects", id, "Notes", noteid));
}


export async function CreateFlashCard(id: any, answer: string, question: string){
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "Subjects", id, "FlashCards"), {
        answer: answer,
        question: question,
    });
}

export async function DeleteFlashCard(id: any, FCid: any) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "Subjects", id, "FlashCards", FCid));
}


export async function UpdateStreak() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(doc(db, "users", uid));
    const user = snapshot.data();

    const todayStr = new Date().toDateString();
    
    if (user?.lastDate === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreakValue;
    if (user?.lastDate === yesterdayStr) {
        newStreakValue = (user?.Streak || 0) + 1; 
    } else {
        newStreakValue = 1; 
    }

    const currentBest = user?.BestStreak || 0;
    const finalBest = Math.max(newStreakValue, currentBest);

    await updateDoc(userRef, {
        Streak: newStreakValue,
        BestStreak: finalBest,
        lastDate: todayStr
    });
}