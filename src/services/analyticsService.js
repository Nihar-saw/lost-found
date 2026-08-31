import Item from "../models/Item.js";

/**
 * Build a date filter from a range string.
 * @param {string} range - 'today' | '7d' | '30d' | 'all'
 */
const buildDateFilter = (range) => {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { $gte: start };
  }
  if (range === "7d") {
    return { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (range === "30d") {
    return { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }
  return null; // all time
};

/**
 * Parse a time string like "14:30" or "2:30 PM" into an hour integer.
 */
const parseHour = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2})[:h]/);
  if (match) return parseInt(match[1], 10);
  const pmMatch = timeStr.match(/(\d{1,2}).*PM/i);
  if (pmMatch) {
    const h = parseInt(pmMatch[1], 10);
    return h === 12 ? 12 : h + 12;
  }
  const amMatch = timeStr.match(/(\d{1,2}).*AM/i);
  if (amMatch) {
    const h = parseInt(amMatch[1], 10);
    return h === 12 ? 0 : h;
  }
  return null;
};

/**
 * Get aggregated heatmap analytics data from the Item collection.
 */
export const getHeatmapData = async ({ range = "all", type = "all", category = "all" } = {}) => {
  // --- build match stage ---
  const matchStage = {};

  const dateFilter = buildDateFilter(range);
  if (dateFilter) matchStage.date = dateFilter;
  if (type && type !== "all") matchStage.type = type;
  if (category && category !== "all") matchStage.category = category;

  // --- 1. Total counts by type ---
  const totalAgg = await Item.aggregate([
    { $match: matchStage },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  let totalReports = 0;
  let lostReports = 0;
  let foundReports = 0;

  for (const t of totalAgg) {
    totalReports += t.count;
    if (t._id === "lost") lostReports = t.count;
    if (t._id === "found") foundReports = t.count;
  }

  // --- 2. Successful matches (items that have been matched/claimed/returned) ---
  const successfulMatches = await Item.countDocuments({
    ...matchStage,
    status: { $in: ["matched", "claimed", "returned"] },
  });

  // --- 3. Location aggregation ---
  const locationAgg = await Item.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$location",
        latitude: {
          $avg: {
            $cond: [{ $ne: ["$latitude", null] }, "$latitude", "$$REMOVE"],
          },
        },
        longitude: {
          $avg: {
            $cond: [{ $ne: ["$longitude", null] }, "$longitude", "$$REMOVE"],
          },
        },
        count: { $sum: 1 },
        lost: { $sum: { $cond: [{ $eq: ["$type", "lost"] }, 1, 0] } },
        found: { $sum: { $cond: [{ $eq: ["$type", "found"] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  const locations = locationAgg.map((l) => ({
    location: l._id || "Unknown",
    latitude: l.latitude ?? null,
    longitude: l.longitude ?? null,
    count: l.count,
    lost: l.lost,
    found: l.found,
  }));

  // --- 4. Category aggregation ---
  const categoryAgg = await Item.aggregate([
    { $match: matchStage },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const categories = categoryAgg.map((c) => ({
    category: c._id || "other",
    count: c.count,
  }));

  // --- 5. Time distribution ---
  const allItems = await Item.find(matchStage, { time: 1 }).lean();
  const hourMap = {};

  for (const item of allItems) {
    const hour = parseHour(item.time);
    if (hour !== null && hour >= 0 && hour <= 23) {
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    }
  }

  const timeDistribution = Object.entries(hourMap)
    .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
    .sort((a, b) => a.hour - b.hour);

  // --- 6. Weekly trend (last 7 days vs previous 7 days) ---
  const now = new Date();
  const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prev7Start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [last7Count, prev7Count] = await Promise.all([
    Item.countDocuments({ date: { $gte: last7Start } }),
    Item.countDocuments({ date: { $gte: prev7Start, $lt: last7Start } }),
  ]);

  const weeklyTrend =
    prev7Count > 0
      ? Math.round(((last7Count - prev7Count) / prev7Count) * 100)
      : last7Count > 0
      ? 100
      : 0;

  return {
    totalReports,
    lostReports,
    foundReports,
    successfulMatches,
    locations,
    categories,
    timeDistribution,
    weeklyTrend,
    topLocation: locations[0] || null,
    topCategory: categories[0] || null,
  };
};
