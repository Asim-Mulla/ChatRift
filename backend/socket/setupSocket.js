import { Server as SocketIOServer } from "socket.io";
import "dotenv/config";
import Message from "../models/messageModel.js";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import { sendPushNotification } from "../utils/sendPushNotification.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  const userSocketMap = {};
  const socketIdToEmailMap = {};
  const callTimeouts = {};
  const inCall = {};

  const disconnect = (socket) => {
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        socket.broadcast.emit("onlineContacts", Object.keys(userSocketMap));
        break;
      }
    }
    for (const socketId in socketIdToEmailMap) {
      if (socketIdToEmailMap[socket] === socket.id) {
        delete socketIdToEmailMap[socketId];
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
      .populate(
        "sender",
        "id email firstName lastName image color verified notifications"
      )
      .populate(
        "receiver",
        "id email firstName lastName image color verified notifications"
      )
      .populate({
        path: "reply.to",
        populate: {
          path: "sender receiver",
          select:
            "id email firstName lastName image color verified notifications",
        },
      });

    // Emit to sender
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }

    // Emit to receiver if online
    const receiver = await User.findById(message.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", messageData);
    }
    if (receiver?.fcmToken) {
      await sendPushNotification(receiver.fcmToken, messageData);
    }

    const senderIdStr = message.sender.toString();
    const result = await User.updateOne(
      { _id: message.receiver, "notifications.user": senderIdStr },
      { $inc: { "notifications.$.count": 1 } }
    );

    if (result.matchedCount === 0) {
      await User.updateOne(
        { _id: message.receiver },
        { $push: { notifications: { user: senderIdStr, count: 1 } } }
      );
    }
  };

  const handleMessageRead = ({ to, notifier }) => {
    const toSocketId = userSocketMap[to];

    if (toSocketId) {
      io.to(toSocketId).emit("messageRead", {
        notifier,
      });
    }
  };

  const handleMessageEdited = ({ editedMessage, group }) => {
    if (group && group.members.length) {
      group.members.forEach((memberId) => {
        const memberSocketId = userSocketMap[memberId];

        if (memberSocketId) {
          io.to(memberSocketId).emit("messageEdited", { editedMessage, group });
        }
      });

      const adminSocketId = userSocketMap[group.admin];

      if (adminSocketId) {
        io.to(adminSocketId).emit("messageEdited", { editedMessage, group });
      }
    } else {
      const senderSocketId = userSocketMap[editedMessage.sender];
      const receiverSocketId = userSocketMap[editedMessage.receiver];

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageEdited", { editedMessage });
      }

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageEdited", { editedMessage });
      }
    }
  };

  // Sending group message
  const sendAGroupMessage = async (message) => {
    const { groupId } = message;

    const newMessage = new Message(message);
    await newMessage.save();

    const messageData = await Message.findById(newMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "reply.to",
        populate: {
          path: "sender",
          select:
            "id email firstName lastName image color verified notifications",
        },
      })
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

    const groupIdStr = group._id.toString();

    if (group && group.members) {
      for (const member of group.members) {
        const memberSocketId = userSocketMap[member._id.toString()];
        const receiver = await User.findById(member._id);

        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveGroupMessage", groupMessage);
        }
        if (receiver?.fcmToken) {
          await sendPushNotification(receiver.fcmToken, messageData);
        }

        const res = await User.updateOne(
          { _id: member._id, "notifications.user": groupIdStr },
          { $inc: { "notifications.$.count": 1 } }
        );

        if (res.matchedCount === 0) {
          await User.updateOne(
            { _id: member._id },
            { $push: { notifications: { user: groupIdStr, count: 1 } } }
          );
        }
      }

      // Same for admin
      const adminSocketId = userSocketMap[group.admin._id.toString()];
      const admin = await User.findById(group.admin._id);

      if (adminSocketId) {
        io.to(adminSocketId).emit("receiveGroupMessage", groupMessage);
      }
      if (admin?.fcmToken) {
        await sendPushNotification(admin.fcmToken, messageData);
      }

      const res = await User.updateOne(
        { _id: group.admin._id, "notifications.user": groupIdStr },
        { $inc: { "notifications.$.count": 1 } }
      );

      if (res.matchedCount === 0) {
        await User.updateOne(
          { _id: group.admin._id },
          { $push: { notifications: { user: groupIdStr, count: 1 } } }
        );
      }
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

  // Call handlers
  const handleInitiateCall = async (callData) => {
    try {
      const receiverSocketId = userSocketMap[callData.receiverId];
      const callerSocketId = userSocketMap[callData.callerId];

      const callMessage = new Message({
        sender: callData.callerId,
        receiver: callData.receiverId,
        isCall: true,
        messageType:
          callData.callType === "voice" ? "voice-call" : "video-call",
        accepted: false,
      });

      const missedCall = await callMessage.save();
      const messageData = await Message.findById(missedCall._id)
        .populate(
          "sender",
          "id email firstName lastName image color verified notifications"
        )
        .populate(
          "receiver",
          "id email firstName lastName image color verified notifications"
        );

      const receiver = await User.findById(callData.receiverId);
      if (receiverSocketId) {
        // If receiver already in a call
        if (inCall[callData.receiverId]) {
          if (callerSocketId) {
            io.to(callerSocketId).emit("callBusy", callData);
            io.to(callerSocketId).emit("receiveMessage", messageData);
          }
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", messageData);
          }

          // Add notification for receiver
          const existingNotification = receiver.notifications.find(
            (notifier) => notifier.user === callData.callerId
          );

          if (existingNotification) {
            existingNotification.count += 1;
          } else {
            receiver.notifications.push({
              user: callData.callerId,
              count: 1,
            });
          }

          await receiver.save();

          return;
        }

        const callId = `call_${callData.callerId}_${
          callData.receiverId
        }_${Date.now()}`;
        inCall[callData.callerId] = callId;
        inCall[callData.receiverId] = callId;

        // Send incoming call to receiver
        io.to(receiverSocketId).emit("incomingCall", {
          ...callData,
          callId,
        });
        if (receiver?.fcmToken) {
          const incomingCall = true;
          await sendPushNotification(
            receiver.fcmToken,
            messageData,
            incomingCall
          );
        }

        // Set timeout for call (15 seconds)
        callTimeouts[callId] = setTimeout(async () => {
          try {
            if (callerSocketId) {
              io.to(callerSocketId).emit("callTimeout", {
                callId,
                channelName: callData.channelName,
              });
              io.to(callerSocketId).emit("receiveMessage", messageData);
            }
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("callTimeout", {
                callId,
                channelName: callData.channelName,
              });
              io.to(receiverSocketId).emit("receiveMessage", messageData);
            }
            // Add notification for receiver
            const receiver = await User.findById(callData.receiverId);

            const existingNotification = receiver.notifications.find(
              (notifier) => notifier.user === callData.callerId
            );

            if (existingNotification) {
              existingNotification.count += 1;
            } else {
              receiver.notifications.push({
                user: callData.callerId,
                count: 1,
              });
            }

            await receiver.save();
            if (receiver?.fcmToken) {
              await sendPushNotification(receiver.fcmToken, messageData);
            }

            clearCallState(callId);
          } catch (error) {
            console.log("Error while timeout call", error);
          }
        }, 15000);
      } else {
        // Receiver is offline
        if (callerSocketId) {
          io.to(callerSocketId).emit("userOffline", {
            userId: callData.receiverId,
          });
          io.to(callerSocketId).emit("receiveMessage", messageData);
        }
        // Add notification for receiver
        const receiver = await User.findById(callData.receiverId);

        const existingNotification = receiver.notifications.find(
          (notifier) => notifier.user === callData.callerId
        );

        if (existingNotification) {
          existingNotification.count += 1;
        } else {
          receiver.notifications.push({
            user: callData.callerId,
            count: 1,
          });
        }

        await receiver.save();

        if (receiver?.fcmToken) {
          await sendPushNotification(receiver.fcmToken, messageData);
        }
      }
    } catch (error) {
      console.log("Error while initiating call", error);
    }
  };

  const clearCallState = (callId) => {
    Object.keys(inCall).forEach((userId) => {
      if (inCall[userId] === callId) {
        delete inCall[userId];
      }
    });
    if (callTimeouts[callId]) {
      clearTimeout(callTimeouts[callId]);
      delete callTimeouts[callId];
    }
  };

  const clearCallTimeout = (callId) => {
    if (callTimeouts[callId]) {
      clearTimeout(callTimeouts[callId]);
      delete callTimeouts[callId];
    }
  };

  const handleAcceptCall = (data) => {
    const callerSocketId = userSocketMap[data.callerId];
    clearCallTimeout(data.callId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", data);
    }
  };

  const handleDeclineCall = async (data) => {
    try {
      const callerSocketId = userSocketMap[data.callerId];
      const receiverSocketId = userSocketMap[data.declinerId];
      clearCallState(data.callId);
      const callMessage = new Message({
        sender: data.callerId,
        receiver: data.declinerId,
        isCall: true,
        messageType: data.callType === "voice" ? "voice-call" : "video-call",
        accepted: false,
      });
      const missedCall = await callMessage.save();
      const messageData = await Message.findById(missedCall._id)
        .populate(
          "sender",
          "id email firstName lastName image color verified notifications"
        )
        .populate(
          "receiver",
          "id email firstName lastName image color verified notifications"
        );
      if (callerSocketId) {
        io.to(callerSocketId).emit("callDeclined", data);
        io.to(callerSocketId).emit("receiveMessage", messageData);
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageData);
      }
    } catch (error) {
      console.log("Error while declining call", error);
    }
  };

  const handleEndCall = async (data) => {
    try {
      clearCallState(inCall[data.userId] || "");
      const remoteSocketId = userSocketMap[data.remoteUserId];
      const callerSocketId = userSocketMap[data.caller];
      const receiverSocketId =
        userSocketMap[data.isInitiator ? data.remoteUserId : data.userId];

      const callMessage = new Message({
        sender: data.caller,
        receiver: data.isInitiator ? data.remoteUserId : data.userId,
        isCall: true,
        messageType: data.callType === "voice" ? "voice-call" : "video-call",
        accepted: data.wasAccepted,
        callDuration: data.duration,
      });
      const missedCall = await callMessage.save();
      const messageData = await Message.findById(missedCall._id)
        .populate(
          "sender",
          "id email firstName lastName image color verified notifications"
        )
        .populate(
          "receiver",
          "id email firstName lastName image color verified notifications"
        );

      if (remoteSocketId) {
        io.to(remoteSocketId).emit("callEnded", data);
      }
      if (callerSocketId) {
        io.to(callerSocketId).emit("receiveMessage", messageData);
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageData);
      }

      // Add notification for receiver if the call was not accepted
      if (!data.wasAccepted) {
        const receiver = await User.findById(
          data.isInitiator ? data.remoteUserId : data.userId
        );

        const existingNotification = receiver.notifications.find(
          (notifier) => notifier.user === data.caller
        );

        if (existingNotification) {
          existingNotification.count += 1;
        } else {
          receiver.notifications.push({
            user: data.caller,
            count: 1,
          });
        }

        await receiver.save();
        if (receiver?.fcmToken) {
          await sendPushNotification(receiver.fcmToken, messageData);
        }
      }
    } catch (error) {
      console.log("Error while ending call", error);
    }
  };

  const handleCallBusy = (data) => {
    const callerSocketId = userSocketMap[data.callerId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callBusy", data);
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    const userEmail = socket.handshake.query.email;

    if (userId) {
      userSocketMap[userId] = socket.id;
      socketIdToEmailMap[socket.id] = userEmail;

      socket.emit("onlineContacts", Object.keys(userSocketMap));
      socket.broadcast.emit("onlineContacts", Object.keys(userSocketMap));
    } else {
      console.log("userId not provided during connection");
    }

    socket.on("isTypingInDM", sendIsTypingForDM);
    socket.on("isTypingInGroup", sendIsTypingForGroup);
    socket.on("sendMessage", sendMessage);
    socket.on("messageRead", handleMessageRead);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("deleteMessage", handleDeleteMessage);
    socket.on("groupCreated", handleGroupCreated);
    socket.on("changedGroupName", handleChangedGroupName);
    socket.on("changedGroupMembers", handleChangedGroupMembers);
    socket.on("sendGroupMessage", sendAGroupMessage);
    socket.on("deleteGroupMessage", handleDeleteGroupMessage);
    socket.on("leftGroup", handleLeaveGroup);
    socket.on("groupDeleted", handleDeleteGroup);

    // Call events
    socket.on("initiateCall", handleInitiateCall);
    socket.on("acceptCall", handleAcceptCall);
    socket.on("declineCall", handleDeclineCall);
    socket.on("endCall", handleEndCall);
    socket.on("callBusy", handleCallBusy);

    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
