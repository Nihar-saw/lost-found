import express from "express";
import { aiSearch } from "../controllers/searchController.js";

const router = express.Router();

router.get("/ai", aiSearch);
router.post("/ai", aiSearch);

export default router;
