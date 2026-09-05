import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "other",
    },

    brand: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },

    imagePublicId: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      required: true,
    },

    campusZone: {
      type: String,
      default: "",
    },

    verificationQuestion: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      default: "",
    },

    contactName: {
      type: String,
      default: "",
      trim: true,
    },

    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },

    contactMethod: {
      type: String,
      enum: ["whatsapp", "call", "email", "in-person", ""],
      default: "",
    },

    aiFeatures: {
      category: String,
      brand: String,
      color: String,
      material: String,
      visualDescription: String,
      distinctiveFeatures: [String],
    },

    status: {
      type: String,
      enum: ["active", "matched", "claimed", "returned", "closed"],
      default: "active",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Item", itemSchema);