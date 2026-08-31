import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  toggleLike,
  toggleSave,
  resolvePost,
  getSavedPosts,
} from "../controllers/postController.js";
import {
  getComments,
  createComment,
} from "../controllers/commentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/saved/mine", authMiddleware, getSavedPosts);
router.get("/:id", getPostById);

router.post("/", authMiddleware, upload.single("image"), createPost);

router.post("/:id/like", authMiddleware, toggleLike);
router.post("/:id/save", authMiddleware, toggleSave);
router.post("/:id/resolve", authMiddleware, resolvePost);

// Comments routes nested under posts
router.get("/:postId/comments", getComments);
router.post("/:postId/comments", authMiddleware, createComment);

export default router;
