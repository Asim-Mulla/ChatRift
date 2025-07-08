import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  getMessages,
  uploadFile,
  deleteMessage,
} from "../controllers/messageControllers.js";

const messageRoutes = express.Router();

// File upload to cloud setup
import multer from "multer";
import { storage } from "../config/cloud.js";

// Configure multer with file size limits and file type validation
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allAllowedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Documents and files
      "application/pdf",
      "text/plain",
      "text/txt",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip",
      "application/zip-compressed",
      "multipart/x-zip",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/octet-stream",
    ];

    if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`), false);
    }
  },
});

messageRoutes.get("/get-messages/:otherUserId", verifyToken, getMessages);
messageRoutes.post(
  "/upload-file",
  verifyToken,
  (req, res, next) => {
    next();
  },
  upload.single("file"),
  uploadFile
);
messageRoutes.delete("/delete", verifyToken, deleteMessage);

// Error handling middleware for multer
messageRoutes.use((error, req, res, next) => {
  console.error("Route error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 5MB." });
    }
    return res.status(400).json({ error: `Upload error: ${error.message}` });
  }

  return res.status(400).json({ error: error.message || "Upload failed" });
});

export default messageRoutes;
