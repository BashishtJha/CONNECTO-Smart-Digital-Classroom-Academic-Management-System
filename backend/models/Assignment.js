const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted"],
      default: "pending",
    },
    submissionUrl: {
      type: String,
      default: "",
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    attachmentUrl: {
      type: String,
      default: "",
      trim: true,
    },
    resources: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

assignmentSchema.index({ subject: 1, dueDate: 1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
