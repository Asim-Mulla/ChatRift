import express from "express";
import "dotenv/config";
import { generateAgoraToken } from "../controllers/agoraControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const agoraRoutes = express.Router();

agoraRoutes.post("/generate-token", verifyToken, generateAgoraToken);

export default agoraRoutes;
