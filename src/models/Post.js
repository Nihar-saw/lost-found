import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    location: {
      type: String,
      required: true,
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
    imageUrl: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
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
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Post", postSchema);
