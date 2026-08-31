import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
    },
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    finderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationQuestion: {
      type: String,
      default: "",
    },
    claimantAnswer: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "verification", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Claim", claimSchema);