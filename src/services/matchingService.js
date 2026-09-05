import Match from "../models/Match.js";
import Item from "../models/Item.js";
import { calculateFinalScore } from "../utils/calculateScore.js";
import { textSimilarity } from "../utils/similarity.js";
import { calculateLocationScore } from "../utils/locationScore.js";
import { calculateTimeScore } from "../utils/timeScore.js";
import { createNotification } from "./notificationService.js";

const calculateVisualScore = (lost, found) => {
  const lostFeatures = lost.aiFeatures || {};
  const foundFeatures = found.aiFeatures || {};

  let score = 0;
  let comparisons = 0;

  if (lostFeatures.color && foundFeatures.color) {
    comparisons++;
    if (lostFeatures.color.toLowerCase() === foundFeatures.color.toLowerCase()) {
      score += 100;
    } else {
      score += textSimilarity(lostFeatures.color, foundFeatures.color);
    }
  }

  if (lostFeatures.brand && foundFeatures.brand) {
    comparisons++;
    if (lostFeatures.brand.toLowerCase() === foundFeatures.brand.toLowerCase()) {
      score += 100;
    }
  }

  if (lostFeatures.visualDescription && foundFeatures.visualDescription) {
    comparisons++;
    score += textSimilarity(lostFeatures.visualDescription, foundFeatures.visualDescription);
  }

  if (!comparisons) return 0;
  return Math.min(100, score / comparisons);
};

export const calculateMatch = async (lost, found) => {
  const visualScore = calculateVisualScore(lost, found);
  const descriptionScore = textSimilarity(lost.description, found.description);
  const locationScore = calculateLocationScore(lost, found);
  const timeScore = calculateTimeScore(lost, found);

  let categoryScore = 20;
  if (
    lost.category &&
    found.category &&
    lost.category.toLowerCase() === found.category.toLowerCase()
  ) {
    categoryScore = 100;
  }

  const finalScore = calculateFinalScore({
    visualScore,
    descriptionScore,
    locationScore,
    timeScore,
    categoryScore,
  });

  const reasons = [];
  if (categoryScore >= 80) reasons.push("Same category");
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    reasons.push("Same brand");
  }
  if (lost.color && found.color && lost.color.toLowerCase() === found.color.toLowerCase()) {
    reasons.push("Similar color");
  }
  if (locationScore >= 50) reasons.push("Nearby location");
  if (timeScore >= 50) reasons.push("Close time");
  if (visualScore >= 50 && !reasons.includes("Similar color")) reasons.push("Similar visual characteristics");

  if (reasons.length === 0) reasons.push("Matching item details");

  return {
    visualScore: Math.round(visualScore),
    descriptionScore: Math.round(descriptionScore),
    locationScore: Math.round(locationScore),
    timeScore: Math.round(timeScore),
    categoryScore: Math.round(categoryScore),
    finalScore: Math.round(finalScore),
    reasons,
  };
};

export const findMatchesForItem = async (itemId) => {
  const item = await Item.findById(itemId);
  if (!item) {
    throw new Error("Item not found");
  }

  const oppositeType = item.type === "lost" ? "found" : "lost";

  const candidates = await Item.find({
    type: oppositeType,
    status: { $in: ["active", "matched"] },
  });

  const results = [];

  for (const candidate of candidates) {
    const lost = item.type === "lost" ? item : candidate;
    const found = item.type === "found" ? item : candidate;

    const scores = await calculateMatch(lost, found);

    // Only notify and save matches with score >= 60 (Possible / Strong / Very Strong Match)
    if (scores.finalScore >= 60) {
      const match = await Match.findOneAndUpdate(
        {
          lostItemId: lost._id,
          foundItemId: found._id,
        },
        {
          lostItemId: lost._id,
          foundItemId: found._id,
          lostUserId: lost.userId,
          foundUserId: found.userId,
          ...scores,
        },
        {
          upsert: true,
          new: true,
        }
      );

      // Trigger automatic notifications to both Lost User and Finder
      if (lost.userId) {
        await createNotification({
          userId: lost.userId,
          type: "match",
          title: "🔔 FindBack AI Match Alert",
          message: `We may have found your lost item (${lost.title}) with ${scores.finalScore}% confidence!`,
          data: {
            matchId: match._id,
            itemId: found._id,
            matchScore: scores.finalScore,
          },
        });
      }

      if (found.userId && found.userId.toString() !== lost.userId?.toString()) {
        await createNotification({
          userId: found.userId,
          type: "match",
          title: "🔔 Possible Owner Identified",
          message: `Someone reported losing an item matching the one you found (${found.title}) - ${scores.finalScore}% match.`,
          data: {
            matchId: match._id,
            itemId: lost._id,
            matchScore: scores.finalScore,
          },
        });
      }

      results.push(match);
    }
  }

  return results.sort((a, b) => b.finalScore - a.finalScore);
};

export const findMatchesForPost = async (post) => {
  const oppositeType = post.type === "lost" ? "found" : "lost";

  const itemCandidates = await Item.find({
    type: oppositeType,
    status: { $in: ["active", "matched"] },
  }).lean();

  const results = [];

  for (const candidate of itemCandidates) {
    const lost = post.type === "lost" ? post : candidate;
    const found = post.type === "found" ? post : candidate;

    const scores = await calculateMatch(lost, found);

    if (scores.finalScore >= 60) {
      results.push({
        matchedItem: candidate,
        matchScore: scores.finalScore,
        scores,
        reasons: scores.reasons,
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
};

export const getUserMatches = async (userId) => {
  return Match.find({
    $or: [{ lostUserId: userId }, { foundUserId: userId }],
  })
    .populate("lostItemId")
    .populate("foundItemId")
    .populate("lostUserId", "name email phone role")
    .populate("foundUserId", "name email phone role")
    .sort({ createdAt: -1 });
};

export const getMatchById = async (matchId) => {
  return Match.findById(matchId)
    .populate({
      path: "lostItemId",
      populate: { path: "userId", select: "name email phone role" },
    })
    .populate({
      path: "foundItemId",
      populate: { path: "userId", select: "name email phone role" },
    })
    .populate("lostUserId", "name email phone role")
    .populate("foundUserId", "name email phone role");
};