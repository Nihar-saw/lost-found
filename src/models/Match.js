import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    lostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    foundUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    visualScore: {
      type: Number,
      default: 0,
    },
    descriptionScore: {
      type: Number,
      default: 0,
    },
    locationScore: {
      type: Number,
      default: 0,
    },
    timeScore: {
      type: Number,
      default: 0,
    },
    categoryScore: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      default: 0,
    },
    reasons: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["possible", "claimed", "rejected", "resolved"],
      default: "possible",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Match", matchSchema);