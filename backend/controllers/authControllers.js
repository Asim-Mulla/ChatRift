import "dotenv/config";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloud.js";
import validator from "validator";
import { randomInt } from "crypto";
import Otp from "../models/otpModel.js";
import sendOtpEmail from "../utils/sendOtpEmail.js";

const maxAge = 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const createToken = (email, userId) => {
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ email, userId }, secret, { expiresIn: maxAge });
  return token;
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).send("Invalid email or password");
    }

    const alreadyExists = await User.findOne({ email });

    if (alreadyExists) {
      return res.status(400).send("User already exists!");
    }

    const tooManyAttempts = await Otp.find({ email });
    if (tooManyAttempts.length >= 3) {
      return res.json({
        success: false,
        tooManyAttempts: true,
        message: "Too many attempts, please try again later.",
      });
    }

    const otp = randomInt(100000, 1000000).toString();

    const newOtp = new Otp({ email, otp });

    await newOtp.save();

    await sendOtpEmail(email, `Your OTP is ${otp}`);

    res.json({ success: true, message: "OTP sent to email." });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const verifyOtpAndSignup = async (req, res) => {
  try {
    const { userData, otp } = req.body;
    const { email, password } = userData;

    if (!email || !password || !otp) {
      return res.status(400).json("Missing required fields.");
    }

    const existingOtp = await Otp.findOne({ email, otp });

    if (!existingOtp) {
      return res.status(400).json("Invalid or expired otp.");
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json("Please enter a strong password (min 8 digits).");
    }

    const salt = await bcrypt.genSalt(7);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hashedPassword });

    // Notifying on telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const sendTelegramNotification = async () => {
        const message = `! New user signed up !
    User email :- ${user.email},
    `;

        const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
          message
        )}`;

        try {
          const response = await fetch(url);
          const result = await response.json();
          if (result.ok) {
            // console.log("Notification sent successfully!");
          } else {
            console.error("Failed to send notification:", result);
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      };

      sendTelegramNotification();
    }

    res
      .status(201)
      .cookie("token", createToken(email, user._id), {
        maxAge: maxAge,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
      })
      .json({
        user: {
          id: user._id,
          email: user.email,
          profileSetup: user.profileSetup,
        },
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email) || !password) {
      return res.status(400).send("Invalid email or password.");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("Incorrect email or password.");
    }

    const correctPassword = await bcrypt.compare(password, user.password);

    if (!correctPassword) {
      return res.status(400).send("Incorrect email or password!");
    }

    // Notifying on telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const sendTelegramNotification = async () => {
        const message = `! New user logged in !
    ${user.firstName ? `User name :- ${user.firstName} ${user.lastName}` : ""}
    User email :- ${user.email},
    `;

        const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
          message
        )}`;

        try {
          const response = await fetch(url);
          const result = await response.json();
          if (result.ok) {
            // console.log("Notification sent successfully!");
          } else {
            console.error("Failed to send notification:", result);
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      };

      sendTelegramNotification();
    }

    res
      .status(200)
      .cookie("token", createToken(email, user._id), {
        maxAge: maxAge,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
      })
      .json({
        user: {
          id: user._id,
          email: user.email,
          profileSetup: user.profileSetup,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          color: user.color,
          notifications: user.notifications,
          verified: user.verified,
        },
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(404).send("User id not found!");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found!");
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        color: user.color,
        image: user.image,
        notifications: user.notifications,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).send("All fields are required!");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        color: user.color,
        notifications: user.notifications,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const addProfileImage = async (req, res) => {
  try {
    const { userId } = req;

    if (!req.file) {
      return res.status(400).send("No image file provided");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).send("User not found!");
    }

    if (req.file) {
      if (user.image.filename) {
        try {
          await cloudinary.uploader.destroy(user.image.filename);
        } catch (error) {
          console.log(error);
        }
      }

      user.image = { url: req.file.path, filename: req.file.filename };

      await user.save();
    } else {
      return res.status(400).send("No image file provided");
    }

    return res.status(200).json({
      image: user.image,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    const { userId } = req;

    const user = await User.findByIdAndUpdate(
      userId,
      { image: {} },
      { runValidators: true }
    );

    try {
      await cloudinary.uploader.destroy(user.image.filename);
    } catch (error) {
      console.log(error);
    }

    res.status(200).json({ image: {} });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
      })
      .send("Logout Successful");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};
