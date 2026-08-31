import Notification from "../models/Notification.js";

export const createNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

export const getUserNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
};

export const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, read: false }, { read: true });
};
