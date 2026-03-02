import { useEffect, useState } from "react";
import axios from "axios";

const tabs = [
  "Syllabus",
  "Notes",
  "Video Lectures",
  "Assignments",
  "Resources",
  "Attendance",
];

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [activeTab, setActiveTab] = useState("Syllabus");
  const [loading, setLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");

  const [syllabus, setSyllabus] = useState([]);
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const [videoLectures, setVideoLectures] = useState([]);
  const [videoLecturesLoading, setVideoLecturesLoading] = useState(false);

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({ percentage: 0 });

  const token = localStorage.getItem("token");

  /* ================= FETCH SUBJECTS (ON LOAD) ================= */
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsError("");
        const res = await axios.get("http://localhost:5000/api/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSubjects(res.data);

        if (res.data.length > 0) {
          setSelectedSubject(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch subjects", err);
        setSubjectsError(
          err?.response?.data?.message || "Failed to load subjects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [token]);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchAttendanceSummary = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/attendance/student/${selectedSubject._id}/summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAttendanceSummary(res.data || { percentage: 0 });
      } catch (err) {
        console.error("Failed to fetch attendance summary", err);
        setAttendanceSummary({ percentage: 0 });
      }
    };

    fetchAttendanceSummary();
  }, [selectedSubject, token]);

  /* ================= FETCH SYLLABUS ================= */
  useEffect(() => {
    if (!selectedSubject || activeTab !== "Syllabus") return;

    const fetchSyllabus = async () => {
      try {
        setSyllabusLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/syllabus/${selectedSubject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSyllabus(res.data);
      } catch (err) {
        console.error("Failed to fetch syllabus", err);
        setSyllabus([]);
      } finally {
        setSyllabusLoading(false);
      }
    };

    fetchSyllabus();
  }, [selectedSubject, activeTab, token]);

  /* ================= FETCH NOTES ================= */
  useEffect(() => {
    if (!selectedSubject || activeTab !== "Notes") return;

    const fetchNotes = async () => {
      try {
        setNotesLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/notes/${selectedSubject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setNotes(res.data);
      } catch (err) {
        console.error("Failed to fetch notes", err);
        setNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };

    fetchNotes();
  }, [selectedSubject, activeTab, token]);

  /* ================= FETCH ASSIGNMENTS ================= */
  useEffect(() => {
    if (!selectedSubject || activeTab !== "Assignments") return;

    const fetchAssignments = async () => {
      try {
        setAssignmentsLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/assignments/subject/${selectedSubject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setAssignments(res.data);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
        setAssignments([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedSubject, activeTab, token]);

  /* ================= FETCH RESOURCES ================= */
  useEffect(() => {
    if (!selectedSubject || activeTab !== "Resources") return;

    const fetchResources = async () => {
      try {
        setResourcesLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/resources/${selectedSubject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setResources(res.data);
      } catch (err) {
        console.error("Failed to fetch resources", err);
        setResources([]);
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, [selectedSubject, activeTab, token]);

  /* ================= FETCH VIDEO LECTURES ================= */
  useEffect(() => {
    if (!selectedSubject || activeTab !== "Video Lectures") return;

    const fetchVideoLectures = async () => {
      try {
        setVideoLecturesLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/video-lectures/${selectedSubject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setVideoLectures(res.data);
      } catch (err) {
        console.error("Failed to fetch video lectures", err);
        setVideoLectures([]);
      } finally {
        setVideoLecturesLoading(false);
      }
    };

    fetchVideoLectures();
  }, [selectedSubject, activeTab, token]);

  /* ================= FETCH ATTENDANCE ================= */
  useEffect(() => {
    if (!selectedSubject || activeTab !== "Attendance") return;

    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/attendance/student/${selectedSubject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setAttendanceHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch attendance", err);
        setAttendanceHistory([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedSubject, activeTab, token]);

  const submitAssignment = async (assignmentId) => {
    const submissionUrl = window.prompt("Paste your submission link");
    if (!submissionUrl) return;

    try {
      await axios.post(
        `http://localhost:5000/api/assignments/${assignmentId}/submit`,
        { submissionUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const res = await axios.get(
        `http://localhost:5000/api/assignments/subject/${selectedSubject._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to submit assignment", err);
      alert("Failed to submit assignment");
    }
  };

  /* ================= LOADING ================= */
  if (loading) return <p className="p-6">Loading subjects...</p>;
  if (subjectsError) return <p className="p-6">{subjectsError}</p>;
  if (subjects.length === 0) return <p className="p-6">No subjects available.</p>;
  if (!selectedSubject) return <p className="p-6">Select a subject...</p>;

  return (
    <div className="flex gap-6">
      {/* LEFT PANEL */}
      <div className="w-72 bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-lg mb-4">Your Subjects</h2>

        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject._id}
              onClick={() => {
                setSelectedSubject(subject);
                setActiveTab("Syllabus");
              }}
              className={`p-3 rounded-lg cursor-pointer ${
                selectedSubject._id === subject._id
                  ? "bg-indigo-50 text-indigo-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="font-medium">{subject.name}</p>
              <p className="text-sm text-gray-500">{subject.code}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
        {/* HEADER */}
        <div className="border-b pb-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedSubject.name}</h1>
            <p className="text-gray-500">{selectedSubject.code}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Attendance</p>
            <p className="text-3xl font-semibold text-emerald-600">
              {attendanceSummary.percentage || 0}%
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="border-b mb-6 flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium ${
                activeTab === tab
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SYLLABUS */}
        {activeTab === "Syllabus" && (
          <>
            {syllabusLoading ? (
              <p>Loading syllabus...</p>
            ) : syllabus.length === 0 ? (
              <p>No syllabus available.</p>
            ) : (
              syllabus.map((unit) => (
                <div key={unit._id} className="border rounded-xl mb-4">
                  <div className="bg-gray-50 px-6 py-4 font-semibold">
                    {unit.unit}
                  </div>
                  <div className="divide-y">
                    {unit.topics.map((topic, i) => (
                      <div key={i} className="px-6 py-4">
                        {topic.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* NOTES */}
        {activeTab === "Notes" && (
          <>
            {notesLoading ? (
              <p>Loading notes...</p>
            ) : notes.length === 0 ? (
              <p>No notes available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {notes.map((note) => (
                  <div key={note._id} className="border rounded-xl p-4">
                    <h3 className="font-medium">{note.title}</h3>
                    <p className="text-sm text-gray-500">
                      Uploaded by {note.uploadedBy}
                    </p>
                    <a
                      href={`http://localhost:5000${note.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 text-sm"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ASSIGNMENTS */}
        {activeTab === "Assignments" && (
          <>
            {assignmentsLoading ? (
              <p>Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <p>No assignments available.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{assignment.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          assignment.studentStatus === "submitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {assignment.studentStatus === "submitted"
                          ? "Submitted"
                          : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {assignment.description}
                      </p>
                    )}
                    {assignment.studentStatus !== "submitted" && (
                      <button
                        onClick={() => submitAssignment(assignment._id)}
                        className="mt-3 bg-indigo-600 text-white text-sm px-3 py-1 rounded"
                      >
                        Submit Assignment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* RESOURCES */}
        {activeTab === "Resources" && (
          <>
            {resourcesLoading ? (
              <p>Loading resources...</p>
            ) : resources.length === 0 ? (
              <p>No resources available.</p>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource._id} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{resource.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {resource.type}
                      </span>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {resource.description}
                      </p>
                    )}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 text-sm mt-2 inline-block"
                    >
                      Visit
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VIDEO LECTURES */}
        {activeTab === "Video Lectures" && (
          <>
            {videoLecturesLoading ? (
              <p>Loading video lectures...</p>
            ) : videoLectures.length === 0 ? (
              <p>No video lectures available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {videoLectures.map((lecture) => (
                  <div key={lecture._id} className="border rounded-xl p-4">
                    <div className="font-medium">{lecture.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {lecture.platform || "Video"}{" "}
                      {lecture.duration ? `- ${lecture.duration}` : ""}
                    </div>
                    {lecture.unit && (
                      <div className="text-xs text-gray-500 mt-1">
                        {lecture.unit}
                      </div>
                    )}
                    <a
                      href={lecture.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 text-sm mt-3 inline-block"
                    >
                      Watch
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ATTENDANCE */}
        {activeTab === "Attendance" && (
          <>
            {attendanceLoading ? (
              <p>Loading attendance...</p>
            ) : attendanceHistory.length === 0 ? (
              <p>No attendance records.</p>
            ) : (
              <div className="space-y-3">
                {attendanceHistory.map((row, idx) => (
                  <div key={idx} className="border rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {new Date(row.date).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        row.status === "present"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {row.status === "present" ? "Present" : "Absent"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab !== "Syllabus" &&
          activeTab !== "Notes" &&
          activeTab !== "Assignments" &&
          activeTab !== "Resources" &&
          activeTab !== "Video Lectures" &&
          activeTab !== "Attendance" && (
            <p className="text-gray-500">{activeTab} coming soon...</p>
          )}
      </div>
    </div>
  );
};

export default Subjects;
