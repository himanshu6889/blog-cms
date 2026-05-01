import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";       // ✅ added
import { verifyCsrfToken } from "../middleware/csrfMiddleware.js"; // ✅ added

const router = express.Router();
const uploadsDir = path.resolve("uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /api/upload — must be logged in and have a valid CSRF token
router.post("/", verifyToken, verifyCsrfToken, upload.single("avatar"), (req, res) => { // ✅ auth + CSRF
  const baseUrl = process.env.PUBLIC_UPLOAD_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;
