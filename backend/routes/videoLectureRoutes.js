const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const VideoLecture = require("../models/VideoLecture");
const Subject = require("../models/Subject");

const extractYoutubeVideoId = (url = "") => {
  const input = String(url).trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return "";
};

// GET lectures by subject (student + teacher)
router.get("/:subjectId", authMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const lectures = await VideoLecture.find({ subject: subjectId })
      .sort({ createdAt: -1 });

    res.json(lectures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch video lectures" });
  }
});

// POST lecture (teacher)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId, title, url, platform, duration, thumbnailUrl, unit } =
      req.body;

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

    const youtubeId = extractYoutubeVideoId(url);
    if (!youtubeId) {
      return res.status(400).json({ message: "Valid YouTube URL is required" });
    }

    const lecture = await VideoLecture.create({
      subject: subjectId,
      title,
      url,
      platform: platform || "YouTube",
      duration,
      thumbnailUrl:
        thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      unit,
      createdBy: req.user.id,
    });

    res.status(201).json(lecture);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create video lecture" });
  }
});

module.exports = router;
