import User from "../models/User.js";
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import Claim from "../models/Claim.js";
import { deleteImage } from "../services/imageService.js";

// GET /api/admin/users — list all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    // Attach item count per user
    const userIds = users.map((u) => u._id);
    const itemCounts = await Item.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    itemCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const usersWithStats = users.map((u) => ({
      ...u.toObject(),
      itemCount: countMap[u._id.toString()] || 0,
    }));

    res.json({ success: true, count: users.length, users: usersWithStats });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/items — list all items with owner info
export const getAllItemsAdmin = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    if (type && type !== "all") filter.type = type;
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Item.find(filter)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/items/:id — admin force-delete any item
export const adminDeleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    if (item.imagePublicId) {
      await deleteImage(item.imagePublicId);
    }

    await Match.deleteMany({
      $or: [{ lostItemId: item._id }, { foundItemId: item._id }],
    });

    await Claim.deleteMany({
      $or: [{ lostItemId: item._id }, { foundItemId: item._id }],
    });

    await Item.findByIdAndDelete(item._id);

    res.json({ success: true, message: "Item deleted by admin" });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role — promote/demote user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id — delete a user and all their items
export const adminDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete all their items (and related data)
    const items = await Item.find({ userId: user._id });
    for (const item of items) {
      if (item.imagePublicId) await deleteImage(item.imagePublicId);
      await Match.deleteMany({
        $or: [{ lostItemId: item._id }, { foundItemId: item._id }],
      });
      await Claim.deleteMany({
        $or: [{ lostItemId: item._id }, { foundItemId: item._id }],
      });
    }
    await Item.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: "User and all their data deleted" });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats — dashboard stats
export const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalItems, totalMatches, totalClaims] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Match.countDocuments(),
      Claim.countDocuments(),
    ]);

    const lostItems = await Item.countDocuments({ type: "lost" });
    const foundItems = await Item.countDocuments({ type: "found" });
    const activeItems = await Item.countDocuments({ status: "active" });
    const returnedItems = await Item.countDocuments({ status: "returned" });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalItems,
        lostItems,
        foundItems,
        activeItems,
        returnedItems,
        totalMatches,
        totalClaims,
      },
    });
  } catch (error) {
    next(error);
  }
};
