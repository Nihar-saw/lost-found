import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FindBack AI API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FindBack AI backend is healthy",
    timestamp: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

app.use(errorMiddleware);

export default app;