import express from "express";
import { signup, login, logout, getMe } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { getCsrfToken, verifyCsrfToken } from "../middleware/csrfMiddleware.js"; // ✅ added verifyCsrfToken

const router = express.Router();

// signup & login stay open — no session/cookie yet so CSRF doesn't apply
router.post("/signup", signup);
router.post("/login",  login);

// logout: user is authenticated, protect it with CSRF
router.post("/logout", verifyCsrfToken, logout); // ✅ CSRF enforced

router.get("/me",          verifyToken, getMe);
router.get("/csrf-token",  getCsrfToken);

export default router;
