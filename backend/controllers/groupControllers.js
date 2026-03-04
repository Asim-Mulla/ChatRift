import mongoose from "mongoose";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import Message from "../models/messageModel.js";
import { cloudinary } from "../config/cloud.js";
import { decrypt } from "../utils/encryption.js";

export const createGroup = async (req, res) => {
  try {
    const { userId } = req;
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).send("Group name is required!");
    } else if (!members || !members.length) {
      return res.status(400).send("At least one member is required!");
    }

    const alreadyExists = await Group.findOne({ name, admin: userId });

    if (alreadyExists) {
      return res.status(400).send(`Group with name "${name}" already exists!`);
    }

    const admin = await User.findById(userId);

    if (!admin) {
      return res.status(400).send("Admin not found!");
    }

    const validMembers = await User.find({ _id: { $in: members } });

    if (validMembers.length !== members.length) {
      return res.status(400).send("Found an invalid member!");
    }

    const newGroup = new Group({
      name,
      members,
      admin: userId,
    });

    await newGroup.save();
    await newGroup.populate("members", "firstName lastName verified _id");

    return res.status(201).json({ group: newGroup });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const groups = await Group.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("members", "firstName lastName verified _id");

    return res.status(200).json({ groups });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    if (!groupId) {
      return res.status(400).send("Invalid group id!");
    }

    const group = await Group.findById(groupId).populate({
      path: "messages",
      populate: [
        {
          path: "sender",
          select: "email firstName lastName image color verified _id",
        },
        {
          path: "reply.to",
          populate: {
            path: "sender",
            select: "email firstName lastName image color verified _id",
          },
        },
      ],
    });

    if (!group) {
      return res.status(404).send("Group not found!");
    }

    if (group.admin.toString() !== userId && !group.members.includes(userId)) {
      return res.status(403).send("Access denied");
    }

    const messages = group.messages.filter(
      (message) => !message.deletedFor.some((id) => id.toString() === userId),
    );

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
    console.log(error.message);
    return res.status(500).send("Internal server error");
  }
};

export const changeGroupName = async (req, res) => {
  try {
    const { userId } = req;
    const { name, originalName } = req.body;

    if (!name || !originalName) {
      return res.status(400).send("Invalid group name!");
    }

    const group = await Group.findOne({
      admin: userId,
      name: originalName,
    });

    if (!group) {
      return res.status(400).send("Group not found!");
    }

    group.name = name;
    await group.save();
    await group.populate("members", "firstName lastName _id verified");

    res.status(200).json({ group });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal server error");
  }
};

export const changeGroupMembers = async (req, res) => {
  try {
    const { userId } = req;
    let { name, originalName, members } = req.body;

    const newMembers = members?.map(
      (member) => new mongoose.Types.ObjectId(member),
    );

    if (!name || !originalName) {
      return res.status(400).send("Invalid group name!");
    }

    const group = await Group.findOne({
      admin: userId,
      name: originalName,
    }).populate("members", "firstName lastName _id verified");

    if (!group) {
      return res.status(400).send("Group not found!");
    }

    const oldMembers = group.members;

    group.name = name;
    group.members = newMembers;

    await group.save();
    await group.populate("members", "firstName lastName _id verified");

    const removedMembers = oldMembers.filter(
      (oldmember) =>
        !newMembers.some(
          (newMember) => newMember.toString() === oldmember._id.toString(),
        ),
    );

    return res.status(200).json({ group, removedMembers });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal server error");
  }
};

export const exitGroup = async (req, res) => {
  try {
    const { userId } = req;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).send("Group id not found!");
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(400).send("Group not found!");
    }

    if (group.admin.toString() === userId) {
      return res
        .status(400)
        .send("Admin cannot exit. Transfer admin or delete group.");
    }

    const newMembers = group.members.filter(
      (member) => member.toString() !== userId,
    );

    group.members = newMembers;

    await group.save();
    await group.populate("members", "firstName lastName _id verified");

    return res.status(200).json({ group });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal server error");
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { userId } = req;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).send("Invalid group id!");
    }

    const group = await Group.findById(groupId).populate(
      "messages",
      "file messageType",
    );

    if (!group) {
      return res.status(400).send("Group not found!");
    }

    if (userId !== group.admin.toString()) {
      return res.status(403).send("Access Denied");
    }

    if (group.messages.length) {
      const fileMessages = group.messages
        .filter((message) => message?.messageType === "file")
        .map((message) => {
          if (message?.file?.fileCloudName) {
            return decrypt(message.file.fileCloudName);
          }
        })
        ?.filter(Boolean);

      const deletedMessages = await Message.deleteMany({
        _id: { $in: group.messages },
      });

      if (
        deletedMessages.acknowledged &&
        deletedMessages.deletedCount &&
        fileMessages.length
      ) {
        await Promise.all(
          fileMessages.map(async (fileCloudName) => {
            try {
              const isImage = fileCloudName.startsWith(
                "ChatRift_Development/img-",
              );

              await cloudinary.uploader.destroy(fileCloudName, {
                resource_type: isImage ? "image" : "raw",
              });
            } catch (error) {
              console.log("File not deleted:", fileCloudName);
            }
          }),
        );
      }
    }

    const deletedGroup = await Group.findByIdAndDelete(groupId);

    return res.status(200).json({ deletedGroup });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal server error");
  }
};
