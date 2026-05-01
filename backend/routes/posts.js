import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyCsrfToken } from "../middleware/csrfMiddleware.js"; // ✅ added
import {
  createPost,
  getPosts,
  updatePost, 
  deletePost,
  getPublicPosts,
  getPostBySlug,
  getAuthorProfile, 
} from "../controllers/postController.js";

const router = express.Router();

// PUBLIC ROUTES — no auth needed
router.get("/public", getPublicPosts);
router.get("/authors/:id", getAuthorProfile); 
router.get("/:slug", getPostBySlug);

// PROTECTED ROUTES — require JWT + CSRF token
router.post("/",      verifyToken, verifyCsrfToken, createPost);
router.get("/",       verifyToken, getPosts);
router.put("/:id",    verifyToken, verifyCsrfToken, updatePost);    
router.delete("/:id", verifyToken, verifyCsrfToken, deletePost);

export default router;
