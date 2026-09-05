import express from "express";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
} from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getConversations);
router.post("/", getOrCreateConversation);
router.get("/unread/count", getUnreadCount);
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);

export default router;
