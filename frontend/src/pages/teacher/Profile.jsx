import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  CameraIcon,
  PencilSquareIcon,
  RectangleGroupIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }
  return parsed.toLocaleDateString();
};

const StatCard = ({ label, value, icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-slate-50 rounded-2xl p-4 border text-left transition ${
      active
        ? "border-indigo-300 bg-indigo-50/50 shadow-sm"
        : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
    </div>
    <p className="text-3xl font-semibold mt-3 text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 mt-2">Click to view details</p>
  </button>
);

const DetailRow = ({ label, value }) => (
  <div className="py-4 border-b last:border-b-0 flex items-center justify-between gap-4">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-slate-900 text-right font-medium">{value}</span>
  </div>
);

const Profile = () => {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [activeStat, setActiveStat] = useState("rooms");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");
  const [selectedPhotoMeta, setSelectedPhotoMeta] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const totalStudents = useMemo(
    () => subjects.reduce((sum, subject) => sum + (subject.students?.length || 0), 0),
    [subjects]
  );

  const totalAssignments = useMemo(() => {
    if (!subjects.length) return 0;
    return subjects.reduce((sum, subject) => sum + (subject.assignmentCount || 0), 0);
  }, [subjects]);

  const roomDetails = useMemo(
    () =>
      rooms.map((room) => ({
        id: room._id,
        name: room.name || room.subject?.name || "Untitled room",
        code: room.subject?.code || "",
        members: room.members?.length || 0,
      })),
    [rooms]
  );

  const studentDetails = useMemo(() => {
    const byId = new Map();

    subjects.forEach((subject) => {
      (subject.students || []).forEach((student) => {
        const id = typeof student === "object" ? student._id : student;
        if (!id) return;

        if (!byId.has(id)) {
          byId.set(id, {
            id,
            name: typeof student === "object" ? student.name || "Student" : "Student",
            email: typeof student === "object" ? student.email || "" : "",
            subjects: new Set(),
          });
        }

        const current = byId.get(id);
        current.subjects.add(subject.name || "Subject");
      });
    });

    return Array.from(byId.values())
      .map((student) => ({
        ...student,
        subjects: Array.from(student.subjects),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  const assignmentDetails = useMemo(() => {
    const details = [];

    subjects.forEach((subject) => {
      (subject.assignments || []).forEach((assignment) => {
        details.push({
          id: assignment._id,
          title: assignment.title || "Untitled assignment",
          subjectName: subject.name || "Subject",
          subjectCode: subject.code || "",
          dueDate: assignment.dueDate,
        });
      });
    });

    return details.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }, [subjects]);

  const subjectDetails = useMemo(
    () =>
      subjects.map((subject) => ({
        id: subject._id,
        name: subject.name || "Untitled subject",
        code: subject.code || "",
        students: subject.students?.length || 0,
        assignments: subject.assignmentCount || 0,
      })),
    [subjects]
  );

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const [userRes, subjectsRes, roomsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/subjects/my", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/chat/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const teacherSubjects = subjectsRes.data || [];

      const withAssignments = await Promise.all(
        teacherSubjects.map(async (subject) => {
          try {
            const res = await axios.get(
              `http://localhost:5000/api/assignments/subject/${subject._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const assignments = Array.isArray(res.data) ? res.data : [];
            return {
              ...subject,
              assignmentCount: assignments.length,
              assignments,
            };
          } catch {
            return { ...subject, assignmentCount: 0, assignments: [] };
          }
        })
      );

      setUser(userRes.data);
      setName(userRes.data?.name || "");
      setEmail(userRes.data?.email || "");
      setSubjects(withAssignments);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch teacher profile", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleStatClick = (key) => {
    setActiveStat((prev) => (prev === key ? "" : key));
  };

  const activeStatTitle = useMemo(() => {
    if (!activeStat) return "Details";
    if (activeStat === "students") return "Total Students Details";
    if (activeStat === "assignments") return "Assignments Details";
    if (activeStat === "subjects") return "Subjects Details";
    return "Rooms Created Details";
  }, [activeStat]);

  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.put(
        "http://localhost:5000/api/user/me",
        { name: name.trim(), email: email.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(res.data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedPhotoUrl(previewUrl);
    setSelectedPhotoMeta({ width: 0, height: 0 });
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setShowCropModal(true);
  };

  const closeCropModal = () => {
    if (selectedPhotoUrl) {
      URL.revokeObjectURL(selectedPhotoUrl);
    }
    setSelectedPhotoUrl("");
    setSelectedPhotoMeta({ width: 0, height: 0 });
    setShowCropModal(false);
  };

  const createCroppedBlob = () =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        const scale = zoom;
        const fitScale = Math.min(size / image.width, size / image.height);
        const drawW = image.width * fitScale * scale;
        const drawH = image.height * fitScale * scale;
        const x = (size - drawW) / 2 + offsetX;
        const y = (size - drawH) / 2 + offsetY;

        ctx.drawImage(image, x, y, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to generate cropped image"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.92
        );
      };
      image.onerror = () => reject(new Error("Failed to load selected image"));
      image.src = selectedPhotoUrl;
    });

  const saveCroppedPhoto = async () => {
    try {
      setUploadingPhoto(true);
      const blob = await createCroppedBlob();
      const formData = new FormData();
      formData.append("photo", blob, "profile.jpg");

      const res = await axios.put("http://localhost:5000/api/user/me/photo", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUser(res.data);
      closeCropModal();
    } catch (err) {
      console.error("Failed to upload photo", err);
      alert(err?.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading || !user) {
    return <p className="p-6">Loading teacher profile...</p>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500">
        <div className="absolute -top-14 -left-12 w-48 h-48 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-16 right-20 w-56 h-56 rounded-full bg-indigo-900/30 blur-2xl" />
        <div className="absolute top-6 right-8 w-28 h-28 rounded-full border border-white/30" />
        <div className="absolute top-12 right-36 w-14 h-14 rounded-full border border-white/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%),linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]" />

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="absolute top-6 right-8 z-20 inline-flex items-center gap-2 bg-white/95 backdrop-blur px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-white"
          >
            <PencilSquareIcon className="h-5 w-5" />
            Edit Profile
          </button>
        ) : (
          <div className="absolute top-6 right-8 z-20 flex gap-2">
            <button
              onClick={() => {
                setName(user.name || "");
                setEmail(user.email || "");
                setEditing(false);
              }}
              className="bg-white/90 text-slate-700 px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="px-8 pb-8 -mt-14">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-40 h-40">
              <div className="w-full h-full rounded-full border-4 border-white bg-indigo-100 overflow-hidden flex items-center justify-center text-7xl font-semibold text-indigo-600 shadow-sm">
                {user.profilePhoto ? (
                  <img
                    src={`http://localhost:5000${user.profilePhoto}`}
                    alt={user.name}
                    className="w-full h-full object-contain object-center bg-white"
                  />
                ) : (
                  (user.name || "T").charAt(0).toUpperCase()
                )}
              </div>

              <label className="absolute -right-2 -bottom-1 z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center cursor-pointer">
                <CameraIcon className="h-5 w-5 text-slate-600" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadPhoto(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="pt-10">
              {!editing ? (
                <>
                  <h1 className="text-4xl font-bold text-slate-900">{user.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <AcademicCapIcon className="h-4 w-4" />
                      Teacher Portal
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BuildingOffice2Icon className="h-4 w-4" />
                      Connecto Institute
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-3 w-full max-w-sm">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Name"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Email"
                  />
                </div>
              )}
              {uploadingPhoto && (
                <p className="text-sm text-slate-500 mt-2">Uploading photo...</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-slate-900">Professional Details</h2>
            <div className="border border-slate-200 rounded-2xl px-5">
              <DetailRow label="Designation" value="Senior Professor" />
              <DetailRow label="Experience" value="8 Years" />
              <DetailRow label="Specialization" value="Computer Science" />
              <DetailRow
                label="Email"
                value={
                  <span className="inline-flex items-center gap-1">
                    <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                    {user.email}
                  </span>
                }
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-slate-900">Platform Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Rooms Created"
                value={rooms.length}
                icon={<RectangleGroupIcon className="h-5 w-5" />}
                active={activeStat === "rooms"}
                onClick={() => handleStatClick("rooms")}
              />
              <StatCard
                label="Total Students"
                value={totalStudents}
                icon={<UserGroupIcon className="h-5 w-5" />}
                active={activeStat === "students"}
                onClick={() => handleStatClick("students")}
              />
              <StatCard
                label="Assignments"
                value={totalAssignments}
                icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
                active={activeStat === "assignments"}
                onClick={() => handleStatClick("assignments")}
              />
              <StatCard
                label="Subjects"
                value={subjects.length}
                icon={<BookOpenIcon className="h-5 w-5" />}
                active={activeStat === "subjects"}
                onClick={() => handleStatClick("subjects")}
              />
            </div>

            <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">{activeStatTitle}</p>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {activeStat === "rooms" && (
                  <>
                    {roomDetails.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">No rooms found.</p>
                    ) : (
                      roomDetails.map((room) => (
                        <div
                          key={room.id}
                          className="px-4 py-3 border-b last:border-b-0 border-slate-100 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{room.name}</p>
                            <p className="text-sm text-slate-500">
                              {room.code ? `Code: ${room.code}` : "No subject code"}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">{room.members} members</p>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeStat === "students" && (
                  <>
                    {studentDetails.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">No students found.</p>
                    ) : (
                      studentDetails.map((student) => (
                        <div
                          key={student.id}
                          className="px-4 py-3 border-b last:border-b-0 border-slate-100"
                        >
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-500">
                            {student.email || "No email available"}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            Subjects: {student.subjects.join(", ")}
                          </p>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeStat === "assignments" && (
                  <>
                    {assignmentDetails.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">No assignments found.</p>
                    ) : (
                      assignmentDetails.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="px-4 py-3 border-b last:border-b-0 border-slate-100 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{assignment.title}</p>
                            <p className="text-sm text-slate-500">
                              {assignment.subjectName}
                              {assignment.subjectCode ? ` (${assignment.subjectCode})` : ""}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">
                            Due: {formatDate(assignment.dueDate)}
                          </p>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeStat === "subjects" && (
                  <>
                    {subjectDetails.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">No subjects found.</p>
                    ) : (
                      subjectDetails.map((subject) => (
                        <div
                          key={subject.id}
                          className="px-4 py-3 border-b last:border-b-0 border-slate-100 flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{subject.name}</p>
                            <p className="text-sm text-slate-500">
                              {subject.code ? `Code: ${subject.code}` : "No subject code"}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">
                            {subject.students} students, {subject.assignments} assignments
                          </p>
                        </div>
                      ))
                    )}
                  </>
                )}

                {!activeStat && (
                  <p className="px-4 py-6 text-sm text-slate-500">
                    Click any statistics card to view details.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Crop Profile Photo</h3>

            <div className="flex justify-center mb-4">
              <div className="w-72 h-72 rounded-full overflow-hidden border border-slate-200 relative bg-slate-100">
                <img
                  src={selectedPhotoUrl}
                  alt="Preview"
                  onLoad={(e) =>
                    setSelectedPhotoMeta({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    })
                  }
                  className="absolute"
                  style={{
                    width: selectedPhotoMeta.width
                      ? `${selectedPhotoMeta.width * Math.min(288 / selectedPhotoMeta.width, 288 / selectedPhotoMeta.height) * zoom}px`
                      : "100%",
                    height: selectedPhotoMeta.height
                      ? `${selectedPhotoMeta.height * Math.min(288 / selectedPhotoMeta.width, 288 / selectedPhotoMeta.height) * zoom}px`
                      : "100%",
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-slate-600">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Move Left / Right
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>

              <label className="block text-sm text-slate-600">
                Move Up / Down
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeCropModal}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={saveCroppedPhoto}
                disabled={uploadingPhoto}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl disabled:opacity-60"
              >
                {uploadingPhoto ? "Uploading..." : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
