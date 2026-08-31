import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { env } from "../config/env.js";

export const uploadImage = (buffer, mimeType = "image/jpeg") => {
  return new Promise((resolve) => {
    const isPlaceholderKey =
      !env.cloudinary.apiKey ||
      env.cloudinary.apiKey === "your_cloudinary_api_key" ||
      env.cloudinary.cloudName === "your_cloudinary_cloud_name";

    if (isPlaceholderKey) {
      console.warn("Cloudinary keys not configured in .env. Falling back to base64 Data URL.");
      const base64Data = buffer.toString("base64");
      return resolve({
        url: `data:${mimeType};base64,${base64Data}`,
        publicId: "",
      });
    }

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "findback/items",
        },
        (error, result) => {
          if (error) {
            console.warn("Cloudinary upload error:", error.message, "Falling back to Data URL.");
            const base64Data = buffer.toString("base64");
            resolve({
              url: `data:${mimeType};base64,${base64Data}`,
              publicId: "",
            });
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (err) {
      console.warn("Cloudinary exception:", err.message, "Falling back to Data URL.");
      const base64Data = buffer.toString("base64");
      resolve({
        url: `data:${mimeType};base64,${base64Data}`,
        publicId: "",
      });
    }
  });
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete failed:", err.message);
  }
};