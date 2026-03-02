const express = require("express");
const router = express.Router();

const uploadNotes = require("../middleware/uploadNotes");
const authMiddleware = require("../middleware/authMiddleware");
const Note = require("../models/Note");

/* ======================================================
   POST: Upload note (TEACHER)
   URL: /api/notes/upload
====================================================== */
router.post(
  "/upload",
  authMiddleware,
  uploadNotes.single("file"), // field name MUST be "file"
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      if (!req.file) {
        return res.status(400).json({ message: "PDF file required" });
      }

      const { title, subjectId } = req.body;

      if (!title || !subjectId) {
        return res
          .status(400)
          .json({ message: "Title and subjectId are required" });
      }

      const note = new Note({
        title,
        subject: subjectId,
        fileUrl: `/uploads/notes/${req.file.filename}`,
        uploadedBy: req.user.role, // "teacher"
      });

      await note.save();

      res.status(201).json(note);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ======================================================
   GET: Notes by subject (STUDENT)
   URL: /api/notes/:subjectId
====================================================== */

router.get(
  "/:subjectId",
  authMiddleware,
  async (req, res) => {
    try {
      const { subjectId } = req.params;

      const notes = await Note.find({ subject: subjectId }).sort({
        createdAt: -1,
      });

      res.json(notes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  }
);


module.exports = router;
