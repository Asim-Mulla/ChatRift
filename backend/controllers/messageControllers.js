import { cloudinary } from "../config/cloud.js";
import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";
import { decrypt, encrypt } from "../utils/encryption.js";

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
      deletedFor: { $ne: currentUserId },
    })
      .sort({ createdAt: 1 })
      .populate({
        path: "reply.to",
        populate: {
          path: "sender receiver",
          select:
            "id email firstName lastName image color verified notifications",
        },
      });

    const decryptedMessages = messages?.map((message) => {
      const msgObj = message.toObject();

      if (msgObj.messageType === "text" && msgObj.content) {
        msgObj.content = decrypt(msgObj.content);

        if (msgObj?.reply?.to?.messageType === "text") {
          msgObj.reply.to.content = decrypt(msgObj.reply.to.content);
        } else if (msgObj?.reply?.to?.messageType === "file") {
          msgObj.reply.to.file.url = decrypt(msgObj.reply.to.file.url);
          msgObj.reply.to.file.fileName = decrypt(
            msgObj.reply.to.file.fileName,
          );
          msgObj.reply.to.file.fileCloudName = decrypt(
            msgObj.reply.to.file.fileCloudName,
          );
        }
      } else if (msgObj.messageType === "file") {
        msgObj.file.url = decrypt(msgObj.file.url);
        msgObj.file.fileName = decrypt(msgObj.file.fileName);
        msgObj.file.fileCloudName = decrypt(msgObj.file.fileCloudName);
      }

      return msgObj;
    });

    return res.status(200).json({ messages: decryptedMessages });
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
    const { messageId, groupData } = req.body;
    const { userId } = req;

    let group = null;
    let isGroupAdmin = false;
    const groupId = groupData?.groupId;

    if (!messageId) {
      return res.status(400).send("Message id is required");
    }

    if (groupId) {
      group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).send("Group not found!");
      }

      isGroupAdmin = group.admin.toString() === userId;
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).send("Message not found");
    }

    if (group?._id) {
      if (message.sender.toString() !== userId && !isGroupAdmin) {
        return res.status(403).send("You can only delete your own messages!");
      }
    } else {
      if (message.sender.toString() !== userId) {
        return res.status(403).send("You can only delete your own messages!");
      }
    }

    let deletedMessage = null;
    if (group) {
      let updatedGroup = null;
      // is group message
      deletedMessage = await Message.findByIdAndDelete(message._id);
      if (deletedMessage?._id) {
        updatedGroup = await Group.findByIdAndUpdate(
          groupId,
          { $pull: { messages: message._id } },
          { new: true },
        );
        if (!updatedGroup?._id) {
          return res
            .status(400)
            .send("Error while removing message from group!");
        }
      } else {
        return res.status(400).send("Error while deleting message!");
      }

      if (message.messageType === "file") {
        try {
          const fileName = decrypt(message?.file?.fileCloudName);
          const isImage = fileName.startsWith("ChatRift_Development/img-");
          await cloudinary.uploader.destroy(fileName, {
            resource_type: isImage ? "image" : "raw",
          });
        } catch (error) {
          console.log("Error deleting message file from cloud");
          console.log(error);
        }
      }
    } else {
      // is direct message
      deletedMessage = await Message.findByIdAndDelete(message._id);

      if (!deletedMessage._id) {
        return res.status(400).send("Error while deleting message!");
      }

      if (deletedMessage.messageType === "file") {
        try {
          const fileName = decrypt(deletedMessage.file?.fileCloudName);
          const isImage = fileName.startsWith("ChatRift_Development/img-");
          await cloudinary.uploader.destroy(fileName, {
            resource_type: isImage ? "image" : "raw",
          });
        } catch (error) {
          console.log("Error deleting message file from cloud");
          console.log(error);
        }
      }
    }

    return res.status(200).json({ message: deletedMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const deleteMessageForUser = async (req, res) => {
  try {
    const { messageId, groupData } = req.body;
    const { userId } = req;

    if (!messageId) {
      return res.status(400).send("Message id is required");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).send("Message not found");
    }

    // If already deleted for this user
    const alreadyDeleted = message.deletedFor.some(
      (id) => id.toString() === userId,
    );

    if (alreadyDeleted) {
      return res.status(400).send("Message already deleted");
    }

    // Add user to deletedFor array
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true },
    );

    let deletedMessage = null;
    if (!updatedMessage.isGroupMessage) {
      // is direct message
      if (updatedMessage.deletedFor.length >= 2) {
        deletedMessage = await Message.findByIdAndDelete(updatedMessage._id);

        if (!deletedMessage._id) {
          return res.status(400).send("Error while deleting message!");
        }

        // If the message is of type file, then delete the file from cloud
        if (deletedMessage.messageType === "file") {
          try {
            const fileName = decrypt(deletedMessage.file?.fileCloudName);
            const isImage = fileName.startsWith("ChatRift_Development/img-");
            await cloudinary.uploader.destroy(fileName, {
              resource_type: isImage ? "image" : "raw",
            });
          } catch (error) {
            console.log("Error deleting message file from cloud");
            console.log(error);
          }
        }
      }
    } else {
      const groupId = groupData.groupId;
      let updatedGroup = null;
      const group = await Group.findById(groupId);

      if (updatedMessage.deletedFor.length >= group.members.length + 1) {
        deletedMessage = await Message.findByIdAndDelete(updatedMessage._id);

        if (deletedMessage?._id) {
          updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { $pull: { messages: deletedMessage._id } },
            { new: true },
          );
          if (!updatedGroup?._id) {
            return res
              .status(400)
              .send("Error while removing message from group!");
          }
        } else {
          return res.status(400).send("Error while deleting message!");
        }

        // If the message is of type file, then delete the file from cloud
        if (deletedMessage.messageType === "file") {
          try {
            const fileName = decrypt(deletedMessage.file?.fileCloudName);
            const isImage = fileName.startsWith("ChatRift_Development/img-");
            await cloudinary.uploader.destroy(fileName, {
              resource_type: isImage ? "image" : "raw",
            });
          } catch (error) {
            console.log("Error deleting message file from cloud");
            console.log(error);
          }
        }
      }
    }

    return res.status(200).json({ message: updatedMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId, editedContent } = req.body;
    const { userId } = req;

    if (!messageId) {
      return res.status(400).send("Message id is required");
    }

    if (!editedContent.trim()) {
      return res.status(400).send("Invalid message content");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(400).send("Message not found");
    }

    const isGroupMessage = message.isGroupMessage;

    const TWENTY_MINUTES = 20 * 60 * 1000;
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = Date.now();
    const isWithinEditWindow = currentTime - messageTime <= TWENTY_MINUTES;

    if (!isWithinEditWindow) {
      return res
        .status(400)
        .send("You can only edit messages within 15 minutes of sending.");
    }

    if (message.messageType !== "text") {
      return res.status(400).send("Only text messages can be edited.");
    }

    if (message.sender.toString() !== userId) {
      return res.status(400).send("Access Denied");
    }

    let editedMessage;
    if (isGroupMessage) {
      editedMessage = await Message.findByIdAndUpdate(
        message._id,
        { content: encrypt(editedContent), edited: true },
        { new: true },
      )
        .populate("sender", "_id firstName lastName email color image verified")
        .populate({
          path: "reply.to",
          populate: {
            path: "sender",
            select: "_id firstName lastName email color image verified",
          },
        });
    } else {
      editedMessage = await Message.findByIdAndUpdate(
        message._id,
        { content: encrypt(editedContent), edited: true },
        { new: true },
      ).populate({
        path: "reply.to",
        populate: {
          path: "sender",
          select: "_id firstName lastName email color image verified",
        },
      });
    }

    return res.status(200).json({ editedMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};
