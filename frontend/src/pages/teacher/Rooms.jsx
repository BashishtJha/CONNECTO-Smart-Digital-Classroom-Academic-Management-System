import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

const tabs = ["Chat", "Announcements", "Attendance", "Assignments", "Room Info"];

const todayInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatPrettyDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatRelativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diff < day) {
    return "Today";
  }
  if (diff < day * 2) {
    return "Yesterday";
  }
  return `${Math.floor(diff / day)} days ago`;
};

const getProgressClass = (percentage) => {
  if (percentage >= 90) return "bg-emerald-500";
  if (percentage >= 75) return "bg-amber-500";
  return "bg-red-500";
};

const getEntityId = (entry) => String(entry?._id || entry || "");

const uniqueUsersById = (list = []) => {
  const map = new Map();

  list.forEach((item) => {
    const id = getEntityId(item);
    if (!id || map.has(id)) return;
    if (item && typeof item === "object") {
      map.set(id, item);
      return;
    }
    map.set(id, { _id: id, name: "User", email: "" });
  });

  return Array.from(map.values());
};

const Rooms = () => {
  const token = localStorage.getItem("token");

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState("");

  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [activeTab, setActiveTab] = useState("Chat");
  const [attendanceDate, setAttendanceDate] = useState(todayInputValue());

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [students, setStudents] = useState([]);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [groupSaving, setGroupSaving] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedPrimaryOwnerId, setSelectedPrimaryOwnerId] = useState("");

  const activeSubject = useMemo(
    () => subjects.find((item) => item._id === activeSubjectId) || null,
    [subjects, activeSubjectId]
  );

  const activeStudents = useMemo(
    () => uniqueUsersById(activeSubject?.students || []),
    [activeSubject]
  );

  const activeOwners = useMemo(
    () => uniqueUsersById([activeSubject?.teacher, ...(activeSubject?.owners || [])]),
    [activeSubject]
  );

  const activeFaculty = useMemo(
    () =>
      uniqueUsersById([
        activeSubject?.teacher,
        ...(activeSubject?.owners || []),
        ...(activeSubject?.faculty || []),
      ]),
    [activeSubject]
  );

  const activeStudentIds = useMemo(
    () => new Set(activeStudents.map((item) => getEntityId(item))),
    [activeStudents]
  );

  const activeFacultyIds = useMemo(
    () => new Set(activeFaculty.map((item) => getEntityId(item))),
    [activeFaculty]
  );

  const activeOwnerIds = useMemo(
    () => new Set(activeOwners.map((item) => getEntityId(item))),
    [activeOwners]
  );

  const studentsToAdd = useMemo(
    () => allStudents.filter((item) => !activeStudentIds.has(getEntityId(item))),
    [allStudents, activeStudentIds]
  );

  const teachersToAdd = useMemo(
    () => allTeachers.filter((item) => !activeFacultyIds.has(getEntityId(item))),
    [allTeachers, activeFacultyIds]
  );

  const ownersToAdd = useMemo(
    () => allTeachers.filter((item) => !activeOwnerIds.has(getEntityId(item))),
    [allTeachers, activeOwnerIds]
  );

  const roomBySubject = useMemo(() => {
    const map = new Map();
    rooms.forEach((room) => {
      const subjectId = room.subject?._id || room.subject;
      if (subjectId) {
        map.set(String(subjectId), room);
      }
    });
    return map;
  }, [rooms]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data?._id || "");
    } catch (err) {
      console.error("Failed to fetch current user", err);
      setCurrentUserId("");
    }
  }, [token]);

  const fetchSubjects = useCallback(async (preferredSubjectId = "") => {
    try {
      setSubjectsLoading(true);
      const res = await axios.get("http://localhost:5000/api/subjects/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data || [];
      setSubjects(list);
      setActiveSubjectId((prev) => {
        if (preferredSubjectId && list.some((subject) => subject._id === preferredSubjectId)) {
          return preferredSubjectId;
        }
        if (prev && list.some((subject) => subject._id === prev)) {
          return prev;
        }
        return list[0]?._id || "";
      });
    } catch (err) {
      console.error("Failed to fetch teacher subjects", err);
      setSubjects([]);
      setActiveSubjectId("");
    } finally {
      setSubjectsLoading(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const [studentsRes, teachersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/user/list", {
          params: { role: "student" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/user/list", {
          params: { role: "teacher" },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAllStudents(studentsRes.data || []);
      setAllTeachers(teachersRes.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setAllStudents([]);
      setAllTeachers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data || []);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
      setRooms([]);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
    fetchSubjects();
    fetchRooms();
    fetchUsers();
  }, [fetchCurrentUser, fetchSubjects, fetchRooms, fetchUsers]);

  useEffect(() => {
    setRenameValue(activeSubject?.name || "");
    setSelectedPrimaryOwnerId(getEntityId(activeSubject?.teacher));
    setSelectedStudentId("");
    setSelectedTeacherId("");
    setSelectedOwnerId("");
  }, [activeSubject]);

  useEffect(() => {
    if (!activeSubjectId) {
      setActiveRoomId("");
      return;
    }

    const room = roomBySubject.get(String(activeSubjectId));
    setActiveRoomId(room?._id || "");
  }, [activeSubjectId, roomBySubject]);

  const ensureRoomForActiveSubject = useCallback(async () => {
    if (!activeSubjectId) return "";

    const existing = roomBySubject.get(String(activeSubjectId));
    if (existing?._id) {
      return existing._id;
    }

    try {
      const created = await axios.post(
        "http://localhost:5000/api/chat/rooms",
        {
          subjectId: activeSubjectId,
          name: activeSubject?.name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRooms((prev) => [created.data, ...prev]);
      return created.data._id;
    } catch (err) {
      if (err?.response?.status === 409) {
        try {
          const res = await axios.get("http://localhost:5000/api/chat/rooms", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const refreshedRooms = res.data || [];
          setRooms(refreshedRooms);
          const matched = refreshedRooms.find((room) => {
            const subjectId = room.subject?._id || room.subject;
            return String(subjectId) === String(activeSubjectId);
          });
          return matched?._id || "";
        } catch (refreshErr) {
          console.error("Failed to refresh rooms after conflict", refreshErr);
          return "";
        }
      }

      console.error("Failed to ensure room", err);
      return "";
    }
  }, [activeSubject?.name, activeSubjectId, roomBySubject, token]);

  const fetchMessages = useCallback(async ({ roomId = activeRoomId, silent = false } = {}) => {
    if (!roomId) return;

    try {
      if (!silent) {
        setMessagesLoading(true);
      }

      const res = await axios.get(
        `http://localhost:5000/api/chat/rooms/${roomId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      if (!silent) {
        setMessages([]);
      }
    } finally {
      if (!silent) {
        setMessagesLoading(false);
      }
    }
  }, [activeRoomId, token]);

  useEffect(() => {
    if (activeTab !== "Chat") return;

    const load = async () => {
      const roomId = await ensureRoomForActiveSubject();
      if (!roomId) {
        setMessages([]);
        return;
      }

      setActiveRoomId(roomId);
      await fetchMessages({ roomId });
    };

    load();
  }, [activeTab, ensureRoomForActiveSubject, fetchMessages]);

  useEffect(() => {
    if (activeTab !== "Chat" || !activeRoomId) return;

    const timer = setInterval(() => {
      fetchMessages({ silent: true });
    }, 5000);

    return () => clearInterval(timer);
  }, [activeRoomId, activeTab, fetchMessages]);

  const sendMessage = async () => {
    if (!chatText.trim()) return;

    try {
      setSendingMessage(true);
      const roomId = activeRoomId || (await ensureRoomForActiveSubject());
      if (!roomId) return;

      await axios.post(
        `http://localhost:5000/api/chat/rooms/${roomId}/messages`,
        { text: chatText.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setChatText("");
      await fetchMessages();
      await fetchRooms();
    } catch (err) {
      console.error("Failed to send message", err);
      alert(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    const cleanName = newGroupName.trim();
    const cleanCode = newGroupCode.trim();

    if (!cleanName) {
      alert("Group name is required");
      return;
    }

    try {
      setCreatingGroup(true);
      const res = await axios.post(
        "http://localhost:5000/api/subjects",
        {
          name: cleanName,
          code: cleanCode || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdId = res.data?._id || "";
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupCode("");
      await fetchSubjects(createdId);
      await fetchRooms();
    } catch (err) {
      console.error("Failed to create group", err);
      alert(err?.response?.data?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const updateActiveGroup = async (payload) => {
    if (!activeSubjectId) return null;

    try {
      setGroupSaving(true);
      const res = await axios.patch(
        `http://localhost:5000/api/subjects/${activeSubjectId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updated = res.data;
      if (updated?._id) {
        setSubjects((prev) =>
          prev.map((subject) =>
            subject._id === updated._id ? updated : subject
          )
        );
      }

      await fetchRooms();
      return updated;
    } catch (err) {
      console.error("Failed to update group", err);
      alert(err?.response?.data?.message || "Failed to update group");
      return null;
    } finally {
      setGroupSaving(false);
    }
  };

  const renameGroup = async () => {
    const cleanName = renameValue.trim();
    if (!cleanName) {
      alert("Group name is required");
      return;
    }
    await updateActiveGroup({ name: cleanName });
  };

  const addStudentToGroup = async () => {
    if (!selectedStudentId) return;
    const updated = await updateActiveGroup({ addStudentIds: [selectedStudentId] });
    if (updated) {
      setSelectedStudentId("");
    }
  };

  const removeStudentFromGroup = async (studentId) => {
    await updateActiveGroup({ removeStudentIds: [studentId] });
  };

  const addFacultyToGroup = async () => {
    if (!selectedTeacherId) return;
    const updated = await updateActiveGroup({ addFacultyIds: [selectedTeacherId] });
    if (updated) {
      setSelectedTeacherId("");
    }
  };

  const removeFacultyFromGroup = async (teacherId) => {
    await updateActiveGroup({ removeFacultyIds: [teacherId] });
  };

  const addOwnerToGroup = async () => {
    if (!selectedOwnerId) return;
    const updated = await updateActiveGroup({ addOwnerIds: [selectedOwnerId] });
    if (updated) {
      setSelectedOwnerId("");
    }
  };

  const removeOwnerFromGroup = async (ownerId) => {
    await updateActiveGroup({ removeOwnerIds: [ownerId] });
  };

  const transferPrimaryOwner = async () => {
    if (!selectedPrimaryOwnerId) return;
    await updateActiveGroup({ primaryOwnerId: selectedPrimaryOwnerId });
  };

  const fetchDailyAttendance = useCallback(async () => {
    if (!activeSubjectId) return;

    try {
      setAttendanceLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/attendance/teacher/${activeSubjectId}/date`,
        {
          params: { date: attendanceDate },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStudents(res.data.students || []);
      setAttendanceMarked(Boolean(res.data.marked));
    } catch (err) {
      console.error("Failed to fetch attendance sheet", err);
      setStudents([]);
      setAttendanceMarked(false);
    } finally {
      setAttendanceLoading(false);
    }
  }, [activeSubjectId, attendanceDate, token]);

  useEffect(() => {
    if (activeTab !== "Attendance") return;
    fetchDailyAttendance();
  }, [activeTab, fetchDailyAttendance]);

  const fetchSummary = useCallback(async () => {
    if (!activeSubjectId) return;

    try {
      setSummaryLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/attendance/teacher/${activeSubjectId}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch attendance summary", err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [activeSubjectId, token]);

  useEffect(() => {
    if (activeTab !== "Room Info") return;
    fetchSummary();
  }, [activeTab, fetchSummary]);

  const fetchAnnouncements = useCallback(async () => {
    if (!activeSubjectId) return;

    try {
      setAnnouncementLoading(true);
      const roomId = await ensureRoomForActiveSubject();
      if (!roomId) {
        setAnnouncements([]);
        return;
      }

      setActiveRoomId(roomId);

      const res = await axios.get(
        `http://localhost:5000/api/chat/rooms/${roomId}/announcements`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
      setAnnouncements([]);
    } finally {
      setAnnouncementLoading(false);
    }
  }, [activeSubjectId, ensureRoomForActiveSubject, token]);

  useEffect(() => {
    if (activeTab !== "Announcements") return;
    fetchAnnouncements();
  }, [activeTab, fetchAnnouncements]);

  const postAnnouncement = async (e) => {
    e.preventDefault();

    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert("Title and content are required");
      return;
    }

    try {
      setAnnouncementSaving(true);
      const roomId = await ensureRoomForActiveSubject();
      if (!roomId) {
        alert("Unable to create room for this subject");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/chat/rooms/${roomId}/announcements`,
        {
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnnouncementTitle("");
      setAnnouncementContent("");
      await fetchRooms();
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to post announcement", err);
      alert(err?.response?.data?.message || "Failed to post announcement");
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const fetchAssignments = useCallback(async () => {
    if (!activeSubjectId) return;

    try {
      setAssignmentsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/assignments/subject/${activeSubjectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [activeSubjectId, token]);

  useEffect(() => {
    if (activeTab !== "Assignments") return;
    fetchAssignments();
  }, [activeTab, fetchAssignments]);

  const setStatus = (studentId, status) => {
    setStudents((prev) =>
      prev.map((student) =>
        String(student.studentId) === String(studentId)
          ? { ...student, status }
          : student
      )
    );
  };

  const saveAttendance = async () => {
    if (!activeSubjectId || students.length === 0) return;

    try {
      setSavingAttendance(true);

      await axios.post(
        `http://localhost:5000/api/attendance/${activeSubjectId}/mark`,
        {
          date: attendanceDate,
          records: students.map((student) => ({
            studentId: student.studentId,
            status: student.status,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAttendanceMarked(true);
      alert("Attendance saved");
    } catch (err) {
      console.error("Failed to save attendance", err);
      alert(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSavingAttendance(false);
    }
  };

  const downloadSummaryReport = () => {
    if (!summary || !summary.students) return;

    const doc = new jsPDF("p", "mm", "a4");
    const now = new Date();
    const title = `${activeSubject?.name || "Subject"} Attendance Report`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - 14;
    const headerY = 12;

    const drawHeader = () => {
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CONNECTO", left, headerY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Teacher Attendance Report", left, headerY + 6);
      doc.setTextColor(17, 24, 39);
    };

    const drawFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 8, {
        align: "center",
      });
      doc.text("Generated by Connecto", right, pageHeight - 8, {
        align: "right",
      });
      doc.setTextColor(17, 24, 39);
    };

    const drawTableHeader = (y) => {
      doc.setFillColor(243, 244, 246);
      doc.rect(left, y - 5, right - left, 8, "F");
      doc.setDrawColor(229, 231, 235);
      doc.rect(left, y - 5, right - left, 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Student", left + 2, y);
      doc.text("Roll No", 82, y);
      doc.text("Present", 116, y);
      doc.text("Absent", 136, y);
      doc.text("Total", 156, y);
      doc.text("%", 176, y);
      doc.setFont("helvetica", "normal");
      return y + 9;
    };

    drawHeader();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, left, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, left, 46);
    doc.text(`Total Students: ${summary.totalStudents || 0}`, left, 52);
    doc.text(`Total Sessions: ${summary.totalSessions || 0}`, left, 58);

    let y = drawTableHeader(68);

    summary.students.forEach((row) => {
      if (y > pageHeight - 18) {
        drawFooter();
        doc.addPage();
        drawHeader();
        y = drawTableHeader(40);
      }

      const percentage = row.percentage ?? 0;
      doc.setDrawColor(229, 231, 235);
      doc.line(left, y + 2, right, y + 2);
      doc.text(String(row.name || "-"), left + 2, y);
      doc.text(String(row.rollNo || "-"), 82, y);
      doc.text(String(row.present ?? 0), 116, y);
      doc.text(String(row.absent ?? 0), 136, y);
      doc.text(String(row.total ?? 0), 156, y);

      if (percentage >= 90) {
        doc.setTextColor(5, 150, 105);
      } else if (percentage >= 75) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(`${percentage}%`, 176, y);
      doc.setTextColor(17, 24, 39);

      y += 7;
    });

    drawFooter();
    doc.save(`${activeSubject?.name || "attendance"}-report.pdf`);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border flex min-h-[640px] overflow-hidden">
      <div className="w-72 border-r p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl">My Classrooms</h2>
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xl leading-none hover:bg-indigo-700"
            title="Create new group"
          >
            +
          </button>
        </div>

        {subjectsLoading ? (
          <p className="text-sm text-gray-500">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-gray-500">No subjects assigned. Use + to create one.</p>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <button
                key={subject._id}
                onClick={() => setActiveSubjectId(subject._id)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  activeSubjectId === subject._id
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{subject.name}</div>
                <div className="text-sm text-gray-500">
                  {subject.students?.length || 0} Students
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {!activeSubject ? (
          <div className="p-8 text-gray-500">Select a classroom.</div>
        ) : (
          <>
            <div className="border-b px-6 py-4">
              <h3 className="text-3xl font-semibold">{activeSubject.name}</h3>
              <p className="text-sm text-gray-500">{activeSubject.code}</p>

              <div className="mt-4 flex gap-6 text-sm font-medium">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 border-b-2 transition ${
                      activeTab === tab
                        ? "text-indigo-600 border-indigo-600"
                        : "text-gray-500 border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-6 ${activeTab === "Chat" ? "flex-1 overflow-y-auto bg-gray-50" : ""}`}>
              {activeTab === "Chat" && (
                <>
                  {messagesLoading ? (
                    <p>Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-gray-500">No messages yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = String(msg.sender?._id) === String(currentUserId);
                        return (
                          <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-lg ${isOwn ? "text-right" : "text-left"}`}>
                              <div className="text-xs text-gray-500 mb-1">
                                {!isOwn && (
                                  <>
                                    <span className="font-semibold text-indigo-700 mr-2">{msg.sender?.name || "User"}</span>
                                    {msg.sender?.role === "teacher" && (
                                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 mr-2">TEACHER</span>
                                    )}
                                  </>
                                )}
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className={`px-4 py-3 rounded-2xl ${isOwn ? "bg-indigo-600 text-white" : "bg-white border"}`}>
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === "Announcements" && (
                <div className="space-y-6">
                  <form onSubmit={postAnnouncement} className="border rounded-xl p-4">
                    <h4 className="text-2xl font-semibold mb-4">Post New Announcement</h4>
                    <input
                      type="text"
                      placeholder="Title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mb-3"
                    />
                    <textarea
                      rows={4}
                      placeholder="Write announcement details..."
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mb-3"
                    />
                    <button
                      type="submit"
                      disabled={announcementSaving}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      {announcementSaving ? "Posting..." : "Post"}
                    </button>
                  </form>

                  <div>
                    {announcementLoading ? (
                      <p>Loading announcements...</p>
                    ) : announcements.length === 0 ? (
                      <p className="text-gray-500">No announcements yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((item) => (
                          <div key={item._id} className="border rounded-xl p-5">
                            <h5 className="text-2xl font-semibold">{item.title}</h5>
                            <p className="text-gray-700 mt-3">{item.content}</p>
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                              <span>{item.author?.name || "Teacher"}</span>
                              <span>{formatRelativeTime(item.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "Attendance" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-3xl font-semibold">Daily Attendance</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                      />
                      <span className="text-sm text-gray-500">
                        {formatPrettyDate(attendanceDate)}
                      </span>
                    </div>
                  </div>

                  {attendanceLoading ? (
                    <p>Loading attendance sheet...</p>
                  ) : students.length === 0 ? (
                    <p className="text-gray-500">No students in this subject.</p>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                          <tr>
                            <th className="px-6 py-4">STUDENT NAME</th>
                            <th className="px-6 py-4">ROLL NO.</th>
                            <th className="px-6 py-4">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.studentId} className="border-t">
                              <td className="px-6 py-4 font-medium">{student.name}</td>
                              <td className="px-6 py-4 text-gray-600">{student.rollNo}</td>
                              <td className="px-6 py-4">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => setStatus(student.studentId, "present")}
                                    className={`px-4 py-2 rounded-lg border text-sm ${
                                      student.status === "present"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-white text-gray-600"
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    onClick={() => setStatus(student.studentId, "absent")}
                                    className={`px-4 py-2 rounded-lg border text-sm ${
                                      student.status === "absent"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-white text-gray-600"
                                    }`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={saveAttendance}
                      disabled={savingAttendance || students.length === 0}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      {savingAttendance
                        ? "Saving..."
                        : attendanceMarked
                        ? "Update Attendance"
                        : "Save Attendance"}
                    </button>
                    {attendanceMarked && (
                      <span className="text-sm text-emerald-600">
                        Attendance already marked for this date.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "Assignments" && (
                <div>
                  {assignmentsLoading ? (
                    <p>Loading assignments...</p>
                  ) : assignments.length === 0 ? (
                    <p className="text-gray-500">No assignments yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((item) => (
                        <div key={item._id} className="border rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{item.title}</h4>
                            <span className="text-sm text-gray-500">
                              Due {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Room Info" && (
                <div>
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mb-8">
                    <div className="border rounded-xl p-4 overflow-hidden">
                      <h4 className="text-2xl font-semibold mb-4">Group Management</h4>

                      <div className="flex items-center gap-3 mb-4 min-w-0">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="flex-1 min-w-0 border rounded-lg px-3 py-2"
                          placeholder="Group name"
                        />
                        <button
                          type="button"
                          onClick={renameGroup}
                          disabled={groupSaving}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shrink-0 whitespace-nowrap disabled:opacity-60"
                        >
                          Rename
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Add student</option>
                            {studentsToAdd.map((student) => (
                              <option key={student._id} value={student._id}>
                                {student.name || student.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={addStudentToGroup}
                            disabled={!selectedStudentId || groupSaving}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-lg shrink-0 whitespace-nowrap disabled:opacity-60"
                          >
                            Add
                          </button>
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Add faculty</option>
                            {teachersToAdd.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.name || teacher.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={addFacultyToGroup}
                            disabled={!selectedTeacherId || groupSaving}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-lg shrink-0 whitespace-nowrap disabled:opacity-60"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <select
                            value={selectedOwnerId}
                            onChange={(e) => setSelectedOwnerId(e.target.value)}
                            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Add owner</option>
                            {ownersToAdd.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.name || teacher.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={addOwnerToGroup}
                            disabled={!selectedOwnerId || groupSaving}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-lg shrink-0 whitespace-nowrap disabled:opacity-60"
                          >
                            Add
                          </button>
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <select
                            value={selectedPrimaryOwnerId}
                            onChange={(e) => setSelectedPrimaryOwnerId(e.target.value)}
                            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Primary owner</option>
                            {allTeachers.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.name || teacher.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={transferPrimaryOwner}
                            disabled={!selectedPrimaryOwnerId || groupSaving}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg shrink-0 whitespace-nowrap disabled:opacity-60"
                          >
                            Set Owner
                          </button>
                        </div>
                      </div>

                      {usersLoading && (
                        <p className="text-sm text-gray-500 mt-3">Loading users...</p>
                      )}
                    </div>

                    <div className="border rounded-xl p-4">
                      <h5 className="text-xl font-semibold mb-3">Group Members</h5>

                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Owners</p>
                        <div className="space-y-2">
                          {activeOwners.length === 0 ? (
                            <p className="text-sm text-gray-500">No owners</p>
                          ) : (
                            activeOwners.map((owner) => {
                              const ownerId = getEntityId(owner);
                              const isPrimaryOwner =
                                ownerId === getEntityId(activeSubject?.teacher);
                              return (
                                <div key={ownerId} className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{owner.name || "Teacher"}</p>
                                    <p className="text-xs text-gray-500 truncate">{owner.email || ""}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isPrimaryOwner && (
                                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                        PRIMARY
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeOwnerFromGroup(ownerId)}
                                      disabled={isPrimaryOwner || groupSaving}
                                      className="text-xs text-red-600 disabled:opacity-40"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Faculty</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {activeFaculty.length === 0 ? (
                            <p className="text-sm text-gray-500">No faculty</p>
                          ) : (
                            activeFaculty.map((teacher) => {
                              const teacherId = getEntityId(teacher);
                              const isOwner = activeOwnerIds.has(teacherId);
                              return (
                                <div key={teacherId} className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{teacher.name || "Teacher"}</p>
                                    <p className="text-xs text-gray-500 truncate">{teacher.email || ""}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFacultyFromGroup(teacherId)}
                                    disabled={isOwner || groupSaving}
                                    className="text-xs text-red-600 shrink-0 disabled:opacity-40"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Students</p>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {activeStudents.length === 0 ? (
                            <p className="text-sm text-gray-500">No students</p>
                          ) : (
                            activeStudents.map((student) => {
                              const studentId = getEntityId(student);
                              return (
                                <div key={studentId} className="flex items-start justify-between gap-2 border rounded-lg px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{student.name || "Student"}</p>
                                    <p className="text-xs text-gray-500 truncate">{student.email || ""}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeStudentFromGroup(studentId)}
                                    disabled={groupSaving}
                                    className="text-xs text-red-600 shrink-0 disabled:opacity-40"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-3xl font-semibold">Room Information</h4>
                      <p className="text-gray-500 text-sm">
                        Total Students: {summary?.totalStudents ?? activeSubject.students?.length ?? 0}
                      </p>
                    </div>
                    <button
                      onClick={downloadSummaryReport}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
                    >
                      Download Attendance PDF
                    </button>
                  </div>

                  {summaryLoading ? (
                    <p>Loading room info...</p>
                  ) : !summary || !summary.students || summary.students.length === 0 ? (
                    <p className="text-gray-500">No attendance data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {summary.students.map((row) => (
                        <div key={row.studentId} className="border rounded-xl p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-lg">{row.name}</div>
                              <div className="text-sm text-gray-500">Roll No: {row.rollNo}</div>
                            </div>
                            <div className="text-3xl font-semibold">{row.percentage}%</div>
                          </div>
                          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressClass(row.percentage)}`}
                              style={{ width: `${row.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeTab === "Chat" && (
              <div className="border-t px-4 py-3 flex items-center gap-3">
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {sendingMessage ? "..." : "Send"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-5">
            <h4 className="text-2xl font-semibold mb-4">Create New Group</h4>
            <form onSubmit={createGroup}>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Subject / Group name"
                  className="w-full border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value)}
                  placeholder="Code (optional)"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setNewGroupCode("");
                  }}
                  disabled={creatingGroup}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
                >
                  {creatingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Rooms;
