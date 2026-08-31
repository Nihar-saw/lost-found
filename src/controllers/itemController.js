import Item from "../models/Item.js";
import { uploadImage } from "../services/imageService.js";
import { analyzeItem } from "../services/aiService.js";
import { findMatchesForItem } from "../services/matchingService.js";

export const createItem = async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      category,
      brand,
      color,
      location,
      latitude,
      longitude,
      date,
      time,
    } = req.body;

    if (!type || !title || !description || !location || !date) {
      return res.status(400).json({
        success: false,
        message:
          "Type, title, description, location and date are required",
      });
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await uploadImage(req.file.buffer, req.file.mimetype);

      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const aiFeatures = await analyzeItem({
      imageBuffer: req.file?.buffer,
      mimeType: req.file?.mimetype,
      description,
    });

    const item = await Item.create({
      type,
      title,
      description,
      category: category || aiFeatures.category,
      brand: brand || aiFeatures.brand,
      color: color || aiFeatures.color,
      imageUrl,
      imagePublicId,
      location,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      date,
      time,
      aiFeatures,
      userId: req.user._id,
    });

    const matches = await findMatchesForItem(item._id);

    res.status(201).json({
      success: true,
      message: "Item reported successfully",
      item,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const { type, status } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    const items = await Item.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "userId",
      "name email"
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.status = status;

    await item.save();

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};