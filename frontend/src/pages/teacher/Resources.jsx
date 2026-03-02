import { useEffect, useState } from "react";
import axios from "axios";

const TeacherResources = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("website");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        setSubjectsError("");
        const res = await axios.get(
          "http://localhost:5000/api/subjects/my",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0]._id);
        } else {
          setSelectedSubject("");
        }
      } catch (err) {
        console.error("Failed to fetch subjects", err);
        setSubjectsError("No subjects found for this teacher.");
        setSubjects([]);
        setSelectedSubject("");
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [token]);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchResources = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/resources/${selectedSubject}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResources(res.data);
      } catch (err) {
        console.error("Failed to fetch resources", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [selectedSubject, token]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedSubject || !title || !url) {
      alert("Subject, title, and url are required");
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        "http://localhost:5000/api/resources",
        {
          subjectId: selectedSubject,
          title,
          description,
          url,
          type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTitle("");
      setDescription("");
      setUrl("");
      setType("website");

      const res = await axios.get(
        `http://localhost:5000/api/resources/${selectedSubject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResources(res.data);
    } catch (err) {
      console.error("Failed to create resource", err);
      alert("Failed to create resource");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Add Resource</h2>

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
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />

          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="website">Website</option>
            <option value="pdf">PDF</option>
            <option value="doc">Doc</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>

          <button
            type="submit"
            disabled={saving || !selectedSubject}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : "Add Resource"}
          </button>

          {subjectsLoading && (
            <p className="text-sm text-gray-500">Loading subjects...</p>
          )}
          {subjectsError && (
            <p className="text-sm text-red-600">{subjectsError}</p>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resources</h2>
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
          <p>Select a subject to view resources.</p>
        ) : loading ? (
          <p>Loading resources...</p>
        ) : resources.length === 0 ? (
          <p>No resources yet.</p>
        ) : (
          <div className="space-y-4">
            {resources.map((item) => (
              <div key={item._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {item.type}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {item.description}
                  </p>
                )}
                <a
                  href={item.url}
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
      </div>
    </div>
  );
};

export default TeacherResources;
