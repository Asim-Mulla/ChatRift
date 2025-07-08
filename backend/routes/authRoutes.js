import express from "express";
import {
  login,
  signup,
  getUserInfo,
  updateProfile,
  addProfileImage,
  deleteProfileImage,
  logout,
} from "../controllers/authControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const authRoutes = express.Router();

// upload image to cloud setup
import multer from "multer";
import { storage } from "../config/cloud.js";
const upload = multer({ storage });

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/user-info", verifyToken, getUserInfo);
authRoutes.post("/update-profile", verifyToken, updateProfile);
authRoutes.post(
  "/add-profile-image",
  verifyToken,
  upload.single("profile-image"),
  // verifyToken,
  addProfileImage
);
authRoutes.post("/delete-profile-image", verifyToken, deleteProfileImage);
authRoutes.post("/logout", logout);

export default authRoutes;
