const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const ensureTeacherSubjectAccess = async (subjectId, teacherId) => {
  const subject = await Subject.findById(subjectId).populate("students", "name email");
  if (!subject) {
    return { error: { status: 404, message: "Subject not found" } };
  }

  if (String(subject.teacher) !== teacherId) {
    return { error: { status: 403, message: "You can only access your subject" } };
  }

  return { subject };
};

// POST mark attendance for a subject/date (teacher)
router.post("/:subjectId/mark", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId } = req.params;
    const { date, records = [] } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ message: "records array is required with at least one student" });
    }

    const access = await ensureTeacherSubjectAccess(subjectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const attendanceDate = normalizeDate(date);
    if (!attendanceDate) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const normalizedRecords = records.map((item) => ({
      student: item.studentId,
      status: String(item.status || "").toLowerCase(),
    }));

    const hasInvalidStatus = normalizedRecords.some(
      (item) => item.status !== "present" && item.status !== "absent"
    );

    if (hasInvalidStatus) {
      return res
        .status(400)
        .json({ message: "status must be 'present' or 'absent'" });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { subject: subjectId, date: attendanceDate },
      {
        subject: subjectId,
        date: attendanceDate,
        markedBy: req.user.id,
        records: normalizedRecords,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
});

// GET teacher attendance sheet for a subject/date
router.get("/teacher/:subjectId/date", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId } = req.params;
    const attendanceDate = normalizeDate(req.query.date);

    if (!attendanceDate) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const access = await ensureTeacherSubjectAccess(subjectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const { subject } = access;

    const doc = await Attendance.findOne({
      subject: subjectId,
      date: attendanceDate,
    });

    const recordsMap = new Map();
    if (doc) {
      doc.records.forEach((record) => {
        recordsMap.set(String(record.student), record.status);
      });
    }

    const students = subject.students.map((student, index) => ({
      studentId: student._id,
      name: student.name,
      email: student.email,
      rollNo: `2025${String(index + 1).padStart(3, "0")}`,
      status: recordsMap.get(String(student._id)) || "present",
    }));

    res.json({
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
      },
      date: attendanceDate,
      marked: Boolean(doc),
      students,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch teacher attendance sheet" });
  }
});

// GET teacher attendance summary for room-info view
router.get("/teacher/:subjectId/summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId } = req.params;

    const access = await ensureTeacherSubjectAccess(subjectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const { subject } = access;
    const docs = await Attendance.find({ subject: subjectId }).sort({ date: -1 });

    const studentStats = subject.students.map((student, index) => {
      let total = 0;
      let present = 0;

      docs.forEach((doc) => {
        const record = doc.records.find(
          (item) => String(item.student) === String(student._id)
        );

        if (!record) return;

        total += 1;
        if (record.status === "present") {
          present += 1;
        }
      });

      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        rollNo: `2025${String(index + 1).padStart(3, "0")}`,
        total,
        present,
        absent: total - present,
        percentage,
      };
    });

    res.json({
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
      },
      totalStudents: subject.students.length,
      totalSessions: docs.length,
      students: studentStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance summary" });
  }
});

// GET student's attendance history by subject
router.get("/student/:subjectId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId } = req.params;
    const docs = await Attendance.find({ subject: subjectId }).sort({ date: -1 });

    const history = docs.map((doc) => {
      const record = doc.records.find(
        (item) => String(item.student) === req.user.id
      );

      return {
        date: doc.date,
        status: record ? record.status : "absent",
      };
    });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance history" });
  }
});

// GET student's attendance summary by subject
router.get("/student/:subjectId/summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId } = req.params;
    const docs = await Attendance.find({ subject: subjectId });

    let total = 0;
    let present = 0;

    docs.forEach((doc) => {
      const record = doc.records.find(
        (item) => String(item.student) === req.user.id
      );
      if (!record) return;

      total += 1;
      if (record.status === "present") {
        present += 1;
      }
    });

    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    res.json({ total, present, absent: total - present, percentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance summary" });
  }
});

module.exports = router;
