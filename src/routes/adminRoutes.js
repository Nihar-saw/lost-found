import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getAllUsers,
  getAllItemsAdmin,
  adminDeleteItem,
  updateUserRole,
  adminDeleteUser,
  getAdminStats,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", adminDeleteUser);
router.get("/items", getAllItemsAdmin);
router.delete("/items/:id", adminDeleteItem);

export default router;
