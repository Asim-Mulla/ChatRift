import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import setupSocket from "./socket/setupSocket.js";
import messageRoutes from "./routes/messageRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.json({ limit: "5mb" })); // Increase JSON limit
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Increase URL encoded limit

connectDB();

app.get("/", (req, res) => {
  res.send("Server is listening");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/group", groupRoutes);

const server = app.listen(port, () => {
  console.log("app is listening on port 3000");
});

// const server = app.listen(port, "0.0.0.0", () => {
//   console.log("app is listening on port 3000");
// });

setupSocket(server);
