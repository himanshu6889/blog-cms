import express from "express";
import {
  createPost,
  getPosts,
  updatePost,  // ✅ added
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", createPost);
router.get("/", getPosts);
router.put("/:id", updatePost);    // ✅ was completely missing
router.delete("/:id", deletePost);

export default router;
