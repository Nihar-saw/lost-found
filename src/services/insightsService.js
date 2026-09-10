import { env } from "../config/env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

/**
 * Deterministic rule-based insights from analytics data.
 * Always works — no external API needed.
 */
const deterministicInsights = (data) => {
  const insights = [];

  const { topLocation, topCategory, timeDistribution, weeklyTrend, lostReports, foundReports, totalReports } = data;

  if (topLocation) {
    insights.push({
      icon: "🔥",
      label: "High Activity Zone",
      text: `${topLocation.location} has the highest report activity with ${topLocation.count} report${topLocation.count !== 1 ? "s" : ""}.`,
    });
  }

  if (topCategory) {
    const pct = totalReports > 0 ? Math.round((topCategory.count / totalReports) * 100) : 0;
    insights.push({
      icon: "🎧",
      label: "Most Lost Category",
      text: `${capitalize(topCategory.category)} items account for ${pct}% of all reports.`,
    });
  }

  if (timeDistribution.length > 0) {
    const peak = timeDistribution.reduce((a, b) => (a.count > b.count ? a : b));
    const endHour = (peak.hour + 3) % 24;
    insights.push({
      icon: "⏰",
      label: "Peak Activity Time",
      text: `Most reports occur between ${formatHour(peak.hour)} and ${formatHour(endHour)}.`,
    });
  }

  if (weeklyTrend !== 0) {
    const dir = weeklyTrend > 0 ? "up" : "down";
    const icon = weeklyTrend > 0 ? "📈" : "📉";
    insights.push({
      icon,
      label: "Weekly Trend",
      text: `Reports are ${dir} ${Math.abs(weeklyTrend)}% compared to last week.`,
    });
  }

  if (foundReports > 0 && lostReports > 0) {
    const matchRate = Math.round((foundReports / lostReports) * 100);
    if (matchRate > 60) {
      insights.push({
        icon: "✅",
        label: "Good Recovery Rate",
        text: `${matchRate}% of lost items have found-item reports, indicating a strong recovery network.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      icon: "📍",
      label: "Getting Started",
      text: "No reports found for the selected filters. Try expanding your date range.",
    });
  }

  return insights;
};

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "Unknown";

const formatHour = (h) => {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
};

/**
 * Try to generate richer insights with Gemini, fall back to deterministic.
 */
export const generateInsights = async (data) => {
  // Try Gemini if API key is available
  if (genAI && env.geminiApiKey && env.geminiApiKey !== "your_gemini_api_key") {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
You are an AI analyst for a campus lost-and-found platform.
Based on the following data, generate exactly 4 short, actionable insights.

Data:
- Total reports: ${data.totalReports}
- Lost items: ${data.lostReports}
- Found items: ${data.foundReports}
- Successful recoveries: ${data.successfulMatches}
- Top location: ${data.topLocation?.location || "N/A"} (${data.topLocation?.count || 0} reports)
- Top category: ${data.topCategory?.category || "N/A"} (${data.topCategory?.count || 0} reports)
- Weekly trend: ${data.weeklyTrend > 0 ? "+" : ""}${data.weeklyTrend}%
- Time distribution peak: ${data.timeDistribution.length > 0 ? `hour ${data.timeDistribution.reduce((a, b) => a.count > b.count ? a : b).hour}` : "N/A"}

Return ONLY valid JSON array:
[
  { "icon": "🔥", "label": "High Activity Zone", "text": "..." },
  { "icon": "🎧", "label": "Most Lost Category", "text": "..." },
  { "icon": "⏰", "label": "Peak Activity Time", "text": "..." },
  { "icon": "📈", "label": "Weekly Trend", "text": "..." }
]

Keep each text under 80 characters. Use real numbers from the data.
`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini insights failed, using deterministic:", err.message);
    }
  }

  return deterministicInsights(data);
};
