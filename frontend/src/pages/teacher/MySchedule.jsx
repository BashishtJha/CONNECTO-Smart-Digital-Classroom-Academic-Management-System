import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BellAlertIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const REMINDER_OPTIONS = [10, 30, 60];

const ALARM_ENABLED_KEY = "teacherScheduleAlarmEnabled";
const REMINDER_TIME_KEY = "teacherScheduleReminderMinutes";
const CLASS_ALARM_MAP_KEY = "teacherScheduleClassAlarmMap";

const getMinutesFromTime = (timeString = "") => {
  const [rawHour, rawMinute] = String(timeString).split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hour * 60 + minute;
};

const formatTime = (timeString = "") => {
  const [rawHour, rawMinute] = String(timeString).split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "--:--";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const MySchedule = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alarmEnabled, setAlarmEnabled] = useState(() => {
    const stored = localStorage.getItem(ALARM_ENABLED_KEY);
    return stored === null ? true : stored === "true";
  });
  const [reminderMinutes, setReminderMinutes] = useState(() => {
    const stored = Number(localStorage.getItem(REMINDER_TIME_KEY));
    return REMINDER_OPTIONS.includes(stored) ? stored : 10;
  });
  const [classAlarmMap, setClassAlarmMap] = useState(() => {
    try {
      const stored = localStorage.getItem(CLASS_ALARM_MAP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    localStorage.setItem(ALARM_ENABLED_KEY, String(alarmEnabled));
  }, [alarmEnabled]);

  useEffect(() => {
    localStorage.setItem(REMINDER_TIME_KEY, String(reminderMinutes));
  }, [reminderMinutes]);

  useEffect(() => {
    localStorage.setItem(CLASS_ALARM_MAP_KEY, JSON.stringify(classAlarmMap));
  }, [classAlarmMap]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError("");

        const [routineResult, subjectsResult] = await Promise.allSettled([
          axios.get("http://localhost:5000/api/routine/teacher", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/subjects/my", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (routineResult.status !== "fulfilled") {
          throw routineResult.reason;
        }

        const routineData = routineResult.value?.data || [];
        const subjectsData =
          subjectsResult.status === "fulfilled" ? subjectsResult.value?.data || [] : [];

        const subjectCountById = new Map();
        const subjectCountByName = new Map();

        subjectsData.forEach((subject) => {
          const count = Array.isArray(subject.students) ? subject.students.length : 0;
          if (subject._id) {
            subjectCountById.set(String(subject._id), count);
          }
          if (subject.name) {
            subjectCountByName.set(String(subject.name).trim().toLowerCase(), count);
          }
        });

        const normalizedEntries = routineData.map((entry) => {
          const subjectId =
            typeof entry.subject === "string" ? entry.subject : entry.subject?._id;
          const subjectName = entry.subject?.name || entry.subjectName || "";
          const countFromId = subjectId
            ? subjectCountById.get(String(subjectId))
            : undefined;
          const countFromName = subjectCountByName.get(
            String(subjectName).trim().toLowerCase()
          );

          return {
            ...entry,
            studentCount:
              typeof countFromId === "number"
                ? countFromId
                : typeof countFromName === "number"
                ? countFromName
                : null,
          };
        });

        setEntries(normalizedEntries);
      } catch (err) {
        console.error("Failed to fetch teacher schedule", err);
        setError(err?.response?.data?.message || "Failed to load schedule");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [token]);

  const today = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long" }),
    []
  );

  const todayDateLabel = useMemo(
    () =>
      new Date()
        .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
        .toUpperCase(),
    []
  );

  const todaysClasses = useMemo(() => {
    return entries
      .filter((entry) => String(entry.day).toLowerCase() === today.toLowerCase())
      .sort((a, b) => getMinutesFromTime(a.startTime) - getMinutesFromTime(b.startTime));
  }, [entries, today]);

  const toggleClassAlarm = (entryId) => {
    setClassAlarmMap((prev) => ({
      ...prev,
      [entryId]: !(prev[entryId] ?? true),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarDaysIcon className="h-9 w-9 text-indigo-600" />
            My Schedule
          </h1>
          <p className="text-slate-500 mt-1">Today's teaching schedule</p>
        </div>

        <div className="self-start rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold tracking-wide text-slate-500">
          {todayDateLabel}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Alarm Settings</h2>

        <div className="mt-5 border-b border-slate-200 pb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BellAlertIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-slate-900 font-medium text-lg">Notify before every class</p>
              <p className="text-slate-500">Get reminders for all scheduled classes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAlarmEnabled((prev) => !prev)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
              alarmEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
            aria-label="Toggle class alarms"
          >
            <span
              className={`h-6 w-6 transform rounded-full bg-white transition ${
                alarmEnabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="pt-5">
          <p className="text-slate-700 mb-3">Reminder time:</p>
          <div className="flex flex-wrap gap-3">
            {REMINDER_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setReminderMinutes(minutes)}
                className={`rounded-xl px-5 py-2 font-semibold transition ${
                  reminderMinutes === minutes
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {minutes === 60 ? "1 hour" : `${minutes} min`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Today's Classes</h2>

        {loading ? (
          <p className="mt-4 text-slate-500">Loading schedule...</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : todaysClasses.length === 0 ? (
          <p className="mt-4 text-slate-500">No classes scheduled for {today}.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {todaysClasses.map((entry, index) => {
              const entryId =
                entry._id ||
                `${entry.day}-${entry.startTime}-${entry.endTime}-${entry.subjectName}-${index}`;
              const classSpecificEnabled = classAlarmMap[entryId] ?? true;
              const alarmOn = alarmEnabled && classSpecificEnabled;
              const subjectName = entry.subject?.name || entry.subjectName || "Subject";

              return (
                <div
                  key={entryId}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-5">
                    <div className="min-w-[74px] text-indigo-600">
                      <div className="flex items-center gap-2 font-bold text-lg">
                        <ClockIcon className="h-5 w-5" />
                        <span>{formatTime(entry.startTime)}</span>
                      </div>
                      <p className="ml-7 text-sm text-slate-400">{formatTime(entry.endTime)}</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900">{subjectName}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-slate-500">
                        <span className="text-indigo-600 font-medium">
                          {entry.classSection || "Class"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPinIcon className="h-4 w-4" />
                          {entry.room || "Room TBA"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserGroupIcon className="h-4 w-4" />
                          {typeof entry.studentCount === "number"
                            ? `${entry.studentCount} students`
                            : "Students TBA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleClassAlarm(entryId)}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 font-semibold transition ${
                      alarmOn
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    <BellAlertIcon className="h-5 w-5" />
                    Alarm {alarmOn ? "ON" : "OFF"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MySchedule;
