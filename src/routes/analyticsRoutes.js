import express from "express";
import { getHeatmap } from "../controllers/analyticsController.js";

const router = express.Router();

// GET /api/analytics/heatmap?range=7d&type=all&category=all
router.get("/heatmap", getHeatmap);

export default router;
