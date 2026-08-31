import * as notificationService from "../services/notificationService.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user._id);
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};
