import "dotenv/config";
import express from "express";
import cors from "cors";
import job from "./config/cron.js";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import setupSocket from "./socket/setupSocket.js";
import messageRoutes from "./routes/messageRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import authRouter from "./routes/googleAuthRoutes.js";
import agoraRoutes from "./routes/agoraRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

if (process.env.NODE_ENV === "production") {
  job.start();
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "server is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/agora", agoraRoutes);
app.use("/auth", authRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

const startServer = async () => {
  await connectDB();

  const server = app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
  });

  setupSocket(server);
};

startServer();
