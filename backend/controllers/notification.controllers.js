// NOTIFICATION STEP 7: RESTORE SAVED NOTIFICATIONS AND MANAGE READ STATE
// Realtime sockets handle live events; these APIs recover persisted events after refresh/offline time.

import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .sort({ createdAt: -1 })
            .populate("sender", "name username profileImage");

        return res.status(200).json({ notifications });
    } catch (error) {
        next(error);
    }
};

export const markNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            { isRead: true },
            { new: true }
        ).populate("sender", "name username profileImage");

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ notification });
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            { isRead: true }
        );

        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        next(error);
    }
};
