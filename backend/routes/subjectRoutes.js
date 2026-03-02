const express = require("express");
const router = express.Router();

const Subject = require("../models/Subject");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const toUniqueIds = (list = []) => {
  return Array.from(
    new Set(
      list
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )
  );
};

const validateUsersByRole = async (ids, role) => {
  if (!ids.length) return [];

  const users = await User.find({ _id: { $in: ids }, role }).select("_id");
  const userIds = users.map((user) => String(user._id));

  if (userIds.length !== ids.length) {
    throw new Error(`Some selected users are not valid ${role}s`);
  }

  return userIds;
};

const normalizeSubjectCollections = (subject) => {
  const teacherId = String(subject.teacher);
  const ownerSet = new Set([
    teacherId,
    ...toUniqueIds(subject.owners || []),
  ]);
  const facultySet = new Set([
    teacherId,
    ...toUniqueIds(subject.faculty || []),
    ...ownerSet,
  ]);
  const studentSet = new Set(toUniqueIds(subject.students || []));

  return { teacherId, ownerSet, facultySet, studentSet };
};

const syncRoomForSubject = async (subject) => {
  const { teacherId, ownerSet, facultySet, studentSet } = normalizeSubjectCollections(subject);
  const members = Array.from(
    new Set([...studentSet, ...facultySet, ...ownerSet, teacherId])
  );

  await ChatRoom.findOneAndUpdate(
    { subject: subject._id },
    {
      name: subject.name,
      teacher: subject.teacher,
      members,
    }
  );
};

const populateSubject = (query) =>
  query
    .populate("teacher", "name email role")
    .populate("owners", "name email role")
    .populate("faculty", "name email role")
    .populate("students", "name email role");

const canManageSubject = (subject, userId) => {
  if (String(subject.teacher) === userId) return true;
  return (subject.owners || []).some((ownerId) => String(ownerId) === userId);
};

const buildCodeFromName = (name) => {
  const letters = String(name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 4);

  const suffix = String(Date.now()).slice(-3);
  return `${letters || "SUB"}${suffix}`;
};

// POST create subject/group (teacher)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const name = String(req.body.name || "").trim();
    const codeInput = String(req.body.code || "").trim();
    const addStudentIds = toUniqueIds(req.body.studentIds || []);
    const addFacultyIds = toUniqueIds(req.body.facultyIds || []);
    const addOwnerIds = toUniqueIds(req.body.ownerIds || []);
    const primaryOwnerIdInput = String(req.body.primaryOwnerId || "").trim();

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const validStudents = await validateUsersByRole(addStudentIds, "student");
    const validFaculty = await validateUsersByRole(addFacultyIds, "teacher");
    const validOwners = await validateUsersByRole(addOwnerIds, "teacher");

    const ownerSet = new Set([req.user.id, ...validOwners]);
    const facultySet = new Set([req.user.id, ...validFaculty, ...ownerSet]);

    let teacherId = req.user.id;
    if (primaryOwnerIdInput) {
      const [primary] = await validateUsersByRole([primaryOwnerIdInput], "teacher");
      teacherId = primary;
      ownerSet.add(primary);
      facultySet.add(primary);
    }

    const subject = await Subject.create({
      name,
      code: codeInput || buildCodeFromName(name),
      teacher: teacherId,
      owners: Array.from(ownerSet),
      faculty: Array.from(facultySet),
      students: validStudents,
    });

    const populated = await populateSubject(Subject.findById(subject._id));
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    const isValidationError = Boolean(err?.message && err.message.includes("not valid"));
    const message = isValidationError ? err.message : "Failed to create subject";
    res.status(isValidationError ? 400 : 500).json({ message });
  }
});

// PATCH update subject/group details (teacher owners only)
router.patch("/:subjectId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (!canManageSubject(subject, req.user.id)) {
      return res.status(403).json({ message: "Only owners can manage this group" });
    }

    const name = req.body.name;
    const code = req.body.code;

    const addStudentIds = toUniqueIds(req.body.addStudentIds || []);
    const removeStudentIds = toUniqueIds(req.body.removeStudentIds || []);
    const addFacultyIds = toUniqueIds(req.body.addFacultyIds || []);
    const removeFacultyIds = toUniqueIds(req.body.removeFacultyIds || []);
    const addOwnerIds = toUniqueIds(req.body.addOwnerIds || []);
    const removeOwnerIds = toUniqueIds(req.body.removeOwnerIds || []);
    const primaryOwnerId = String(req.body.primaryOwnerId || "").trim();

    const validAddStudents = await validateUsersByRole(addStudentIds, "student");
    const validAddFaculty = await validateUsersByRole(addFacultyIds, "teacher");
    const validAddOwners = await validateUsersByRole(addOwnerIds, "teacher");

    const { ownerSet, facultySet, studentSet } = normalizeSubjectCollections(subject);

    validAddStudents.forEach((id) => studentSet.add(id));
    removeStudentIds.forEach((id) => studentSet.delete(id));

    validAddFaculty.forEach((id) => facultySet.add(id));
    removeFacultyIds.forEach((id) => {
      if (String(subject.teacher) === id) {
        return;
      }
      if (ownerSet.has(id)) {
        return;
      }
      facultySet.delete(id);
    });

    validAddOwners.forEach((id) => {
      ownerSet.add(id);
      facultySet.add(id);
    });

    removeOwnerIds.forEach((id) => {
      if (String(subject.teacher) === id) return;
      ownerSet.delete(id);
    });

    if (primaryOwnerId) {
      const [newPrimaryOwner] = await validateUsersByRole([primaryOwnerId], "teacher");
      subject.teacher = newPrimaryOwner;
      ownerSet.add(newPrimaryOwner);
      facultySet.add(newPrimaryOwner);
    }

    // Keep primary owner as owner/faculty and ensure at least one owner remains.
    ownerSet.add(String(subject.teacher));
    facultySet.add(String(subject.teacher));

    if (ownerSet.size === 0) {
      return res.status(400).json({ message: "At least one owner is required" });
    }

    if (typeof name === "string") {
      const nextName = name.trim();
      if (!nextName) {
        return res.status(400).json({ message: "name cannot be empty" });
      }
      subject.name = nextName;
    }

    if (typeof code === "string") {
      const nextCode = code.trim();
      if (!nextCode) {
        return res.status(400).json({ message: "code cannot be empty" });
      }
      subject.code = nextCode;
    }

    subject.students = Array.from(studentSet);
    subject.faculty = Array.from(facultySet);
    subject.owners = Array.from(ownerSet);

    await subject.save();
    await syncRoomForSubject(subject);

    const populated = await populateSubject(Subject.findById(subject._id));
    res.json(populated);
  } catch (err) {
    console.error(err);
    const isValidationError = Boolean(err?.message && err.message.includes("not valid"));
    const message = isValidationError ? err.message : "Failed to update subject";
    res.status(isValidationError ? 400 : 500).json({ message });
  }
});

// GET subjects for logged-in teacher
router.get("/my", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const subjects = await populateSubject(
      Subject.find({
        $or: [
          { teacher: req.user.id },
          { owners: req.user.id },
          { faculty: req.user.id },
        ],
      }).sort({ updatedAt: -1 })
    );

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all subjects for students
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const subjects = await Subject.find({ students: req.user.id }).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
