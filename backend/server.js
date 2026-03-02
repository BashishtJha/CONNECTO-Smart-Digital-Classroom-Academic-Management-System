const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const syllabusRoutes = require("./routes/syllabusRoutes");
const noteRoutes = require("./routes/noteRoutes");
const videoLectureRoutes = require("./routes/videoLectureRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const chatRoutes = require("./routes/chatRoutes");
const routineRoutes = require("./routes/routineRoutes");
const personalReminderRoutes = require("./routes/personalReminderRoutes");

const app = express();

/* 🔴 REQUIRED FOR MULTER */
app.use(express.urlencoded({ extended: true }));

/* COMMON MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* STATIC FILES */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/subjects", subjectRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/video-lectures", videoLectureRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/routine", routineRoutes);
app.use("/api/personal-reminders", personalReminderRoutes);

/* TEST */
app.get("/", (req, res) => {
  res.send("CONNECTO Backend is Running 🚀");
});

/* DB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
