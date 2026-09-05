import * as postService from "../services/postService.js";

export const createPost = async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      content,
      category,
      brand,
      color,
      location,
      latitude,
      longitude,
      date,
      time,
    } = req.body;

    const postDescription = description || content || "";

    if (!type || !title || !postDescription || !location) {
      return res.status(400).json({
        success: false,
        message: "Type, title, description, and location are required",
      });
    }

    const result = await postService.createPost({
      userId: req.user._id,
      type,
      title,
      description: postDescription,
      content: postDescription,
      category,
      brand,
      color,
      location,
      latitude,
      longitude,
      date: date || new Date(),
      time,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      message: "Community post published successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const { type, status, category, search, sort } = req.query;
    const posts = await postService.getPosts({ type, status, category, search, sort });

    res.json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const data = await postService.getPostById(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const post = await postService.toggleLikePost(req.params.id, req.user._id);
    res.json({
      success: true,
      likes: post.likes,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleSave = async (req, res, next) => {
  try {
    const post = await postService.toggleSavePost(req.params.id, req.user._id);
    res.json({
      success: true,
      savedBy: post.savedBy,
      isSaved: post.savedBy.some((id) => id.toString() === req.user._id.toString()),
    });
  } catch (error) {
    next(error);
  }
};

export const resolvePost = async (req, res, next) => {
  try {
    const post = await postService.resolvePost(req.params.id, req.user._id);
    res.json({
      success: true,
      message: "Post marked as resolved",
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedPosts = async (req, res, next) => {
  try {
    const posts = await postService.getSavedPosts(req.user._id);
    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
};
