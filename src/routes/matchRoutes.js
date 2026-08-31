import express from "express";
import {
  getMatches,
  analyzeMatches,
  getMyMatches,
  getMatchById,
} from "../controllers/matchController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mine", authMiddleware, getMyMatches);
router.get("/detail/:id", authMiddleware, getMatchById);

router.get("/:itemId", getMatches);
router.post("/:itemId/analyze", authMiddleware, analyzeMatches);

export default router;