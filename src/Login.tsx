import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "./config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { User, Mail, Lock, ArrowRight, Zap } from "lucide-react";
import "./style.css";

interface SignUpForm {
  username: string;
  email: string;
  password: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface InputProps {
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputProps> = ({
  label,
  placeholder,
  icon,
  type = "text",
  value,
  onChange,
}) => (
  <div className="field-group">
    <label className="field-label">{label}</label>
    <div className="field-wrap">
      {icon && <span className="field-icon">{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="field-input"
      />
    </div>
  </div>
);

const GoogleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.2 0 5.9 1.1 8.1 3.1l6-6C34.5 3.1 29.6 1 24 1 15.2 1 7.7 6.2 4.2 13.7l7 5.4C12.8 13.1 17.9 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.8c4.3-4 6.9-9.9 7.2-17z"
    />
    <path
      fill="#FBBC05"
      d="M11.2 28.7A14.9 14.9 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23.5 23.5 0 0 0 .5 24c0 3.9.9 7.5 2.7 10.7l8-6z"
    />
    <path
      fill="#34A853"
      d="M24 47c5.4 0 10-1.8 13.3-4.8l-7.4-5.8c-1.8 1.2-4.1 1.9-5.9 1.9-6.1 0-11.2-3.6-13.8-9l-8 6C6 41.6 14.3 47 24 47z"
    />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("signup");
  
  const [signupData, setSignupData] = useState<SignUpForm>({
    username: "",
    email: "",
    password: "",
  });
  const [loginData, setLoginData] = useState<LoginForm>({
    email: "",
    password: "",
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // --- RATE LIMITING STATES ---
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Auto-redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user?.email) navigate("/home");
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- LOCKOUT TIMER LOGIC ---
  useEffect(() => {
    let timer: number;
    if (lockoutTimer > 0) {
      timer = window.setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimer === 0 && loginAttempts >= 5) {
      // Once the timer hits 0, forgive them and reset attempts
      setLoginAttempts(0); 
    }
    return () => window.clearInterval(timer);
  }, [lockoutTimer, loginAttempts]);

  // Helper function to handle failed attempts
  const handleFailure = (error: any, defaultMessage: string) => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5 || error.code === 'auth/too-many-requests') {
      setLockoutTimer(60); // Lock them out for 60 seconds
      setErrorMessage("Too many failed attempts. Please wait 60 seconds.");
    } else {
      setErrorMessage(error.message || defaultMessage);
    }
  };

  const handleSignUp = async () => {
    if (lockoutTimer > 0) return; // Prevent action if locked out

    const { username, email, password } = signupData;
    if (!username || !email || !password) {
      setErrorMessage("All fields are required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      await setDoc(doc(db, "users", userCredential.user.uid), { username, email });
      setLoginAttempts(0); // Reset on success!
    } catch (err: any) {
      handleFailure(err, "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (lockoutTimer > 0) return; // Prevent action if locked out

    const { email, password } = loginData;
    if (!email || !password) {
      setErrorMessage("All fields are required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginAttempts(0); // Reset on success!
    } catch (err: any) {
      handleFailure(err, "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (lockoutTimer > 0) return; // Prevent action if locked out

    setLoading(true);
    setErrorMessage("");
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          username: userCredential.user.displayName,
          email: userCredential.user.email,
        },
        { merge: true }
      );
      setLoginAttempts(0); // Reset on success!
    } catch (err: any) {
      handleFailure(err, "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Decorative background shapes */}
      <div className="bg-shape bg-shape-1" aria-hidden="true" />
      <div className="bg-shape bg-shape-2" aria-hidden="true" />

      <div className="login-card">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Zap size={16} strokeWidth={2.5} />
          </div>
          <span className="brand-name">Recallica</span>
        </div>

        {/* Headline */}
        <h1 className="card-headline">
          {tab === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="card-subline">
          {tab === "signup"
            ? "Start your productivity journey today."
            : "Log in to continue where you left off."}
        </p>

        {/* Tabs */}
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setErrorMessage(""); }}
          >
            Log in
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            className={`tab-btn ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setErrorMessage(""); }}
          >
            Sign up
          </button>
        </div>

        {/* Forms */}
        {tab === "signup" ? (
          <div className="form-body">
            <InputField
              label="Username"
              placeholder="your_username"
              value={signupData.username}
              onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
              icon={<User size={15} />}
            />
            <InputField
              label="Email"
              placeholder="you@example.com"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              icon={<Mail size={15} />}
            />
            <InputField
              label="Password"
              placeholder="••••••••"
              type="password"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              icon={<Lock size={15} />}
            />
            <button
              className="primary-btn"
              onClick={handleSignUp}
              disabled={loading || lockoutTimer > 0}
            >
              {lockoutTimer > 0 ? (
                `Try again in ${lockoutTimer}s`
              ) : loading ? (
                <span className="btn-spinner" />
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        ) : (
          <div className="form-body">
            <InputField
              label="Email"
              placeholder="you@example.com"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              icon={<Mail size={15} />}
            />
            <InputField
              label="Password"
              placeholder="••••••••"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              icon={<Lock size={15} />}
            />
            <button
              className="primary-btn"
              onClick={handleLogin}
              disabled={loading || lockoutTimer > 0}
            >
              {lockoutTimer > 0 ? (
                `Try again in ${lockoutTimer}s`
              ) : loading ? (
                <span className="btn-spinner" />
              ) : (
                <>Log in <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="divider">
          <span className="divider-line" />
          <span className="divider-text">or</span>
          <span className="divider-line" />
        </div>

        {/* Google */}
        <button 
          className="google-btn" 
          onClick={handleGoogle} 
          disabled={loading || lockoutTimer > 0}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Error */}
        {errorMessage && (
          <p className="error-message" role="alert" style={{ color: '#ef4444', textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
            {errorMessage}
          </p>
        )}

        {/* Footer */}
        <p className="footer-text">
          By continuing, you agree to our{" "}
          <a href="#" className="footer-link">Terms &amp; Conditions</a>
        </p>
      </div>
    </div>
  );
};

export default Login;