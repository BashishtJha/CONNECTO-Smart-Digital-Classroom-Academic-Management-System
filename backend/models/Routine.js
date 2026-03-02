const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    classSection: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      default: "",
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

routineSchema.index({ subject: 1, day: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Routine", routineSchema);
