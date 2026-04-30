import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
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

// PUBLIC ROUTES
router.get("/public", getPublicPosts);
router.get("/authors/:id", getAuthorProfile); 
router.get("/:slug", getPostBySlug);

// PROTECTED ROUTES
router.post("/", verifyToken, createPost);
router.get("/", verifyToken, getPosts);
router.put("/:id", verifyToken, updatePost);    
router.delete("/:id", verifyToken, deletePost);

export default router;
