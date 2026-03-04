import mongoose, { Mongoose } from "mongoose";

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
    isGroupMessage: {
      type: Boolean,
    },
    accepted: {
      type: Boolean,
      required: function () {
        return ["voice-call", "video-call"].includes(this.messageType);
      },
    },
    callDuration: {
      type: Number,
      min: 0,
      required: function () {
        return (
          ["voice-call", "video-call"].includes(this.messageType) &&
          this.accepted === true
        );
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
      required: function () {
        return this.messageType === "text";
      },
    },
    file: {
      type: {
        url: String,
        fileName: String,
        fileCloudName: String,
        size: Number,
      },
    },
    reply: {
      type: {
        isReply: Boolean,
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
        },
      },
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
