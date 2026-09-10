import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export const analyzeItem = async ({
  imageBuffer,
  mimeType,
  description,
}) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are an AI assistant for a campus lost-and-found platform.

Analyze the provided item image and user description.

Return ONLY valid JSON in this format:

{
  "category": "",
  "brand": "",
  "color": "",
  "material": "",
  "visualDescription": "",
  "distinctiveFeatures": []
}

User description:
${description || "No description provided"}

Do not invent a brand if it is not visible.
Focus on visually identifiable characteristics.
`;

    const parts = [
      {
        text: prompt,
      },
    ];

    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBuffer.toString("base64"),
        },
      });
    }

    const result = await model.generateContent(parts);

    const response = result.response.text();

    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI analysis error:", error);

    return {
      category: "",
      brand: "",
      color: "",
      material: "",
      visualDescription: description || "",
      distinctiveFeatures: [],
    };
  }
};