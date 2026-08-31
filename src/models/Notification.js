import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "match",
        "claim_requested",
        "verification_asked",
        "claim_approved",
        "claim_rejected",
        "item_returned",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
      claimId: { type: mongoose.Schema.Types.ObjectId, ref: "Claim" },
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      matchScore: Number,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
