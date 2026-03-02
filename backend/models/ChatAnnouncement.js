const mongoose = require("mongoose");

const chatAnnouncementSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

chatAnnouncementSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model("ChatAnnouncement", chatAnnouncementSchema);
