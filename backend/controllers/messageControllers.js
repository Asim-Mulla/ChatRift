import { cloudinary } from "../config/cloud.js";
import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.otherUserId;

    if (!currentUserId || !otherUserId) {
      return res.status(400).send("User id not found!");
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      console.error("Upload error: No file found in request");
      return res.status(400).send("File not found!");
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileCloudName = req.file.filename;

    return res
      .status(200)
      .json({ filePath, fileName, fileSize, fileCloudName });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { message, group } = req.body;
    const { userId } = req;
    const isGroupAdmin = group?.admin === userId;

    if (!message._id) {
      return res.status(400).send("Message not found!");
    }

    if (group?.groupId) {
      if (message.sender._id !== userId && !isGroupAdmin) {
        return res.status(403).send("You can only delete your own messages!");
      }
    } else {
      if (message.sender !== userId && !isGroupAdmin) {
        return res.status(403).send("You can only delete your own messages!");
      }
    }

    let deletedMessage = null;
    let updatedGroup = null;

    if (group?.groupId) {
      // is gm
      updatedGroup = await Group.findByIdAndUpdate(
        group.groupId,
        { $pull: { messages: message._id } },
        { new: true }
      );
      deletedMessage = await Message.findByIdAndDelete(message._id);
    } else {
      // is dm
      deletedMessage = await Message.findByIdAndDelete(message._id);
    }

    if (group?.groupId && !updatedGroup && !deletedMessage) {
      return res.status(400).send("Error while deleting message!");
    }

    if (!deletedMessage) {
      return res.status(400).send("Error while deleting message!");
    }

    if (message.messageType === "file") {
      try {
        const fileName = message.file.fileCloudName;
        const isImage = fileName.startsWith("ChatRift_Development/img-");
        await cloudinary.uploader.destroy(fileName, {
          resource_type: isImage ? "image" : "raw",
        });
      } catch (error) {
        console.log(error);
        console.log("file not deleted from cloud");
      }
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};
