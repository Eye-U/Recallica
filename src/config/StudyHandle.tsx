import { db, auth } from "./firebase";
import { collection, addDoc, deleteDoc, doc, getDocs, getDoc, updateDoc } from "firebase/firestore";

// ==========================================
// 1. SUBJECTS LOGIC
// ==========================================

export async function createSubject(subject: string, color: string = "#3b82f6") {
    if (subject.replace(/\s+/g, "") == "") return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "Subjects"), {
        name: subject,
        color: color,
        TotalStudytime: 0,
        createdAt: new Date().toISOString()
    });
}

export async function deleteSubject(id: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // 1. Find all Lessons inside this Subject
    const lessonsRef = collection(db, "users", uid, "Subjects", id, "Lessons");
    const lessonsSnap = await getDocs(lessonsRef);

    // 2. Cascade Delete: Delete every Lesson (which will delete its own flashcards/notes)
    for (const lessonDoc of lessonsSnap.docs) {
        await DeleteLesson(id, lessonDoc.id);
    }

    // 3. Legacy Cleanup (Deletes any old cards made before the update)
    const oldFcSnap = await getDocs(collection(db, "users", uid, "Subjects", id, "FlashCards"));
    for (const docSnap of oldFcSnap.docs) await deleteDoc(docSnap.ref);

    const oldNoteSnap = await getDocs(collection(db, "users", uid, "Subjects", id, "Notes"));
    for (const docSnap of oldNoteSnap.docs) await deleteDoc(docSnap.ref);

    // 4. Finally, delete the main Subject document
    await deleteDoc(doc(db, "users", uid, "Subjects", id));
}

// ==========================================
// 2. LESSONS LOGIC (NEW)
// ==========================================

export async function CreateLesson(subjectId: string, lessonName: string) {
    if (lessonName.replace(/\s+/g, "") == "") return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await addDoc(collection(db, "users", uid, "Subjects", subjectId, "Lessons"), {
        name: lessonName,
        createdAt: new Date().toISOString()
    });
}

export async function DeleteLesson(subjectId: string, lessonId: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Cascade: Delete all Flashcards inside this lesson
    const fcRef = collection(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId, "FlashCards");
    const fcSnap = await getDocs(fcRef);
    for (const docSnap of fcSnap.docs) await deleteDoc(docSnap.ref);

    // Cascade: Delete all Notes inside this lesson
    const noteRef = collection(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId, "Notes");
    const noteSnap = await getDocs(noteRef);
    for (const docSnap of noteSnap.docs) await deleteDoc(docSnap.ref);

    // Finally, delete the lesson document itself
    await deleteDoc(doc(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId));
}

// ==========================================
// 3. FLASHCARDS LOGIC (UPDATED)
// ==========================================

export async function CreateFlashCard(subjectId: string, lessonId: string, answer: string, question: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Note the new path including "Lessons" and "lessonId"
    await addDoc(collection(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId, "FlashCards"), {
        answer: answer,
        question: question,
        createdAt: new Date().toISOString()
    });
}

export async function DeleteFlashCard(subjectId: string, lessonId: string, FCid: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId, "FlashCards", FCid));
}

// ==========================================
// 4. NOTES LOGIC (UPDATED)
// ==========================================

export async function CreateNotes(subjectId: string, lessonId: string, name: string, content: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (name.replace(/\s+/g, "") == "" || content.replace(/\s+/g, "") == "") return;

    await addDoc(collection(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId, "Notes"), {
        name: name,
        content: content,
        createdAt: new Date().toISOString()
    });
}

export async function DeleteNote(subjectId: string, lessonId: string, noteid: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "Subjects", subjectId, "Lessons", lessonId, "Notes", noteid));
}

// ==========================================
// 5. STREAK LOGIC (UPGRADED FOR SUBJECTS)
// ==========================================

export async function UpdateStreak(subjectId?: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const todayStr = new Date().toDateString();
    
    // Calculate yesterday's date string for streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // 1. UPDATE GLOBAL STREAK
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const user = userSnap.data();

    // Only update global if we haven't studied anything yet today
    if (user?.lastDate !== todayStr) {
        let newGlobalStreak = 1;
        if (user?.lastDate === yesterdayStr) {
            newGlobalStreak = (user?.Streak || 0) + 1; 
        }
        const finalBest = Math.max(newGlobalStreak, user?.BestStreak || 0);

        await updateDoc(userRef, {
            Streak: newGlobalStreak,
            BestStreak: finalBest,
            lastDate: todayStr
        });
    }

    // 2. UPDATE SUBJECT-SPECIFIC STREAK
    if (subjectId) {
        const subRef = doc(db, "users", uid, "Subjects", subjectId);
        const subSnap = await getDoc(subRef);
        
        if (subSnap.exists()) {
            const subData = subSnap.data();
            
            // Only update this subject if we haven't studied IT specifically today
            if (subData?.lastReviewDate !== todayStr) {
                let newSubStreak = 1;
                // If we studied this exact subject yesterday, continue the streak!
                if (subData?.lastReviewDate === yesterdayStr) {
                    newSubStreak = (subData?.subjectStreak || 0) + 1;
                }
                
                await updateDoc(subRef, {
                    subjectStreak: newSubStreak,
                    lastReviewDate: todayStr
                });
            }
        }
    }
}