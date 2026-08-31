import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user._id,
      text: text.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "name email"
    );

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    next(error);
  }
};
