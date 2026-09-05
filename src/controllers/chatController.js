import Conversation from "../models/Conversation.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import { createNotification } from "../services/notificationService.js";

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "_id name email phone role")
      .populate("itemId", "_id title type status imageUrl campusZone location contactPhone contactName")
      .populate("lastSender", "_id name")
      .sort({ lastMessageAt: -1 });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await ChatMessage.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId, itemId, claimId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required",
      });
    }

    if (recipientId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot start a conversation with yourself",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found",
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId], $size: 2 },
      ...(itemId ? { itemId } : {}),
    })
      .populate("participants", "_id name email phone role")
      .populate("itemId", "_id title type status imageUrl campusZone location contactPhone contactName");

    if (!conversation) {
      // Check if there is already any conversation between these two
      conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, recipientId], $size: 2 },
      })
        .populate("participants", "_id name email phone role")
        .populate("itemId", "_id title type status imageUrl campusZone location contactPhone contactName");

      if (conversation && itemId && !conversation.itemId) {
        conversation.itemId = itemId;
        if (claimId) conversation.claimId = claimId;
        await conversation.save();
        conversation = await Conversation.findById(conversation._id)
          .populate("participants", "_id name email phone role")
          .populate("itemId", "_id title type status imageUrl campusZone location contactPhone contactName");
      }
    }

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        itemId: itemId || null,
        claimId: claimId || null,
        lastMessage: "",
        lastMessageAt: new Date(),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "_id name email phone role")
        .populate("itemId", "_id title type status imageUrl campusZone location contactPhone contactName");
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a participant in this conversation.",
      });
    }

    const messages = await ChatMessage.find({ conversationId })
      .populate("sender", "_id name email")
      .sort({ createdAt: 1 });

    // Mark unread messages as read
    await ChatMessage.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text cannot be empty",
      });
    }

    const conversation = await Conversation.findById(conversationId).populate(
      "itemId",
      "title"
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this conversation",
      });
    }

    const message = await ChatMessage.create({
      conversationId,
      sender: senderId,
      text: text.trim(),
      readBy: [senderId],
    });

    conversation.lastMessage = text.trim();
    conversation.lastSender = senderId;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Find other participant to notify
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    if (recipientId) {
      const itemTitle = conversation.itemId?.title
        ? ` (${conversation.itemId.title})`
        : "";
      await createNotification({
        userId: recipientId,
        type: "chat_message",
        title: `💬 New message from ${req.user.name}${itemTitle}`,
        message: text.length > 90 ? text.substring(0, 87) + "..." : text,
        data: {
          conversationId: conversation._id,
          itemId: conversation.itemId?._id,
        },
      });
    }

    const populatedMessage = await ChatMessage.findById(message._id).populate(
      "sender",
      "_id name email"
    );

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    }).select("_id");

    const convIds = conversations.map((c) => c._id);

    const count = await ChatMessage.countDocuments({
      conversationId: { $in: convIds },
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};
