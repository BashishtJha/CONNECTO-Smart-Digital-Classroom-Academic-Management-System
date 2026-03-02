import { useEffect, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

const getTodayName = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" });

const formatTime = (value) => {
  if (!value) return "";
  const [hourText, minuteText] = String(value).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText || 0);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};

const formatRelativeDue = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Due date unavailable";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((dueStart - todayStart) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return `Due Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return `Due Tomorrow, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays > 1) return `Due in ${diffDays} days`;
  return `Overdue by ${Math.abs(diffDays)} days`;
};

const attendanceTag = (overall) => {
  if (overall >= 85) return { label: "Excellent", color: "bg-green-100 text-green-700" };
  if (overall >= 75) return { label: "Good Standing", color: "bg-green-100 text-green-700" };
  if (overall >= 60) return { label: "Needs Focus", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Low Attendance", color: "bg-red-100 text-red-700" };
};

const Home = () => {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [studentName, setStudentName] = useState("Student");
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(0);

  const attendanceMeta = useMemo(
    () => attendanceTag(overallAttendance),
    [overallAttendance]
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [userRes, subjectsRes, routineRes, roomsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/subjects", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/routine/student", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/chat/rooms", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const subjects = subjectsRes.data || [];
        const subjectNameById = new Map(
          subjects.map((subject) => [String(subject._id), subject.name])
        );

        setStudentName(userRes.data?.name || "Student");

        const todayName = getTodayName();
        const classes = (routineRes.data || [])
          .filter((entry) => entry.day === todayName)
          .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
          .map((entry) => ({
            id: entry._id,
            subject: entry.subject?.name || entry.subjectName || "Subject",
            time: `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
            room: entry.room || "Room TBA",
          }));
        setTodaysClasses(classes);

        const assignmentResponses = await Promise.all(
          subjects.map((subject) =>
            axios
              .get(`http://localhost:5000/api/assignments/subject/${subject._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) => ({ subject, assignments: res.data || [] }))
              .catch(() => ({ subject, assignments: [] }))
          )
        );

        const pending = assignmentResponses
          .flatMap(({ subject, assignments }) =>
            assignments
              .filter((item) => item.studentStatus !== "submitted")
              .map((item) => ({
                id: item._id,
                title: item.title,
                dueDate: item.dueDate,
                subjectName: subject.name,
              }))
          )
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setPendingAssignments(pending);

        const attendanceResponses = await Promise.all(
          subjects.map((subject) =>
            axios
              .get(
                `http://localhost:5000/api/attendance/student/${subject._id}/summary`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .then((res) => ({ subject, summary: res.data }))
              .catch(() => ({ subject, summary: { percentage: 0 } }))
          )
        );

        const rows = attendanceResponses.map(({ subject, summary }) => ({
          label: subject.name,
          value: summary.percentage || 0,
        }));

        setAttendanceRows(rows.slice(0, 4));

        if (rows.length > 0) {
          const avg = Math.round(
            rows.reduce((sum, item) => sum + item.value, 0) / rows.length
          );
          setOverallAttendance(avg);
        } else {
          setOverallAttendance(0);
        }

        const rooms = roomsRes.data || [];
        const announcementResponses = await Promise.all(
          rooms.map((room) =>
            axios
              .get(`http://localhost:5000/api/chat/rooms/${room._id}/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) =>
                (res.data || []).map((ann) => ({
                  id: ann._id,
                  title: ann.title,
                  content: ann.content,
                  createdAt: ann.createdAt,
                  subjectName:
                    room.subject?.name || subjectNameById.get(String(room.subject?._id || room.subject)) || "Class",
                }))
              )
              .catch(() => [])
          )
        );

        const allAnnouncements = announcementResponses
          .flat()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setAnnouncements(allAnnouncements.slice(0, 2));
      } catch (err) {
        console.error("Failed to load student home dashboard", err);
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  if (loading) {
    return <p className="p-6">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="p-6">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {studentName}!</h1>
        <p className="text-gray-500">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card
            title="Today's Classes"
            icon={<CalendarDaysIcon className="h-6 w-6 text-indigo-600" />}
          >
            {todaysClasses.length === 0 ? (
              <p className="text-sm text-gray-500">No classes scheduled for today.</p>
            ) : (
              todaysClasses.map((item) => (
                <ClassItem
                  key={item.id}
                  subject={item.subject}
                  time={item.time}
                  room={item.room}
                />
              ))
            )}
          </Card>

          <Card title="Deadlines" icon={<ClockIcon className="h-6 w-6 text-yellow-500" />}>
            {pendingAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">No pending assignments.</p>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.slice(0, 2).map((item) => (
                  <div key={item.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      {item.subjectName} - {formatRelativeDue(item.dueDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Attendance" icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-bold">{overallAttendance}%</p>
              <span className={`text-sm px-3 py-1 rounded-full ${attendanceMeta.color}`}>
                {attendanceMeta.label}
              </span>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${overallAttendance}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {attendanceRows.length === 0 ? (
                <p className="text-sm text-gray-500">No attendance data yet.</p>
              ) : (
                attendanceRows.map((row) => (
                  <Progress key={row.label} label={row.label} value={`${row.value}%`} />
                ))
              )}
            </div>
          </Card>

          <Card title="Announcements" icon={<BellIcon className="h-6 w-6 text-indigo-500" />}>
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500">No announcements yet.</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((item) => (
                  <div key={item.id}>
                    <p className="font-medium text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.subjectName}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const ClassItem = ({ subject, time, room }) => (
  <div className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50">
    <div>
      <p className="font-medium text-gray-800">{subject}</p>
      <p className="text-sm text-gray-500">
        {time} - {room}
      </p>
    </div>
    <BellIcon className="h-5 w-5 text-gray-400" />
  </div>
);

const Progress = ({ label, value }) => (
  <div className="flex justify-between text-gray-600">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default Home;
