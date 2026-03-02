import { useEffect, useState } from "react";
import axios from "axios";

const TeacherUploadNotes = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch teacher subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/subjects/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };

    fetchSubjects();
  }, []);

  // 🔹 Upload notes
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectId || !title || !file) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("subjectId", subjectId);
      formData.append("title", title);
      formData.append("file", file);

      await axios.post(
        "http://localhost:5000/api/notes/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Notes uploaded successfully 🎉");
      setTitle("");
      setFile(null);
      setSubjectId("");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Upload Notes (PDF)</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject dropdown */}
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select subject</option>
          {subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name} ({sub.code})
            </option>
          ))}
        </select>

        {/* Title */}
        <input
          type="text"
          placeholder="Notes title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        {/* File */}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Upload Notes"}
        </button>
      </form>
    </div>
  );
};

export default TeacherUploadNotes;
