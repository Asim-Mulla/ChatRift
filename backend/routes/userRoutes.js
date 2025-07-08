import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  getUsersForDm,
  getDMContacts,
  getUsersForGroup,
  removeNotification,
  getUserInfo,
} from "../controllers/userControllers.js";

const userRoutes = express.Router();

userRoutes.get("/get-users-for-dm", verifyToken, getUsersForDm);
userRoutes.get("/get-dm-contacts", verifyToken, getDMContacts);
userRoutes.get("/get-users-for-group", verifyToken, getUsersForGroup);
userRoutes.get("/get-user-info/:userId", verifyToken, getUserInfo);
userRoutes.post("/remove-notification", verifyToken, removeNotification);

export default userRoutes;
