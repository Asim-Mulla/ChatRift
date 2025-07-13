import { Server as SocketIOServer } from "socket.io";
import "dotenv/config";
import Message from "../models/messageModel.js";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  const userSocketMap = {};

  const disconnect = (socket) => {
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        socket.broadcast.emit("onlineContacts", Object.keys(userSocketMap));
        break;
      }
    }
  };

  // Typing indicator for DM
  const sendIsTypingForDM = (typingData) => {
    io.to(userSocketMap[typingData.to]).emit("isTypingInDM", typingData);
  };

  // Typing indicator for GM
  const sendIsTypingForGroup = async (typingData) => {
    const typer = typingData.from;
    const group = typingData.in;

    // Typing indicator for group members
    if (group?.members?.length !== 0) {
      group.members.forEach((member) => {
        if (member._id.toString() !== typer.id) {
          const memberSocketId = userSocketMap[member._id.toString()];
          if (memberSocketId) {
            io.to(memberSocketId).emit("isTypingInGroup", {
              typer,
              typing: typingData.isTyping,
              in: group,
            });
          }
        }
      });
    }

    if (typingData.from.id !== group?.admin) {
      const adminSocketId = userSocketMap[group.admin.toString()];
      if (adminSocketId) {
        io.to(adminSocketId).emit("isTypingInGroup", {
          typer,
          typing: typingData.isTyping,
          in: group,
        });
      }
    }
  };

  // Sending direct message
  const sendMessage = async (message) => {
    const senderSocketId = userSocketMap[message.sender];
    const receiverSocketId = userSocketMap[message.receiver];

    const newMessage = new Message(message);
    await newMessage.save();

    const messageData = await Message.findById(newMessage._id)
      .populate("sender", "id email firstName lastName image color verified")
      .populate("receiver", "id email firstName lastName image color verified");

    // Emit to sender
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }

    // Emit to receiver if online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", messageData);
    }

    // Add notification for receiver
    const receiver = await User.findById(message.receiver);

    const existingNotification = receiver.notifications.find(
      (notifier) => notifier.user === message.sender
    );

    if (existingNotification) {
      existingNotification.count += 1;
    } else {
      receiver.notifications.push({
        user: message.sender,
        count: 1,
      });
    }

    await receiver.save();
  };

  // Sending group message
  const sendAGroupMessage = async (message) => {
    const { groupId } = message;

    const newMessage = new Message(message);
    await newMessage.save();

    const messageData = await Message.findById(newMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();

    // adding message in the group's messages array
    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: newMessage._id },
    });

    const group = await Group.findById(groupId).populate("members");

    const groupMessage = {
      ...messageData._doc,
      groupId: group._id,
      groupName: group.name,
    };

    // sending message to all online members and to admin
    if (group && group.members) {
      group.members.forEach(async (member) => {
        const memberSocketId = userSocketMap[member._id.toString()];
        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveGroupMessage", groupMessage);
        }

        // notification
        const receiver = await User.findById(member._id);

        const existingNotification = receiver.notifications.find(
          (notifier) => notifier.user === groupId
        );

        if (existingNotification) {
          existingNotification.count += 1;
        } else {
          receiver.notifications.push({ user: groupId, count: 1 });
        }

        await receiver.save();
      });

      const adminSocketId = userSocketMap[group.admin._id.toString()];
      if (adminSocketId) {
        io.to(adminSocketId).emit("receiveGroupMessage", groupMessage);
      }

      // notification
      const admin = await User.findById(group.admin._id);

      const existingNotification = admin.notifications.find(
        (notifier) => notifier.user === groupId
      );

      if (existingNotification) {
        existingNotification.count += 1;
      } else {
        admin.notifications.push({ user: groupId, count: 1 });
      }

      await admin.save();
    }
  };

  // Deleting direct message
  const handleDeleteMessage = (data) => {
    const { message, chatType } = data;
    if (chatType === "Contact") {
      io.to(userSocketMap[message.receiver]).emit("messageDeleted", {
        message,
      });
    }
  };

  // Deleting group message
  const handleDeleteGroupMessage = async (data) => {
    const { message, chatType, groupId } = data;
    if (chatType === "Group") {
      const group = await Group.findById(groupId).populate("members");

      // emitting 'message deleted' to all online members and to admin
      if (group && group.members) {
        group.members.forEach((member) => {
          const memberSocketId = userSocketMap[member._id.toString()];
          if (memberSocketId) {
            io.to(memberSocketId).emit("messageDeleted", { message });
          }
        });
        const adminSocketId = userSocketMap[group.admin.toString()];
        if (adminSocketId) {
          io.to(adminSocketId).emit("messageDeleted", { message });
        }
      }
    }
  };

  // Creating group
  const handleGroupCreated = (group) => {
    // emitting created group to all online members
    if (group?.members?.length) {
      group.members.forEach((member) => {
        const membersocketId = userSocketMap[member._id];
        if (membersocketId) {
          io.to(membersocketId).emit("groupCreated", group);
        }
      });
    }
  };

  // member leaving group
  const handleLeaveGroup = async ({ group, userId }) => {
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found!");
      return;
    }

    // emitting 'member left' to all online group members
    if (group?.members?.length !== 0) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap[member._id];
        if (memberSocketId) {
          io.to(memberSocketId).emit("leftGroup", { group, user });
        }
      });
    }

    // emitting 'member left' to admin
    const adminSocketId = userSocketMap[group.admin];
    if (adminSocketId) {
      io.to(adminSocketId).emit("leftGroup", { group, user });
    }
  };

  // emitting changed group name to all online group members
  const handleChangedGroupName = (group) => {
    if (group?.members?.length !== 0) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap[member._id];
        if (memberSocketId) {
          io.to(memberSocketId).emit("changedGroupName", group);
        }
      });
    }
  };

  // members changed
  const handleChangedGroupMembers = ({ group, removedMembers }) => {
    // emitting new members to existing members
    if (group?.members?.length !== 0) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap[member._id];
        if (memberSocketId) {
          io.to(memberSocketId).emit("changedGroupMembers", group);
        }
      });
    }

    // emitting new members to removed members
    if (removedMembers.length !== 0) {
      removedMembers.forEach((member) => {
        const memberSocketId = userSocketMap[member._id];
        if (memberSocketId) {
          io.to(memberSocketId).emit("removedFromGroup", group);
        }
      });
    }
  };

  // emitting 'group deleted' to all online group members
  const handleDeleteGroup = (deletedGroup) => {
    if (deletedGroup && deletedGroup?.members?.length) {
      deletedGroup.members.forEach((memberId) => {
        const memberSocketId = userSocketMap[memberId];
        if (memberSocketId) {
          io.to(memberSocketId).emit("groupDeleted", deletedGroup);
        }
      });
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
      socket.emit("onlineContacts", Object.keys(userSocketMap));
      socket.broadcast.emit("onlineContacts", Object.keys(userSocketMap));
    } else {
      console.log("userId not provided during connection");
    }

    socket.on("isTypingInDM", sendIsTypingForDM);
    socket.on("isTypingInGroup", sendIsTypingForGroup);
    socket.on("sendMessage", sendMessage);
    socket.on("deleteMessage", handleDeleteMessage);
    socket.on("groupCreated", handleGroupCreated);
    socket.on("changedGroupName", handleChangedGroupName);
    socket.on("changedGroupMembers", handleChangedGroupMembers);
    socket.on("sendGroupMessage", sendAGroupMessage);
    socket.on("deleteGroupMessage", handleDeleteGroupMessage);
    socket.on("leftGroup", handleLeaveGroup);
    socket.on("groupDeleted", handleDeleteGroup);
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
