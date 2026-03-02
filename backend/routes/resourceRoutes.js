const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Resource = require("../models/Resource");
const Subject = require("../models/Subject");

// GET resources by subject (student + teacher)
router.get("/:subjectId", authMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const resources = await Resource.find({ subject: subjectId })
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

// POST resource (teacher)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId, title, description, url, type } = req.body;

    if (!subjectId || !title || !url) {
      return res
        .status(400)
        .json({ message: "subjectId, title and url are required" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (String(subject.teacher) !== req.user.id) {
      return res.status(403).json({ message: "You can only add to your subject" });
    }

    const resource = await Resource.create({
      subject: subjectId,
      title,
      description,
      url,
      type,
      createdBy: req.user.id,
    });

    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create resource" });
  }
});

module.exports = router;
