import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ManageRoutine = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [subjectName, setSubjectName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");
  const [editingId, setEditingId] = useState("");

  const token = localStorage.getItem("token");

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/routine/teacher", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to fetch routine entries", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!subjectName || !classSection || !day || !startTime || !endTime) {
      alert("All fields except room are required");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/routine/${editingId}`,
          { subjectName, classSection, day, startTime, endTime, room },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/routine",
          { subjectName, classSection, day, startTime, endTime, room },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSubjectName("");
      setClassSection("");
      setStartTime("");
      setEndTime("");
      setRoom("");
      setEditingId("");

      await fetchEntries();
    } catch (err) {
      console.error("Failed to create routine entry", err);
      alert("Failed to create routine entry");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setSubjectName(entry.subject?.name || entry.subjectName || "");
    setClassSection(entry.classSection || "");
    setDay(entry.day || "Monday");
    setStartTime(entry.startTime || "");
    setEndTime(entry.endTime || "");
    setRoom(entry.room || "");
  };

  const handleCancelEdit = () => {
    setEditingId("");
    setSubjectName("");
    setClassSection("");
    setDay("Monday");
    setStartTime("");
    setEndTime("");
    setRoom("");
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/routine/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchEntries();
    } catch (err) {
      console.error("Failed to delete routine entry", err);
      alert("Delete failed");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Schedule</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Class / Section"
            value={classSection}
            onChange={(e) => setClassSection(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="text"
            placeholder="Subject name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <input
            type="text"
            placeholder="Room (optional)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : editingId ? "Update Schedule" : "Save Schedule"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="ml-3 text-sm text-gray-600 hover:underline"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 xl:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Current Routine Entries</h2>
          <span className="text-sm text-gray-500">{entries.length} schedules</span>
        </div>

        {loading ? (
          <p>Loading routine...</p>
        ) : entries.length === 0 ? (
          <p>No schedules yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {entry.classSection} - {entry.subject?.name || entry.subjectName || "Subject"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.day} - {entry.startTime} - {entry.endTime} - {entry.room || "Room TBA"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRoutine;
