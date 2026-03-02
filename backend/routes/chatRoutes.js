const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Subject = require("../models/Subject");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");
const ChatAnnouncement = require("../models/ChatAnnouncement");

const canAccessRoom = (room, userId) => {
  if (String(room.teacher) === userId) return true;
  return room.members.some((memberId) => String(memberId) === userId);
};

const canManageRoom = async (room, userId) => {
  if (String(room.teacher) === userId) return true;
  if (!room.subject) return false;

  const subject = await Subject.findById(room.subject).select("owners teacher");
  if (!subject) return false;

  if (String(subject.teacher) === userId) return true;
  return (subject.owners || []).some((ownerId) => String(ownerId) === userId);
};

// POST create room by subject (teacher)
router.post("/rooms", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { subjectId, name } = req.body;
    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const isOwner =
      String(subject.teacher) === req.user.id ||
      (subject.owners || []).some((ownerId) => String(ownerId) === req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: "Only group owners can create room" });
    }

    const existingRoom = await ChatRoom.findOne({ subject: subjectId });
    if (existingRoom) {
      return res.status(409).json({ message: "Room already exists for this subject" });
    }

    const memberSet = new Set([
      req.user.id,
      ...subject.students.map((studentId) => String(studentId)),
      ...(subject.faculty || []).map((facultyId) => String(facultyId)),
      ...(subject.owners || []).map((ownerId) => String(ownerId)),
    ]);

    const room = await ChatRoom.create({
      subject: subjectId,
      name: name || subject.name,
      teacher: req.user.id,
      members: Array.from(memberSet),
    });

    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create room" });
  }
});

// GET rooms by logged-in user
router.get("/rooms", authMiddleware, async (req, res) => {
  try {
    const query =
      req.user.role === "teacher"
        ? { $or: [{ teacher: req.user.id }, { members: req.user.id }] }
        : { members: req.user.id };

    const rooms = await ChatRoom.find(query)
      .populate("subject", "name code")
      .populate("teacher", "name")
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
});

// GET messages by room
router.get("/rooms/:roomId/messages", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!canAccessRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await ChatMessage.find({ room: roomId })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// POST message in room
router.post("/rooms/:roomId/messages", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!canAccessRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await ChatMessage.create({
      room: roomId,
      sender: req.user.id,
      text: String(text).trim(),
    });

    room.lastMessage = String(text).trim();
    room.lastMessageAt = new Date();
    await room.save();

    const populated = await ChatMessage.findById(message._id).populate(
      "sender",
      "name role"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET announcements by room
router.get("/rooms/:roomId/announcements", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!canAccessRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const announcements = await ChatAnnouncement.find({ room: roomId })
      .populate("author", "name")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// POST announcement in room (teacher)
router.post("/rooms/:roomId/announcements", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { roomId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const canManage = await canManageRoom(room, req.user.id);
    if (!canManage) {
      return res.status(403).json({ message: "Only room owners can announce" });
    }

    const announcement = await ChatAnnouncement.create({
      room: roomId,
      author: req.user.id,
      title,
      content,
    });

    room.lastMessage = `[Announcement] ${title}`;
    room.lastMessageAt = new Date();
    await room.save();

    const populated = await ChatAnnouncement.findById(announcement._id).populate(
      "author",
      "name"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

module.exports = router;
