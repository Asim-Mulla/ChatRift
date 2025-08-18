import mongoose from "mongoose";
import User from "../models/userModel.js";
import Message from "../models/messageModel.js";

export const getUsersForDm = async (req, res) => {
  try {
    const { userId } = req;

    const users = await User.find({ _id: { $ne: userId } });

    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const getDMContacts = async (req, res) => {
  try {
    let { userId } = req;

    userId = new mongoose.Types.ObjectId(userId);

    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$receiver",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          email: "$user.email",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          image: "$user.image",
          color: "$user.color",
          verified: "$user.verified",
          notifications: "$user.notifications",
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    return res.status(200).json({ contacts });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const getUsersForGroup = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.userId } },
      "email firstName lastName _id verified"
    );

    const contacts = users.map((user) => ({
      label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      value: user._id,
      verified: user.verified,
    }));

    return res.status(200).json({ contacts });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const removeNotification = async (req, res) => {
  try {
    const { userId } = req;
    const { notifier } = req.body;

    if (!notifier) {
      return res.status(400).send("Notifier id not found!");
    }

    const notifierStr = notifier.toString();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { notifications: { user: notifierStr } } },
      { new: true } // return updated doc
    );

    if (!updatedUser) {
      return res.status(404).send("User not found!");
    }

    res.status(200).json({
      success: true,
      notifications: updatedUser.notifications,
    });
  } catch (error) {
    console.error("Error removing notification:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send("User id not found!");
    }

    const user = await User.findById(
      userId,
      "_id email firstName lastName color profileSetup image verified"
    );

    if (!user) {
      return res.status(400).send("User not found!");
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    const { userId } = req;

    if (!token) {
      return res.status(400).send("Token not found!");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).send("User not found!");
    }

    user.fcmToken = token;
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};
