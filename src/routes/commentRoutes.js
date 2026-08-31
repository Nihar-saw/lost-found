import express from "express";
import { deleteComment } from "../controllers/commentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.delete("/:id", authMiddleware, deleteComment);

export default router;
