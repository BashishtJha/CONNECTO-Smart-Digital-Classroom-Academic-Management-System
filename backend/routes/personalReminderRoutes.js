const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const PersonalReminder = require("../models/PersonalReminder");

// GET logged-in student's reminders
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reminders = await PersonalReminder.find({ student: req.user.id }).sort({
      remindAt: 1,
    });

    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
});

// POST create reminder (student only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, type = "Study", remindAt } = req.body;

    if (!title || !remindAt) {
      return res.status(400).json({ message: "title and remindAt are required" });
    }

    const parsedDate = new Date(remindAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid remindAt" });
    }

    const reminder = await PersonalReminder.create({
      student: req.user.id,
      title,
      type,
      remindAt: parsedDate,
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create reminder" });
  }
});

// DELETE reminder (student only, own reminder)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, type, remindAt } = req.body;
    if (!title || !remindAt) {
      return res.status(400).json({ message: "title and remindAt are required" });
    }

    const parsedDate = new Date(remindAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid remindAt" });
    }

    const reminder = await PersonalReminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    if (String(reminder.student) !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    reminder.title = title;
    reminder.type = type || reminder.type;
    reminder.remindAt = parsedDate;
    await reminder.save();

    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update reminder" });
  }
});

// DELETE reminder (student only, own reminder)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reminder = await PersonalReminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    if (String(reminder.student) !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await reminder.deleteOne();
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete reminder" });
  }
});

module.exports = router;
