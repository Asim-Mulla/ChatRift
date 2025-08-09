import admin from "../config/firebase.js";
import User from "../models/userModel.js";

export const sendPushNotification = async (
  token,
  messageData,
  incomingCall = false
) => {
  try {
    let title = "";
    let body = "";

    if (incomingCall) {
      title = `${messageData.sender.firstName} ${messageData.sender.lastName}`;
      body = `Incoming ${
        messageData.messageType === "voice-call" ? "Voice" : "Video"
      } Call`;
      // Check for missed call
    } else if (messageData.isCall && messageData.accepted === false) {
      title = `${messageData.sender.firstName} ${messageData.sender.lastName}`;
      body = `Missed ${
        messageData.messageType === "voice-call" ? "Voice" : "Video"
      } Call`;
    }
    // File message
    else if (messageData?.file?.fileName) {
      title = `${messageData.sender.firstName} ${messageData.sender.lastName}`;
      body = `Sent a file: ${messageData?.file?.fileName}`;
    }
    // Text message
    else if (messageData.content) {
      title = `${messageData.sender.firstName} ${messageData.sender.lastName}`;
      body = messageData.content;
    }

    const message = {
      token,
      data: {
        title,
        body,
        senderId: messageData.sender._id.toString(),
        senderImage: messageData.sender?.image?.url || "",
      },
    };

    await admin.messaging().send(message);
  } catch (error) {
    if (
      error.errorInfo?.code === "messaging/registration-token-not-registered"
    ) {
      // Remove the invalid token from the database
      await User.updateOne({ fcmToken: token }, { $unset: { fcmToken: "" } });
    } else {
      console.error(
        "Failed to send push notification:",
        error.errorInfo || error
      );
    }
  }
};
