import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { MapPinIcon } from "@heroicons/react/24/outline";
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

const getMinutesFromTime = (value = "") => {
  const [hourText, minuteText] = String(value).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hour * 60 + minute;
};

const formatTime = (value = "") => {
  const [hourText, minuteText] = String(value).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value || "--:--";
  }

  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")}`;
};

const getTodaysRemainingClasses = (entries = []) => {
  const now = new Date();
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const remainingClasses = entries
    .filter((entry) => {
      if (entry.day !== todayName) {
        return false;
      }

      return getMinutesFromTime(entry.endTime) >= currentMinutes;
    })
    .sort((left, right) => {
      return getMinutesFromTime(left.startTime) - getMinutesFromTime(right.startTime);
    })
    .map((entry) => ({
      id: entry._id || `${entry.day}-${entry.startTime}-${entry.endTime}-${entry.subjectName}`,
      subject: entry.subject?.name || entry.subjectName || "Subject",
      timeLabel: `${formatTime(entry.startTime)}-${formatTime(entry.endTime)}`,
      room: entry.room || "Room pending",
      classSection: entry.classSection || "",
    }));

  return {
    todayName,
    remainingClasses,
  };
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

  const modalTitle = editingReminderId ? "Edit Personal Reminder" : "Add Personal Reminder";
  const { todayName, remainingClasses } = getTodaysRemainingClasses(entries);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Routine</h1>
          <p className="text-slate-500">Weekly class schedule and reminders</p>
        </div>

        <button
          onClick={openReminderModal}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700"
        >
          + Add Personal Reminder
        </button>
      </div>

      {!loading && !error ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Today's Remaining Classes
              </h2>
              <p className="text-sm text-slate-500">{todayName}</p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {remainingClasses.length} class{remainingClasses.length === 1 ? "" : "es"} left
            </span>
          </div>

          {remainingClasses.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No remaining classes for today.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {remainingClasses.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.subject}</p>
                        {item.classSection ? (
                          <p className="text-sm text-slate-500">{item.classSection}</p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                        {item.timeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPinIcon className="h-4 w-4 text-indigo-500" />
                      <span>{item.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-500">Loading routine...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <TimetableGrid entries={entries} />
      )}

      {remindersLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-500">Loading reminders...</p>
        </div>
      ) : (
        <Reminders
          reminders={reminders}
          onDelete={deleteReminder}
          onEdit={openEditReminderModal}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-3xl font-semibold text-slate-900">{modalTitle}</h2>

            <form onSubmit={saveReminder} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="E.g., Study Session, Revision"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                >
                  {reminderTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReminderModal}
                  className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReminder}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-medium text-white disabled:opacity-60"
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
