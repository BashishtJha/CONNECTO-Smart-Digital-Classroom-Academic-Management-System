import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import TimetableGrid from "../../components/routine/TimetableGrid";
import Reminders from "../../components/routine/Reminders";

const reminderTypes = ["Study", "Project", "Revision", "Other"];

const toLocalDatetimeValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const Routine = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Study");
  const [dateTime, setDateTime] = useState(toLocalDatetimeValue());
  const alertedReminderIdsRef = useRef(new Set());

  const token = localStorage.getItem("token");

  const fetchRoutine = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("http://localhost:5000/api/routine/student", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to fetch routine", err);
      setError(err?.response?.data?.message || "Failed to fetch routine");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchReminders = useCallback(async () => {
    try {
      setRemindersLoading(true);
      const res = await axios.get("http://localhost:5000/api/personal-reminders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reminders", err);
      setReminders([]);
    } finally {
      setRemindersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoutine();
    fetchReminders();
  }, [fetchRoutine, fetchReminders]);

  const openReminderModal = () => {
    setEditingReminderId("");
    setTitle("");
    setType("Study");
    setDateTime(toLocalDatetimeValue());
    setShowModal(true);
  };

  const openEditReminderModal = (reminder) => {
    setEditingReminderId(reminder._id);
    setTitle(reminder.title || "");
    setType(reminder.type || "Study");
    setDateTime(toLocalDatetimeValue(new Date(reminder.remindAt)));
    setShowModal(true);
  };

  const closeReminderModal = () => {
    setShowModal(false);
  };

  const saveReminder = async (e) => {
    e.preventDefault();

    if (!title.trim() || !dateTime) {
      alert("Title and date/time are required");
      return;
    }

    try {
      setSavingReminder(true);
      const payload = {
        title: title.trim(),
        type,
        remindAt: new Date(dateTime).toISOString(),
      };

      if (editingReminderId) {
        await axios.put(
          `http://localhost:5000/api/personal-reminders/${editingReminderId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("http://localhost:5000/api/personal-reminders", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      closeReminderModal();
      await fetchReminders();
    } catch (err) {
      console.error("Failed to save reminder", err);
      alert(err?.response?.data?.message || "Failed to save reminder");
    } finally {
      setSavingReminder(false);
    }
  };

  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.error("Alarm sound blocked", err);
    }
  };

  const deleteReminder = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/personal-reminders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Failed to delete reminder", err);
      alert("Failed to delete reminder");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      reminders.forEach((item) => {
        const reminderTime = new Date(item.remindAt).getTime();
        if (Number.isNaN(reminderTime)) return;

        const alreadyAlerted = alertedReminderIdsRef.current.has(item._id);
        const isDueWindow = now >= reminderTime && now - reminderTime <= 60 * 1000;

        if (!alreadyAlerted && isDueWindow) {
          alertedReminderIdsRef.current.add(item._id);
          playAlarmSound();
          alert(`Reminder: ${item.title}`);
        }
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [reminders]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">My Routine</h1>
          <p className="text-gray-500">Weekly class schedule and reminders</p>
        </div>

        <button
          onClick={openReminderModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Personal Reminder
        </button>
      </div>

      {loading ? (
        <p>Loading routine...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <TimetableGrid entries={entries} />
      )}

      {remindersLoading ? (
        <p>Loading reminders...</p>
      ) : (
        <Reminders
          reminders={reminders}
          onDelete={deleteReminder}
          onEdit={openEditReminderModal}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6">
            <h2 className="text-3xl font-semibold mb-5">Add Personal Reminder</h2>

            <form onSubmit={saveReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  placeholder="E.g., Study Session, Revision"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                >
                  {reminderTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeReminderModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReminder}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl disabled:opacity-60"
                >
                  {savingReminder
                    ? "Saving..."
                    : editingReminderId
                    ? "Update Reminder"
                    : "Add Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routine;
