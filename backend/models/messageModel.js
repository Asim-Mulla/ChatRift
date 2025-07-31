import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isCall: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "voice-call", "video-call"],
      required: true,
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    callDuration: {
      type: Number,
      min: 0,
      required: function () {
        return this.accepted === true;
      },
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text";
      },
    },
    edited: {
      type: Boolean,
      default: false,
    },
    file: {
      type: {
        url: { type: String },
        fileName: { type: String },
        fileCloudName: { type: String },
        size: { type: Number },
      },
      required: function () {
        return this.messageType === "file";
      },
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
