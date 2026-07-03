import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const tabs = ["Chat", "Announcements", "Assignments"];

const formatRelativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diff < day) return "Today";
  if (diff < day * 2) return "Yesterday";
  return `${Math.floor(diff / day)} days ago`;
};

const ChatRooms = () => {
  const token = localStorage.getItem("token");

  const [currentUserId, setCurrentUserId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("Chat");

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

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

  const fetchRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      const res = await axios.get("http://localhost:5000/api/chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data || [];
      setRooms(list);

      if (list.length > 0) {
        setActiveRoom((prev) => {
          if (!prev) return list[0];
          const latest = list.find((item) => item._id === prev._id);
          return latest || list[0];
        });
      } else {
        setActiveRoom(null);
      }
    } catch (err) {
      console.error("Failed to fetch rooms", err);
      setRooms([]);
      setActiveRoom(null);
    } finally {
      setRoomsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
    fetchRooms();
  }, [fetchCurrentUser, fetchRooms]);

  const fetchMessages = useCallback(async ({ silent = false } = {}) => {
    if (!activeRoom?._id) return;

    try {
      if (!silent) {
        setMessagesLoading(true);
      }

      const res = await axios.get(
        `http://localhost:5000/api/chat/rooms/${activeRoom._id}/messages`,
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
  }, [activeRoom?._id, token]);

  useEffect(() => {
    if (activeTab !== "Chat") return;
    fetchMessages();
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    if (activeTab !== "Chat" || !activeRoom?._id) return;

    const timer = setInterval(() => {
      fetchMessages({ silent: true });
    }, 5000);

    return () => clearInterval(timer);
  }, [activeTab, activeRoom?._id, fetchMessages]);

  const fetchAnnouncements = useCallback(async () => {
    if (!activeRoom?._id) return;

    try {
      setAnnouncementsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/chat/rooms/${activeRoom._id}/announcements`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [activeRoom?._id, token]);

  useEffect(() => {
    if (activeTab !== "Announcements") return;
    fetchAnnouncements();
  }, [activeTab, fetchAnnouncements]);

  const fetchAssignments = useCallback(async () => {
    const subjectId = activeRoom?.subject?._id;
    if (!subjectId) return;

    try {
      setAssignmentsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/assignments/subject/${subjectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [activeRoom?.subject?._id, token]);

  useEffect(() => {
    if (activeTab !== "Assignments") return;
    fetchAssignments();
  }, [activeTab, fetchAssignments]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom?._id) return;

    try {
      setSending(true);
      await axios.post(
        `http://localhost:5000/api/chat/rooms/${activeRoom._id}/messages`,
        { text: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      await fetchMessages();
      await fetchRooms();
    } catch (err) {
      console.error("Failed to send message", err);
      alert(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-64px)]">
      <div className="w-80 bg-white rounded-xl p-4 shadow-sm border">
        <h2 className="font-semibold text-lg mb-4">Chat Rooms</h2>

        {roomsLoading ? (
          <p className="text-sm text-gray-500">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-gray-500">No rooms available yet.</p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room._id}
                onClick={() => {
                  setActiveRoom(room);
                  setActiveTab("Chat");
                }}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  activeRoom?._id === room._id
                    ? "bg-indigo-50 border-indigo-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium">{room.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {room.teacher?.name ? `${room.teacher.name}: ` : ""}
                  {room.lastMessage || "No messages yet"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden">
        {!activeRoom ? (
          <div className="p-6 text-gray-500">Select a room.</div>
        ) : (
          <>
            <div className="border-b px-6 py-4">
              <h3 className="font-semibold text-3xl">{activeRoom.name}</h3>
              <p className="text-sm text-green-600">Online classroom</p>

              <div className="mt-3 flex gap-6 text-sm font-medium">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 border-b-2 ${
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

            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
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
                          <div
                            key={msg._id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
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
                              <div
                                className={`max-w-md px-4 py-3 rounded-xl text-sm ${
                                  isOwn
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white border"
                                }`}
                              >
                                <p>{msg.text}</p>
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
                <>
                  {announcementsLoading ? (
                    <p>Loading announcements...</p>
                  ) : announcements.length === 0 ? (
                    <p className="text-gray-500">No announcements yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((a) => (
                        <div key={a._id} className="bg-white border rounded-xl p-5">
                          <h4 className="font-semibold text-2xl mb-2">{a.title}</h4>
                          <p className="text-gray-700 mb-4">{a.content}</p>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>{a.author?.name || "Teacher"}</span>
                            <span>{formatRelativeTime(a.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "Assignments" && (
                <>
                  {assignmentsLoading ? (
                    <p>Loading assignments...</p>
                  ) : assignments.length === 0 ? (
                    <p className="text-gray-500">No assignments yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((item) => (
                        <div key={item._id} className="bg-white border rounded-xl p-5 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-xl">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Created {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Last Date {new Date(item.dueDate).toLocaleDateString()}
                            </p>
                            {item.attachmentUrl && (
                              <a
                                href={`http://localhost:5000${item.attachmentUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-2 text-sm text-indigo-600 hover:underline"
                              >
                                View Assignment PDF
                              </a>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              item.studentStatus === "submitted"
                                ? "bg-green-100 text-green-700"
                                : item.studentStatus === "not_submitted"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.studentStatus === "submitted"
                              ? "Submitted"
                              : item.studentStatus === "not_submitted"
                              ? "Not Submitted"
                              : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {activeTab === "Chat" && (
              <div className="border-t px-4 py-3 flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
                  disabled={sending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatRooms;
