import express from "express";
import {
  getMyNotifications,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.patch("/:id/read", authMiddleware, markRead);
router.post("/read-all", authMiddleware, markAllRead);

export default router;
