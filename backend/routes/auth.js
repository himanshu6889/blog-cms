import express from "express";
import { signup, login, logout, getMe } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { getCsrfToken } from "../middleware/csrfMiddleware.js";

const router = express.Router();

// signup, login, logout — no CSRF needed
// logout doesn't need CSRF: being force-logged-out is harmless, and blocking
// it with a stale/missing token would prevent the cookie from being cleared.
router.post("/signup", signup);
router.post("/login",  login);
router.post("/logout", logout);

router.get("/me",          verifyToken, getMe);
router.get("/csrf-token",  getCsrfToken);

export default router;
