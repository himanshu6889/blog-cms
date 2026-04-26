import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createPost,
  getPosts,
  updatePost, 
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", verifyToken, createPost);
router.get("/", verifyToken, getPosts);
router.put("/:id", verifyToken, updatePost);    
router.delete("/:id", verifyToken, deletePost);

export default router;
