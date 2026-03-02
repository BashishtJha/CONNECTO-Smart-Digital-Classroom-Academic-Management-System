import { useEffect, useState } from "react";
import axios from "axios";

const TeacherAssignments = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [resources, setResources] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/subjects/my",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjects(res.data);
        if (res.data.length > 0) {
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

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/assignments/subject/${selectedSubject}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAssignments(res.data);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedSubject, token]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedSubject || !title || !dueDate) {
      alert("Subject, title, and due date are required");
      return;
    }

    const resourceList = resources
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      await axios.post(
        "http://localhost:5000/api/assignments",
        {
          subjectId: selectedSubject,
          title,
          description,
          dueDate,
          resources: resourceList,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTitle("");
      setDescription("");
      setDueDate("");
      setResources("");

      const res = await axios.get(
        `http://localhost:5000/api/assignments/subject/${selectedSubject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to create assignment", err);
      alert("Failed to create assignment");
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const filteredAssignments = assignments.filter((item) => {
    if (statusFilter === "all") return true;

    const dueDateValue = new Date(item.dueDate);
    const hasSubmissions =
      Array.isArray(item.submissions) && item.submissions.length > 0;

    if (statusFilter === "active") {
      return dueDateValue >= now;
    }

    if (statusFilter === "submitted") {
      return hasSubmissions;
    }

    return true;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Create Assignment</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
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
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Resources (comma separated URLs)"
            value={resources}
            onChange={(e) => setResources(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : "Create Assignment"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Assignments</h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading assignments...</p>
        ) : filteredAssignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((item) => {
              const hasSubmissions =
                Array.isArray(item.submissions) && item.submissions.length > 0;

              return (
              <div key={item._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{item.title}</h3>
                  <div className="flex items-center gap-3">
                    {hasSubmissions && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Submitted
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      Due {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {item.description}
                  </p>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;
