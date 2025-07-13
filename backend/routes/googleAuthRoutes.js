import express from "express";
import { googleLogin } from "../controllers/googleAuthControllers.js";

const authRouter = express.Router();

authRouter.get("/google", googleLogin);

export default authRouter;
