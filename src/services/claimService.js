import Claim from "../models/Claim.js";
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import { createNotification } from "./notificationService.js";

export const createClaim = async ({ claimantId, matchId, foundItemId }) => {
  let finderId = null;
  let lostItemId = null;

  if (matchId) {
    const match = await Match.findById(matchId);
    if (match) {
      lostItemId = match.lostItemId;
      foundItemId = match.foundItemId;
      finderId = match.foundUserId;
    }
  }

  if (!finderId && foundItemId) {
    const foundItem = await Item.findById(foundItemId);
    if (foundItem) {
      finderId = foundItem.userId;
    }
  }

  const claim = await Claim.create({
    matchId,
    lostItemId,
    foundItemId,
    claimantId,
    finderId,
    status: "pending",
  });

  if (matchId) {
    await Match.findByIdAndUpdate(matchId, { status: "claimed" });
  }

  // Notify finder
  if (finderId) {
    await createNotification({
      userId: finderId,
      type: "claim_requested",
      title: "🔔 Claim Request Received",
      message: "Someone reported losing an item matching yours and requested a claim.",
      data: { claimId: claim._id, itemId: foundItemId },
    });
  }

  return Claim.findById(claim._id)
    .populate("claimantId", "name email")
    .populate("finderId", "name email")
    .populate("foundItemId")
    .populate("lostItemId");
};

export const setVerificationQuestion = async ({ claimId, finderId, question }) => {
  const claim = await Claim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  if (claim.finderId && claim.finderId.toString() !== finderId.toString()) {
    throw new Error("Only the finder can set verification question");
  }

  claim.verificationQuestion = question;
  claim.status = "verification";
  await claim.save();

  // Notify Lost User
  await createNotification({
    userId: claim.claimantId,
    type: "verification_asked",
    title: "🔔 Verification Question Asked",
    message: `The finder asked: "${question}". Please answer to verify ownership.`,
    data: { claimId: claim._id },
  });

  return claim;
};

export const submitClaimantAnswer = async ({ claimId, claimantId, answer }) => {
  const claim = await Claim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  if (claim.claimantId.toString() !== claimantId.toString()) {
    throw new Error("Only claimant can submit answer");
  }

  claim.claimantAnswer = answer;
  await claim.save();

  // Notify Finder
  if (claim.finderId) {
    await createNotification({
      userId: claim.finderId,
      type: "verification_asked",
      title: "🔔 Ownership Answer Submitted",
      message: `Claimant answered: "${answer}". Review and approve/reject.`,
      data: { claimId: claim._id },
    });
  }

  return claim;
};

export const approveClaim = async ({ claimId, finderId }) => {
  const claim = await Claim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  if (claim.finderId && claim.finderId.toString() !== finderId.toString()) {
    throw new Error("Only finder can approve claim");
  }

  claim.status = "approved";
  await claim.save();

  // Notify Lost User
  await createNotification({
    userId: claim.claimantId,
    type: "claim_approved",
    title: "🎉 Ownership Verified!",
    message: "The finder has confirmed your ownership. You can now coordinate return.",
    data: { claimId: claim._id },
  });

  return claim;
};

export const rejectClaim = async ({ claimId, finderId }) => {
  const claim = await Claim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  if (claim.finderId && claim.finderId.toString() !== finderId.toString()) {
    throw new Error("Only finder can reject claim");
  }

  claim.status = "rejected";
  await claim.save();

  // Notify Lost User
  await createNotification({
    userId: claim.claimantId,
    type: "claim_rejected",
    title: "Claim Status Update",
    message: "Your claim request was not approved by the finder.",
    data: { claimId: claim._id },
  });

  return claim;
};

export const markItemReturned = async ({ claimId, userId }) => {
  const claim = await Claim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  claim.status = "completed";
  await claim.save();

  // Mark items as returned/returned
  if (claim.foundItemId) {
    await Item.findByIdAndUpdate(claim.foundItemId, { status: "returned" });
  }
  if (claim.lostItemId) {
    await Item.findByIdAndUpdate(claim.lostItemId, { status: "returned" });
  }
  if (claim.matchId) {
    await Match.findByIdAndUpdate(claim.matchId, { status: "resolved" });
  }

  // Notify both
  await createNotification({
    userId: claim.claimantId,
    type: "item_returned",
    title: "🎉 Item Returned & Case Resolved",
    message: "Thank you for using FindBack AI! Your item has been marked returned.",
    data: { claimId: claim._id },
  });

  if (claim.finderId && claim.finderId.toString() !== claim.claimantId.toString()) {
    await createNotification({
      userId: claim.finderId,
      type: "item_returned",
      title: "🎉 Case Resolved",
      message: "Thank you for helping reunite a lost item with its owner on campus!",
      data: { claimId: claim._id },
    });
  }

  return claim;
};

export const getUserClaims = async (userId) => {
  return Claim.find({
    $or: [{ claimantId: userId }, { finderId: userId }],
  })
    .populate("claimantId", "name email")
    .populate("finderId", "name email")
    .populate("foundItemId")
    .populate("lostItemId")
    .sort({ createdAt: -1 });
};
