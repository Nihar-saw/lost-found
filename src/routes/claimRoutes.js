import express from "express";
import {
  createClaim,
  setQuestion,
  submitAnswer,
  approveClaim,
  rejectClaim,
  markReturned,
  getMyClaims,
} from "../controllers/claimController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mine", authMiddleware, getMyClaims);
router.post("/", authMiddleware, createClaim);

router.post("/:id/question", authMiddleware, setQuestion);
router.post("/:id/answer", authMiddleware, submitAnswer);
router.post("/:id/approve", authMiddleware, approveClaim);
router.post("/:id/reject", authMiddleware, rejectClaim);
router.post("/:id/return", authMiddleware, markReturned);

export default router;