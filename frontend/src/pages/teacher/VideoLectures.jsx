import { useEffect, useState } from "react";
import axios from "axios";

const TeacherVideoLectures = () => {
  const token = localStorage.getItem("token");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [unit, setUnit] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/subjects/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSubjects(res.data || []);
        if (res.data?.length > 0) {
          setSelectedSubject(res.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };

    fetchSubjects();
  }, [token]);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchLectures = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/video-lectures/${selectedSubject}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLectures(res.data || []);
      } catch (err) {
        console.error("Failed to fetch video lectures", err);
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, [selectedSubject, token]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedSubject || !title.trim() || !url.trim()) {
      alert("Subject, title and YouTube URL are required");
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        "http://localhost:5000/api/video-lectures",
        {
          subjectId: selectedSubject,
          title: title.trim(),
          url: url.trim(),
          unit: unit.trim(),
          duration: duration.trim(),
          platform: "YouTube",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTitle("");
      setUrl("");
      setUnit("");
      setDuration("");

      const res = await axios.get(
        `http://localhost:5000/api/video-lectures/${selectedSubject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLectures(res.data || []);
    } catch (err) {
      console.error("Failed to add video lecture", err);
      alert(err?.response?.data?.message || "Failed to add video lecture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Add Video Lecture</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select subject</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Lecture title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="YouTube link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Unit (optional)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Duration (optional) ex: 42:10"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <button
            type="submit"
            disabled={saving || !selectedSubject}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : "Add Video"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Video Lectures</h2>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Select subject</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedSubject ? (
          <p>Select a subject to view lectures.</p>
        ) : loading ? (
          <p>Loading video lectures...</p>
        ) : lectures.length === 0 ? (
          <p>No lectures yet.</p>
        ) : (
          <div className="space-y-4">
            {lectures.map((item) => (
              <div key={item._id} className="border rounded-lg p-4 flex gap-4 items-start">
                <img
                  src={item.thumbnailUrl || "https://img.youtube.com/vi/0/hqdefault.jpg"}
                  alt={item.title}
                  className="w-40 h-24 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.unit || "General"}
                    {item.duration ? ` - ${item.duration}` : ""}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 text-sm mt-2 inline-block"
                  >
                    Watch on YouTube
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherVideoLectures;
