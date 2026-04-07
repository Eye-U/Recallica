import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { auth } from './config/firebase'
import Login from './Login'
import Home from './Pages/Home'
import Settings from './Pages/Settings'
import Timer from './Pages/Timer'
import Location from './Pages/Location'
import Checklist from './Pages/Checklist'
import Account from './Pages/Account'

import Subjects from './Pages/study/Subjects'
import Flashcards from './Pages/study/Flashcards'
import Lessons from './Pages/study/Lessons'
import Quizzes from './Pages/study/Quizzes'
import Notes from './Pages/study/Notes'


import './style.css'
import { onAuthStateChanged } from 'firebase/auth'

const savedDark = localStorage.getItem("darkMode") === "true";
document.documentElement.classList.toggle("dark", savedDark);

const router = createBrowserRouter([
  { path: "/",                  element: <Login /> },
  { path: "/home",              element: <Home /> },
  { path: "/settings",          element: <Settings /> },
  { path: "/timer",             element: <Timer /> },
  { path: "/location",          element: <Location /> },
  { path: "/checklist",         element: <Checklist /> },
  { path: "/account",           element: <Account /> },

  { path: "/study/flashcards",           element: <Flashcards /> },
  { path: "/study/subjects",    element: <Subjects /> },
  { path: "/study/lessons",    element: <Lessons /> },
  { path: "/study/quizzes",    element: <Quizzes /> },
  { path: "/study/notes",    element: <Notes /> },
])

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-inner">
        <div className="app-loader-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div className="app-loader-spinner" />
      </div>
    </div>
  )
}

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!ready) return <AppLoader />;

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)