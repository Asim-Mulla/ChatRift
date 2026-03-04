import "dotenv/config";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloud.js";
import validator from "validator";
import Otp from "../models/otpModel.js";
import { sendTelegramNotification } from "../utils/sendTelegramNotification.js";

const maxAge = 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const createToken = (email, userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ email, userId }, secret, { expiresIn: "1d" });
  return token;
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const _email = email.toLowerCase().trim();

    if (!_email || !validator.isEmail(_email)) {
      return res.status(400).send("Invalid email or password");
    }

    const alreadyExists = await User.findOne({ email: _email });

    if (alreadyExists) {
      return res.status(400).send("User already exists!");
    }

    const tooManyAttempts = await Otp.find({ email: _email });
    if (tooManyAttempts.length >= 3) {
      return res.json({
        success: false,
        tooManyAttempts: true,
        message: "Too many attempts, please try again later.",
      });
    }

    // const otp = randomInt(100000, 1000000).toString();

    // const newOtp = new Otp({ email, otp });

    // await newOtp.save();

    // await sendOtpEmail(email, `Your OTP is ${otp}`);

    // res.json({ success: true, message: "OTP sent to email." });
    res.json({ success: true, message: "Could not send OTP email." });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const verifyOtpAndSignup = async (req, res) => {
  try {
    const { userData, otp } = req.body;
    const { email, password } = userData;

    const _email = email.toLowerCase().trim();

    if (!_email || !password || !otp) {
      return res.status(400).json("Missing required fields.");
    }

    const existingOtp = await Otp.findOne({ email: _email, otp });

    if (!existingOtp) {
      return res.status(400).json("Invalid or expired otp.");
    }

    const existingUser = await User.findOne({ email: _email });

    if (existingUser) {
      return res.status(400).json("User already exists.");
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json("Please enter a strong password (min 8 characters).");
    }

    const salt = await bcrypt.genSalt(7);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ email: _email, password: hashedPassword });

    const message = `! New user signed up !
User email :- ${user.email},
`;

    await sendTelegramNotification(message);

    await Otp.deleteMany({ email: _email });

    res
      .status(201)
      .cookie("token", createToken(_email, user._id), {
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

    const _email = email.toLowerCase().trim();

    if (!_email || !validator.isEmail(_email) || !password) {
      return res.status(400).send("Invalid email or password.");
    }

    const user = await User.findOne({ email: _email });

    if (!user) {
      return res.status(400).send("Incorrect email or password.");
    }

    const correctPassword = await bcrypt.compare(password, user.password);

    if (!correctPassword) {
      return res.status(400).send("Incorrect email or password!");
    }

    // Notifying on telegram
    const message = `! New user logged in !
    ${user.firstName ? `User name :- ${user.firstName} ${user.lastName}` : ""}
    User email :- ${user.email},
    `;

    await sendTelegramNotification(message);

    res
      .status(200)
      .cookie("token", createToken(_email, user._id), {
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
      { new: true, runValidators: true },
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
      if (user?.image?.filename) {
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
      { runValidators: true },
    );

    try {
      if (user?.image?.filename) {
        await cloudinary.uploader.destroy(user.image.filename);
      }
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
