const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const uploadAssignmentPdf = require("../middleware/uploadAssignmentPdf");
const Assignment = require("../models/Assignment");
const Subject = require("../models/Subject");

const parseDueDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const canManageSubject = (subject, userId) => {
  if (String(subject.teacher) === userId) return true;
  return (subject.owners || []).some((ownerId) => String(ownerId) === userId);
};

const ensureTeacherCanManageSubject = async (subjectId, userId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return { error: { status: 404, message: "Subject not found" } };
  }

  if (!canManageSubject(subject, userId)) {
    return { error: { status: 403, message: "You can only manage your subject" } };
  }

  return { subject };
};

const handleAssignmentUpload = (requireFile = false) => (req, res, next) => {
  uploadAssignmentPdf.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "PDF must be 10MB or smaller" });
      }
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }

    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    if (requireFile && !req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    next();
  });
};

const removeAttachmentFile = async (attachmentUrl = "") => {
  if (!attachmentUrl) return;

  const relativePath = String(attachmentUrl).replace(/^\/+/, "");
  const fullPath = path.join(__dirname, "..", relativePath);

  try {
    await fs.promises.unlink(fullPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to remove assignment PDF:", err);
    }
  }
};

// POST assignment (teacher)
router.post(
  "/",
  authMiddleware,
  handleAssignmentUpload(true),
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { subjectId, title, description = "", dueDate } = req.body;
      if (!subjectId || !title || !dueDate) {
        return res
          .status(400)
          .json({ message: "subjectId, title and dueDate are required" });
      }

      const parsedDueDate = parseDueDate(dueDate);
      if (!parsedDueDate) {
        return res.status(400).json({ message: "Invalid dueDate" });
      }

      const access = await ensureTeacherCanManageSubject(subjectId, req.user.id);
      if (access.error) {
        return res.status(access.error.status).json({ message: access.error.message });
      }

      const assignment = await Assignment.create({
        subject: subjectId,
        title: String(title).trim(),
        description: String(description || "").trim(),
        dueDate: parsedDueDate,
        attachmentUrl: `/uploads/assignments/${req.file.filename}`,
        createdBy: req.user.id,
      });

      res.status(201).json(assignment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  }
);

// PUT update assignment (teacher)
router.put(
  "/:assignmentId",
  authMiddleware,
  handleAssignmentUpload(false),
  async (req, res) => {
    try {
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { assignmentId } = req.params;
      const { title, description = "", dueDate } = req.body;

      if (!title || !dueDate) {
        return res.status(400).json({ message: "title and dueDate are required" });
      }

      const parsedDueDate = parseDueDate(dueDate);
      if (!parsedDueDate) {
        return res.status(400).json({ message: "Invalid dueDate" });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const access = await ensureTeacherCanManageSubject(assignment.subject, req.user.id);
      if (access.error) {
        return res.status(access.error.status).json({ message: access.error.message });
      }

      const previousAttachment = assignment.attachmentUrl;

      assignment.title = String(title).trim();
      assignment.description = String(description || "").trim();
      assignment.dueDate = parsedDueDate;

      if (req.file) {
        assignment.attachmentUrl = `/uploads/assignments/${req.file.filename}`;
      }

      await assignment.save();

      if (req.file && previousAttachment && previousAttachment !== assignment.attachmentUrl) {
        await removeAttachmentFile(previousAttachment);
      }

      res.json(assignment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  }
);

// DELETE assignment (teacher)
router.delete("/:assignmentId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const access = await ensureTeacherCanManageSubject(assignment.subject, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message });
    }

    const attachmentUrl = assignment.attachmentUrl;
    await Assignment.deleteOne({ _id: assignmentId });
    await removeAttachmentFile(attachmentUrl);

    res.json({ message: "Assignment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
});

// GET assignments by subject
router.get("/subject/:subjectId", authMiddleware, async (req, res) => {
  try {
    const { subjectId } = req.params;

    const assignments = await Assignment.find({ subject: subjectId })
      .populate("createdBy", "name")
      .sort({ dueDate: 1 });

    if (req.user.role === "student") {
      const now = new Date();
      const studentAssignments = assignments.map((assignment) => {
        const doc = assignment.toObject();
        const submission = doc.submissions.find(
          (item) => String(item.student) === req.user.id
        );

        const isOverdue = new Date(doc.dueDate).getTime() < now.getTime();
        doc.studentStatus = submission
          ? submission.status
          : isOverdue
          ? "not_submitted"
          : "pending";
        doc.isOverdue = !submission && isOverdue;
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
