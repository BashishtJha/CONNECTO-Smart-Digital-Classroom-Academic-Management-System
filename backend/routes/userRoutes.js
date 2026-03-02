const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const uploadProfilePhoto = require("../middleware/uploadProfilePhoto");

const router = express.Router();

/* USER LIST FOR TEACHER GROUP MANAGEMENT */
router.get("/list", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const role = String(req.query.role || "").trim();
    const search = String(req.query.search || "").trim();

    const query = {};
    if (role) {
      if (!["student", "teacher"].includes(role)) {
        return res.status(400).json({ message: "Invalid role filter" });
      }
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email role")
      .sort({ name: 1 })
      .limit(200);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* GET PROFILE */
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

/* UPDATE PROFILE */
router.put("/me", auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "name and email are required" });
    }

    const existing = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name: String(name).trim(), email: String(email).trim() },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

/* UPDATE PROFILE PHOTO */
router.put("/me/photo", auth, uploadProfilePhoto.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "photo file is required" });
    }

    const photoPath = `/uploads/profiles/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoPath },
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile photo" });
  }
});

module.exports = router;
