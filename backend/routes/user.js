import express from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyCsrfToken } from "../middleware/csrfMiddleware.js"; // ✅ added

const router = express.Router();

router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, verifyCsrfToken, updateProfile); // ✅ CSRF enforced

export default router;
