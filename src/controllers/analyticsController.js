import { getHeatmapData } from "../services/analyticsService.js";
import { generateInsights } from "../services/insightsService.js";

/**
 * GET /api/analytics/heatmap
 * Query params: range (today|7d|30d|all), type (lost|found|all), category (string|all)
 */
export const getHeatmap = async (req, res, next) => {
  try {
    const {
      range = "all",
      type = "all",
      category = "all",
    } = req.query;

    const data = await getHeatmapData({ range, type, category });
    const insights = await generateInsights(data);

    return res.json({
      success: true,
      ...data,
      insights,
    });
  } catch (error) {
    next(error);
  }
};
