import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

import ProfileCard from "../../components/profile/ProfileCard";
import AttendanceOverview from "../../components/profile/AttendanceOverview";
import ProfileStats from "../../components/profile/ProfileStats";

const Profile = () => {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [user, setUser] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(0);
  const [completedAssignments, setCompletedAssignments] = useState(0);
  const [pendingAssignments, setPendingAssignments] = useState(0);

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const userRes = await axios.get("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userRes.data);

      const subjectsRes = await axios.get("http://localhost:5000/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjects = subjectsRes.data || [];

      const attendancePromises = subjects.map((subject) =>
        axios
          .get(`http://localhost:5000/api/attendance/student/${subject._id}/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => ({ label: subject.name, value: res.data?.percentage || 0 }))
          .catch(() => ({ label: subject.name, value: 0 }))
      );

      const assignmentPromises = subjects.map((subject) =>
        axios
          .get(`http://localhost:5000/api/assignments/subject/${subject._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => res.data || [])
          .catch(() => [])
      );

      const attendanceData = await Promise.all(attendancePromises);
      setAttendanceRows(attendanceData);

      if (attendanceData.length > 0) {
        const avg = Math.round(
          attendanceData.reduce((sum, row) => sum + row.value, 0) / attendanceData.length
        );
        setOverallAttendance(avg);
      } else {
        setOverallAttendance(0);
      }

      const assignmentsBySubject = await Promise.all(assignmentPromises);
      const allAssignments = assignmentsBySubject.flat();

      const completed = allAssignments.filter(
        (item) => item.studentStatus === "submitted"
      ).length;
      const pending = allAssignments.filter(
        (item) => item.studentStatus !== "submitted"
      ).length;

      setCompletedAssignments(completed);
      setPendingAssignments(pending);
    } catch (err) {
      console.error("Profile fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleSaveProfile = async ({ name, email }) => {
    try {
      setSaving(true);
      const res = await axios.put(
        "http://localhost:5000/api/user/me",
        { name, email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data);
      return true;
    } catch (err) {
      console.error("Profile update failed", err);
      alert(err?.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (photoBlob) => {
    if (!photoBlob) return false;

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", photoBlob, "profile.jpg");

      const res = await axios.put("http://localhost:5000/api/user/me/photo", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUser(res.data);
      return true;
    } catch (err) {
      console.error("Photo upload failed", err);
      alert(err?.response?.data?.message || "Failed to upload photo");
      return false;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const downloadAttendanceReport = () => {
    if (!user) return;

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("CONNECTO - Student Attendance Report", 14, 16);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text(`Name: ${user.name}`, 14, 34);
    doc.text(`Email: ${user.email}`, 14, 41);
    doc.text(`Overall Attendance: ${overallAttendance}%`, 14, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Subject", 14, 62);
    doc.text("Attendance", 165, 62);
    doc.setFont("helvetica", "normal");
    doc.line(14, 65, 196, 65);

    let y = 72;
    attendanceRows.forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(row.label, 14, y);
      doc.text(`${row.value}%`, 165, y);
      y += 8;
    });

    doc.save("student-attendance-report.pdf");
  };

  if (loading || !user) {
    return <p className="p-6">Loading profile...</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ProfileCard
        user={user}
        onSave={handleSaveProfile}
        saving={saving}
        onUploadPhoto={handleUploadPhoto}
        uploadingPhoto={uploadingPhoto}
      />

      <div className="lg:col-span-2 space-y-6">
        <AttendanceOverview
          overall={overallAttendance}
          rows={attendanceRows}
          onDownload={downloadAttendanceReport}
        />
        <ProfileStats
          completedAssignments={completedAssignments}
          pendingAssignments={pendingAssignments}
        />
      </div>
    </div>
  );
};

export default Profile;
