const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Syllabus = require("../models/Syllabus");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * GET /api/syllabus/:subjectId
 * Get syllabus by subject ID
 */
router.get("/:subjectId", authMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // ✅ IMPORTANT: convert string → ObjectId
    const syllabus = await Syllabus.find({
      subject: new mongoose.Types.ObjectId(subjectId),
    });

    res.json(syllabus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
