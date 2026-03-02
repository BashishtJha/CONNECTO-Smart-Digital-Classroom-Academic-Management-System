const mongoose = require("mongoose");

const personalReminderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Study", "Project", "Revision", "Other"],
      default: "Study",
    },
    remindAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

personalReminderSchema.index({ student: 1, remindAt: 1 });

module.exports = mongoose.model("PersonalReminder", personalReminderSchema);
