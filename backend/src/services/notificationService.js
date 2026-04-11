// src/services/notificationService.js
const sequelize = require("../config/db");
const Notification = require("../models/Notification");
const { getSocketId, emitToUser } = require("../sockets/socketManager");

const sendNotification = async (userId, title, message) => {
  const transaction = await sequelize.transaction();
  try {
    const notification = await Notification.create({ userId, title, message }, { transaction });
    console.log("Created notification:", notification.id);

    // Emit to online user if connected
    const socketId = getSocketId(userId);

    console.log("Socket ID for user", userId, "is", socketId);
    if (socketId) {
      emitToUser(userId, "new-notification", {
        id: notification.id,
        title,
        message,
        isRead: notification.isRead
      });
      console.log("🔔 Notification emitted:", notification.id);
    } else {
      console.log(`User ${userId} offline. Saved notification in DB.`);
    }

    await transaction.commit();
    return notification;
  } catch (err) {
    await transaction.rollback();
    console.error("Notification error:", err);
    throw err;
  }
};

// Send all offline notifications when user comes online
const deliverPendingNotifications = async (userId) => {
  const pending = await Notification.findAll({ where: { userId, isRead: false } });
  pending.forEach(note => emitToUser(userId, "new-notification", {
    id: note.id,
    title: note.title,
    message: note.message,
    isRead: note.isRead
  }));
  console.log(`Delivered ${pending.length} pending notifications to user ${userId}`);
};

module.exports = { sendNotification, deliverPendingNotifications };
