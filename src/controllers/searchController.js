import Item from "../models/Item.js";
import Post from "../models/Post.js";
import { textSimilarity } from "../utils/similarity.js";

export const aiSearch = async (req, res, next) => {
  try {
    const query = req.query.q || req.body.q || "";

    if (!query || !query.trim()) {
      return res.json({
        success: true,
        items: [],
        posts: [],
      });
    }

    const searchRegex = new RegExp(query.split(" ").join("|"), "i");

    const [items, posts] = await Promise.all([
      Item.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { location: searchRegex },
          { category: searchRegex },
          { brand: searchRegex },
          { color: searchRegex },
        ],
      })
        .populate("userId", "name email")
        .lean(),

      Post.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { location: searchRegex },
          { category: searchRegex },
          { brand: searchRegex },
          { color: searchRegex },
        ],
      })
        .populate("userId", "name email")
        .lean(),
    ]);

    const rankItem = (item) => {
      const score = textSimilarity(query, `${item.title} ${item.description} ${item.location} ${item.category || ""} ${item.brand || ""}`);
      return {
        ...item,
        relevanceScore: Math.round(score),
      };
    };

    const rankedItems = items.map(rankItem).sort((a, b) => b.relevanceScore - a.relevanceScore);
    const rankedPosts = posts.map(rankItem).sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      query,
      count: rankedItems.length + rankedPosts.length,
      items: rankedItems,
      posts: rankedPosts,
    });
  } catch (error) {
    next(error);
  }
};
