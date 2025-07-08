import "dotenv/config";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloud.js";
import validator from "validator";

const maxAge = 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ email, userId }, secret, { expiresIn: maxAge });
  return token;
};

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email) || !password) {
      return res.status(400).send("Invalid email or password");
    }

    if (password.length < 8) {
      return res.status(200).send("Please enter a strong password");
    }

    const alreadyExists = await User.findOne({ email });

    if (alreadyExists) {
      return res.status(400).send("User already exists!");
    }

    const salt = await bcrypt.genSalt(7);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hashedPassword });

    res
      .status(201)
      .cookie("token", createToken(email, user._id), {
        maxAge: maxAge,
        httpOnly: true,
        secure: true,
        sameSite: "None",
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

    res
      .status(200)
      .cookie("token", createToken(email, user._id), {
        maxAge: maxAge,
        httpOnly: true,
        secure: true,
        sameSite: "None",
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
        secure: true,
        sameSite: "None",
      })
      .send("Logout Successful");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};
