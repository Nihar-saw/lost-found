import express from "express";
import {
  createItem,
  getItems,
  getItemById,
  getMyItems,
  updateItemStatus,
  deleteItem,
} from "../controllers/itemController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getItems);

router.get("/mine", authMiddleware, getMyItems);

router.get("/:id", getItemById);

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  createItem
);

router.patch(
  "/:id/status",
  authMiddleware,
  updateItemStatus
);

router.delete(
  "/:id",
  authMiddleware,
  deleteItem
);

export default router;