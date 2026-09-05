import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { uploadImage } from "./imageService.js";
import { analyzeItem } from "./aiService.js";
import { findMatchesForPost } from "./matchingService.js";

export const createPost = async ({
  userId,
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
  file,
}) => {
  let imageUrl = "";
  let imagePublicId = "";

  if (file) {
    const uploaded = await uploadImage(file.buffer, file.mimetype);
    imageUrl = uploaded.url;
    imagePublicId = uploaded.publicId;
  }

  const aiFeatures = await analyzeItem({
    imageBuffer: file?.buffer,
    mimeType: file?.mimetype,
    description,
  });

  const post = await Post.create({
    userId,
    type,
    title,
    description: description || "",
    content: description || "",
    category: category || aiFeatures.category || "other",
    brand: brand || aiFeatures.brand || "",
    color: color || aiFeatures.color || "",
    location,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    date: date ? new Date(date) : new Date(),
    time: time || "",
    imageUrl,
    imagePublicId,
    aiFeatures,
  });

  const populatedPost = await Post.findById(post._id).populate("userId", "name email");

  const possibleMatches = await findMatchesForPost(post);

  return {
    post: populatedPost,
    possibleMatches,
  };
};

export const getPosts = async ({ type, status, category, search, sort = "newest" }) => {
  const query = {};

  if (type && type !== "all") query.type = type;
  if (status && status !== "all") query.status = status;
  if (category && category !== "all") query.category = category;

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
      { category: searchRegex },
      { brand: searchRegex },
      { color: searchRegex },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };
  if (sort === "likes") sortOption = { likesCount: -1, createdAt: -1 };

  let postsQuery = Post.find(query)
    .populate("userId", "name email")
    .sort(sortOption);

  const posts = await postsQuery.lean();

  // Attach comment counts & possible match indicators
  const postIds = posts.map((p) => p._id);
  const commentsCounts = await Comment.aggregate([
    { $match: { postId: { $in: postIds } } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]);

  const countMap = {};
  commentsCounts.forEach((c) => {
    countMap[c._id.toString()] = c.count;
  });

  return posts.map((p) => ({
    ...p,
    commentsCount: countMap[p._id.toString()] || 0,
    likesCount: p.likes ? p.likes.length : 0,
  }));
};

export const getPostById = async (id) => {
  const post = await Post.findById(id).populate("userId", "name email");
  if (!post) return null;

  const comments = await Comment.find({ postId: id })
    .populate("userId", "name email")
    .sort({ createdAt: 1 });

  const possibleMatches = await findMatchesForPost(post);

  return {
    post,
    comments,
    possibleMatches,
  };
};

export const toggleLikePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const userIdStr = userId.toString();
  const index = post.likes.findIndex((id) => id.toString() === userIdStr);

  if (index > -1) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  return post;
};

export const toggleSavePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const userIdStr = userId.toString();
  const index = post.savedBy.findIndex((id) => id.toString() === userIdStr);

  if (index > -1) {
    post.savedBy.splice(index, 1);
  } else {
    post.savedBy.push(userId);
  }

  await post.save();
  return post;
};

export const resolvePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (post.userId.toString() !== userId.toString()) {
    throw new Error("Only post owner can resolve this post");
  }

  post.status = "resolved";
  await post.save();
  return post;
};

export const getSavedPosts = async (userId) => {
  return Post.find({ savedBy: userId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
};
