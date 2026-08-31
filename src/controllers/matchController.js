import Match from "../models/Match.js";
import { findMatchesForItem, getUserMatches, getMatchById as fetchMatchById } from "../services/matchingService.js";

export const getMyMatches = async (req, res, next) => {
  try {
    const matches = await getUserMatches(req.user._id);
    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

export const getMatchById = async (req, res, next) => {
  try {
    const match = await fetchMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match details not found",
      });
    }

    res.json({
      success: true,
      match,
    });
  } catch (error) {
    next(error);
  }
};

export const getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [
        { lostItemId: req.params.itemId },
        { foundItemId: req.params.itemId },
      ],
    })
      .populate("lostItemId")
      .populate("foundItemId")
      .sort({ finalScore: -1 });

    res.json({
      success: true,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeMatches = async (req, res, next) => {
  try {
    const matches = await findMatchesForItem(req.params.itemId);

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
};