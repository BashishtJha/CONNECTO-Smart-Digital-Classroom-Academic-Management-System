const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Routine = require("../models/Routine");
const Subject = require("../models/Subject");

// Create routine entry (teacher)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId, subjectName, classSection, day, startTime, endTime, room } = req.body;

    if (!classSection || !day || !startTime || !endTime) {
      return res.status(400).json({
        message: "classSection, day, startTime, endTime are required",
      });
    }

    let resolvedSubject = null;
    let resolvedSubjectName = subjectName;

    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      if (String(subject.teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only add your subject" });
      }
      resolvedSubject = subject._id;
      if (!resolvedSubjectName) {
        resolvedSubjectName = subject.name;
      }
    }

    if (!resolvedSubjectName) {
      return res.status(400).json({ message: "subjectName is required" });
    }

    const entry = await Routine.create({
      subject: resolvedSubject,
      subjectName: resolvedSubjectName,
      classSection,
      day,
      startTime,
      endTime,
      room,
      teacher: req.user.id,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create routine entry" });
  }
});

// Get teacher routine entries
router.get("/teacher", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const entries = await Routine.find({ teacher: req.user.id })
      .populate("subject", "name code")
      .sort({ day: 1, startTime: 1 });

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch routine" });
  }
});

// Get student routine entries
router.get("/student", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const entries = await Routine.find()
      .populate("subject", "name code")
      .sort({ day: 1, startTime: 1 });

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch routine" });
  }
});

// Delete routine entry (teacher)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const entry = await Routine.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Routine entry not found" });
    }

    if (String(entry.teacher) !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await entry.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete routine entry" });
  }
});

// Update routine entry (teacher)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId, subjectName, classSection, day, startTime, endTime, room } = req.body;

    const entry = await Routine.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Routine entry not found" });
    }

    if (String(entry.teacher) !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    let resolvedSubject = entry.subject;
    let resolvedSubjectName = subjectName || entry.subjectName;

    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      if (String(subject.teacher) !== req.user.id) {
        return res.status(403).json({ message: "You can only use your subject" });
      }
      resolvedSubject = subject._id;
      if (!subjectName) {
        resolvedSubjectName = subject.name;
      }
    }

    if (!resolvedSubjectName) {
      return res.status(400).json({ message: "subjectName is required" });
    }

    entry.subject = resolvedSubject;
    entry.subjectName = resolvedSubjectName;
    if (classSection) entry.classSection = classSection;
    if (day) entry.day = day;
    if (startTime) entry.startTime = startTime;
    if (endTime) entry.endTime = endTime;
    entry.room = room || "";

    await entry.save();

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update routine entry" });
  }
});

module.exports = router;
