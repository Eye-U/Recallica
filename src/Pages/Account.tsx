import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, updatePassword, updateProfile, verifyBeforeUpdateEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  User, Mail, Shield, Bell, ChevronRight,
  Pencil, X, Check
} from "lucide-react";

function Account() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [highestTime, setHighestTime] = useState(0);
  const [streak, setStreak] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState<"name" | "email" | "password" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [editError, setEditError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, "users", uid));
      const data = snap.data();
      setUserData(data);
      setStreak(data?.Streak ?? 0);
      const subSnap = await getDocs(collection(db, "users", uid, "Subjects"));
      const allData = subSnap.docs.map((d) => d.data());
      const total = allData.reduce((acc, cur) => acc + (cur.TotalStudytime || 0), 0);
      const highest = allData.length > 0 ? Math.max(...allData.map((s) => s.TotalStudytime || 0)) : 0;
      setTotalTime(total);
      setHighestTime(highest);
    }
    load();
  }, []);

  function formatTime(seconds: number) {
    if (seconds >= 86400) return Math.trunc(seconds / 86400) + "d";
    if (seconds >= 3600)  return Math.trunc(seconds / 3600)  + "h";
    if (seconds >= 60)    return Math.trunc(seconds / 60)    + "m";
    return seconds + "s";
  }

  const openEdit = (field: "name" | "email" | "password") => {
    setEditField(field);
    setEditValue(
      field === "name"  ? auth.currentUser?.displayName ?? "" :
      field === "email" ? auth.currentUser?.email ?? "" : ""
    );
    setEditStatus("idle");
    setEditError("");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const current = auth.currentUser;
    if (!current || !editField) return;
    setEditStatus("saving");
    try {
      if (editField === "name")     await updateProfile(current, { displayName: editValue });
      if (editField === "email")    await verifyBeforeUpdateEmail(current, editValue);
      if (editField === "password") await updatePassword(current, editValue);
      setEditStatus("done");
      setTimeout(() => setEditOpen(false), 800);
    } catch (e: any) {
      setEditError(e.message ?? "Update failed.");
      setEditStatus("error");
    }
  };

  const displayName  = auth.currentUser?.displayName ?? "User";
  const displayEmail = auth.currentUser?.email ?? "";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const achievements = [
    { label: "Early Bird",   icon: "🌅", unlocked: totalTime > 0 },
    { label: "Focus Master", icon: "🎯", unlocked: highestTime >= 3600 },
    { label: "Streak King",  icon: "🔥", unlocked: streak >= 7 },
  ];

  const accountRows = [
    { icon: <User size={18} />,   label: "Personal Information", sub: displayName,      field: "name"     as const },
    { icon: <Mail size={18} />,   label: "Email",                sub: displayEmail,     field: "email"    as const },
    { icon: <Shield size={18} />, label: "Security",             sub: "Password & 2FA", field: "password" as const },
  ];

  return (
    <>
      <AppBar onToggle={() => setIsOpen(o => !o)} title="Profile" />
      <SideBar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="page-content">
        <div className="ac-wrapper">

          <div className="ac-hero">
            <div className="ac-avatar">
              <span className="ac-avatar-initials">{initials}</span>
            </div>
            <h1 className="ac-name">{displayName}</h1>
            <p className="ac-role">{userData?.role ?? "Student"}</p>
            <button className="ac-edit-btn" onClick={() => openEdit("name")}>
              <Pencil size={14} /> Edit Profile
            </button>
          </div>

          <div className="ac-stats-card">
            <div className="ac-stat">
              <span className="ac-stat-value">{streak}</span>
              <span className="ac-stat-label">Streak</span>
            </div>
            <div className="ac-stat-divider" />
            <div className="ac-stat">
              <span className="ac-stat-value">{formatTime(totalTime)}</span>
              <span className="ac-stat-label">Focused</span>
            </div>
            <div className="ac-stat-divider" />
            <div className="ac-stat">
              <span className="ac-stat-value">{userData?.BestStreak ?? 0}</span>
              <span className="ac-stat-label">Best Streak</span>
            </div>
          </div>

          <section className="ac-section">
            <div className="ac-section-header">
              <h2 className="ac-section-title">Achievements</h2>
              <span className="ac-view-all">View All</span>
            </div>
            <div className="ac-achievements">
              {achievements.map((a) => (
                <div key={a.label} className={`ac-badge ${a.unlocked ? "ac-badge-on" : "ac-badge-off"}`}>
                  <div className="ac-badge-icon">{a.icon}</div>
                  <span className="ac-badge-label">{a.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ac-section">
            <h2 className="ac-section-title">Account</h2>
            <div className="ac-rows-card">
              {accountRows.map((row) => (
                <button key={row.label} className="ac-row" onClick={() => openEdit(row.field)}>
                  <div className="ac-row-icon">{row.icon}</div>
                  <div className="ac-row-info">
                    <p className="ac-row-label">{row.label}</p>
                    <p className="ac-row-sub">{row.sub}</p>
                  </div>
                  <ChevronRight size={16} className="ac-row-chevron" />
                </button>
              ))}
              <div className="ac-row">
                <div className="ac-row-icon"><Bell size={18} /></div>
                <div className="ac-row-info">
                  <p className="ac-row-label">Notifications</p>
                  <p className="ac-row-sub">On</p>
                </div>
                <ChevronRight size={16} className="ac-row-chevron" />
              </div>
            </div>
          </section>

        </div>
      </main>

      {editOpen && (
        <div className="ac-modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-header">
              <h3 className="ac-modal-title">
                {editField === "name"     ? "Edit Name" :
                 editField === "email"    ? "Update Email" : "Change Password"}
              </h3>
              <button className="ac-modal-close" onClick={() => setEditOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <input
              className="field-input ac-modal-input"
              type={editField === "password" ? "password" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={
                editField === "name"     ? "Full name" :
                editField === "email"    ? "New email address" : "New password"
              }
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            />
            {editField === "email"    && <p className="ac-modal-hint">A verification link will be sent to your new email.</p>}
            {editField === "password" && <p className="ac-modal-hint">Must be at least 6 characters.</p>}
            {editError && <p className="error-message" style={{ marginTop: 8 }}>{editError}</p>}
            <button
              className="primary-btn ac-modal-save"
              onClick={saveEdit}
              disabled={editStatus === "saving" || !editValue.trim()}
            >
              {editStatus === "saving" ? <span className="btn-spinner" /> :
               editStatus === "done"   ? <><Check size={15} /> Saved!</> : "Save changes"}
            </button>
          </div>
        </div>
      )}

      <BottomBar />
    </>
  );
}

export default Account;