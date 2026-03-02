const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    topics: [
      {
        title: String,
        hasNotes: Boolean,
        hasVideo: Boolean,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Syllabus",
  syllabusSchema,
  "syllabus"   // ✅ EXACT collection name from MongoDB
);
