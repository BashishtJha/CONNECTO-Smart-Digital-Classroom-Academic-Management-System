const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Assignment = require("../models/Assignment");
const Subject = require("../models/Subject");

// POST assignment (teacher)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId, title, description, dueDate, resources = [] } = req.body;

    if (!subjectId || !title || !dueDate) {
      return res
        .status(400)
        .json({ message: "subjectId, title and dueDate are required" });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ message: "Invalid dueDate" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (String(subject.teacher) !== req.user.id) {
      return res.status(403).json({ message: "You can only add to your subject" });
    }

    const assignment = await Assignment.create({
      subject: subjectId,
      title,
      description,
      dueDate: parsedDueDate,
      resources,
      createdBy: req.user.id,
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create assignment" });
  }
});

// GET assignments by subject
router.get("/subject/:subjectId", authMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const assignments = await Assignment.find({ subject: subjectId })
      .populate("createdBy", "name")
      .sort({ dueDate: 1 });

    // For students, include their per-assignment status summary.
    if (req.user.role === "student") {
      const studentAssignments = assignments.map((assignment) => {
        const doc = assignment.toObject();
        const submission = doc.submissions.find(
          (item) => String(item.student) === req.user.id
        );

        doc.studentStatus = submission ? submission.status : "pending";
        doc.submissionUrl = submission ? submission.submissionUrl : "";
        doc.submittedAt = submission ? submission.submittedAt : null;

        return doc;
      });

      return res.json(studentAssignments);
    }

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

// POST student submission
router.post("/:assignmentId/submit", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { assignmentId } = req.params;
    const { submissionUrl = "" } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const existingIndex = assignment.submissions.findIndex(
      (item) => String(item.student) === req.user.id
    );

    if (existingIndex >= 0) {
      assignment.submissions[existingIndex].status = "submitted";
      assignment.submissions[existingIndex].submissionUrl = submissionUrl;
      assignment.submissions[existingIndex].submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: req.user.id,
        status: "submitted",
        submissionUrl,
        submittedAt: new Date(),
      });
    }

    await assignment.save();

    res.json({ message: "Assignment submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit assignment" });
  }
});

// GET all submissions for an assignment (teacher)
router.get("/:assignmentId/submissions", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate("createdBy", "name")
      .populate("submissions.student", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({
      assignmentId: assignment._id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      submissions: assignment.submissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

module.exports = router;
