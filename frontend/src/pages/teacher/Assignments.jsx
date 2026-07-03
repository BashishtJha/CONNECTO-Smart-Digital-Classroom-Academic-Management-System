import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const TeacherAssignments = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const token = localStorage.getItem("token");

  const isEditing = Boolean(editingAssignmentId);
  const editingAssignment = useMemo(
    () => assignments.find((item) => item._id === editingAssignmentId) || null,
    [assignments, editingAssignmentId]
  );

  const resetForm = useCallback(() => {
    setEditingAssignmentId("");
    setTitle("");
    setDescription("");
    setDueDate("");
    setPdfFile(null);
    setFileInputKey((prev) => prev + 1);
  }, []);

  const refreshAssignments = useCallback(async (subjectId = selectedSubject) => {
    if (!subjectId) {
      setAssignments([]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/assignments/subject/${subjectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, token]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/subjects/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res.data || [];
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubject(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };

    fetchSubjects();
  }, [token]);

  useEffect(() => {
    refreshAssignments();
    resetForm();
  }, [selectedSubject, refreshAssignments, resetForm]);

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPdfFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("Only PDF files are allowed");
      e.target.value = "";
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSubject || !title.trim() || !dueDate) {
      alert("Subject, title, and due date are required");
      return;
    }

    if (!isEditing && !pdfFile) {
      alert("PDF file is required");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("subjectId", selectedSubject);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("dueDate", dueDate);
      if (pdfFile) {
        formData.append("file", pdfFile);
      }

      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/assignments/${editingAssignmentId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/assignments",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      resetForm();
      await refreshAssignments();
    } catch (err) {
      console.error("Failed to save assignment", err);
      alert(err?.response?.data?.message || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignmentId(assignment._id);
    setTitle(assignment.title || "");
    setDescription(assignment.description || "");
    setDueDate(
      assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 10) : ""
    );
    setPdfFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleDelete = async (assignmentId) => {
    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (editingAssignmentId === assignmentId) {
        resetForm();
      }

      await refreshAssignments();
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert(err?.response?.data?.message || "Failed to delete assignment");
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
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Assignment" : "Create Assignment"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-1">
            <input
              key={fileInputKey}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfChange}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500">
              {isEditing
                ? "Upload a new PDF only if you want to replace current file"
                : "Upload assignment PDF only (max 10MB)"}
            </p>
            {isEditing && editingAssignment?.attachmentUrl && (
              <a
                href={`http://localhost:5000${editingAssignment.attachmentUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs text-indigo-600 hover:underline"
              >
                View current PDF
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Update Assignment"
                : "Create Assignment"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
            )}
          </div>
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
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="flex items-center gap-3">
                      {hasSubmissions && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Last Date {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                  )}
                  {item.attachmentUrl && (
                    <a
                      href={`http://localhost:5000${item.attachmentUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-sm text-indigo-600 hover:underline"
                    >
                      View Assignment PDF
                    </a>
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;
