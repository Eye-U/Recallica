import { useEffect, useState } from "react";
import { SideBar, AppBar, BottomBar } from "../components/Bar";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../style.css";

import DatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { createSTask, DeleteTask } from "../config/ChecklistHandle";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

function Checklist() {
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState("");
  const [taskList, setTaskList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      if (!user?.email) navigate("/");
    });
    return () => removeListener();
  }, [navigate]);

  useEffect(() => {
    if (!selectedDate) return;
    setCurrentDate(format(selectedDate, "MMMM d, yyyy"));
  }, [selectedDate]);

  useEffect(() => {
    if (editingId) return;
    const fetchAllTasks = async () => {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snapshot = await getDocs(collection(db, "users", uid, "toDo"));
      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTaskList(tasks);
      setLoading(false);
    };
    fetchAllTasks();
  }, [currentDate, editingId]);

  const handleCreate = async () => {
    if (!task.trim()) return;
    await createSTask(task.trim(), currentDate);
    setTask("");
    setAdding(false);
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const snapshot = await getDocs(collection(db, "users", uid, "toDo"));
    setTaskList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleLocalChange = (id: string, value: string) => {
    setTaskList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, task: value } : item))
    );
  };

  const handleToggleCheck = async (id: string, isChecked: boolean) => {
    setTaskList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: isChecked } : item))
    );
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "toDo", id), { checked: isChecked });
  };

  const saveToFirebase = async (item: any) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "toDo", item.id), { task: item.task });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await DeleteTask(id);
    setTaskList((prev) => prev.filter((item) => item.id !== id));
  };

  const tasksForDay = taskList.filter((item) => item.date === currentDate);
  const completedCount = tasksForDay.filter((t) => t.checked).length;

  return (
    <>
      <AppBar onToggle={() => setIsOpen(o => !o)} title="Checklist" />
      <SideBar 
      isOpen={isOpen} 
       onClose={() => setIsOpen(false)} 
      />
      <main className="page-content">
        <div className="cl-layout">

          <aside className="cl-calendar-aside">
            <div className="cl-calendar-card">
              <p className="cl-calendar-label">Select a date</p>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => date && setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                inline
                calendarClassName="cl-datepicker"
              />
            </div>
          </aside>

          <section className="cl-tasks-section">
            <div className="cl-tasks-header">
              <div>
                <h1 className="cl-tasks-date">{currentDate}</h1>
                <p className="cl-tasks-count">
                  {tasksForDay.length === 0
                    ? "No tasks yet"
                    : `${completedCount} of ${tasksForDay.length} completed`}
                </p>
              </div>
              <button
                className="cl-add-btn"
                onClick={() => setAdding((v) => !v)}
                aria-label="Add task"
              >
                {adding ? <X size={16} /> : <Plus size={16} />}
                {adding ? "Cancel" : "Add task"}
              </button>
            </div>

            {tasksForDay.length > 0 && (
              <div className="cl-progress-track">
                <div
                  className="cl-progress-fill"
                  style={{ width: `${(completedCount / tasksForDay.length) * 100}%` }}
                />
              </div>
            )}

            {adding && (
              <div className="cl-add-row">
                <input
                  type="text"
                  className="cl-add-input"
                  placeholder="What needs to be done?"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
                <button
                  className="cl-create-btn"
                  onClick={handleCreate}
                  disabled={!task.trim()}
                >
                  <Check size={15} /> Add
                </button>
              </div>
            )}

            <div className="cl-task-list">
              {loading && <p className="cl-empty">Loading tasks…</p>}

              {!loading && tasksForDay.length === 0 && (
                <div className="cl-empty-state">
                  <div className="cl-empty-icon">📋</div>
                  <p className="cl-empty-title">No tasks for this day</p>
                  <p className="cl-empty-sub">Click "Add task" to get started</p>
                </div>
              )}

              {tasksForDay.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`cl-task-row ${item.checked ? "cl-task-done" : ""} ${isEditing ? "cl-task-editing" : ""}`}
                  >
                    <button
                      className={`cl-checkbox ${item.checked ? "cl-checkbox-checked" : ""}`}
                      onClick={() => handleToggleCheck(item.id, !item.checked)}
                      aria-label={item.checked ? "Mark incomplete" : "Mark complete"}
                    >
                      {item.checked && <Check size={11} strokeWidth={3} />}
                    </button>

                    {isEditing ? (
                      <input
                        type="text"
                        className="cl-edit-input"
                        value={item.task}
                        onChange={(e) => handleLocalChange(item.id, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveToFirebase(item)}
                        autoFocus
                      />
                    ) : (
                      <span className={`cl-task-text ${item.checked ? "cl-task-text-done" : ""}`}>
                        {item.task}
                      </span>
                    )}

                    <div className="cl-task-actions">
                      {isEditing ? (
                        <>
                          <button className="cl-action-btn cl-save-btn" onClick={() => saveToFirebase(item)}>
                            <Check size={14} /> Save
                          </button>
                          <button className="cl-action-btn cl-cancel-btn" onClick={() => setEditingId(null)}>
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="cl-icon-btn" onClick={() => setEditingId(item.id)} aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="cl-icon-btn cl-delete-btn" onClick={() => handleDelete(item.id)} aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <BottomBar />
    </>
  );
}

export default Checklist;