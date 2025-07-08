import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  createGroup,
  getGroupMessages,
  getUserGroups,
  changeGroupName,
  changeGroupMembers,
  exitGroup,
  deleteGroup,
} from "../controllers/groupControllers.js";

const groupRoutes = express.Router();

groupRoutes.post("/create-group", verifyToken, createGroup);
groupRoutes.get("/get-user-groups", verifyToken, getUserGroups);
groupRoutes.get("/get-group-messages/:groupId", verifyToken, getGroupMessages);
groupRoutes.patch("/change-name", verifyToken, changeGroupName);
groupRoutes.patch("/change-members", verifyToken, changeGroupMembers);
groupRoutes.patch("/exit-group", verifyToken, exitGroup);
groupRoutes.delete("/delete", verifyToken, deleteGroup);

export default groupRoutes;
