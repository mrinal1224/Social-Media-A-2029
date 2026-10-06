// NOTIFICATION STEP 6: ONE HELPER OWNS SAVE + POPULATE + REALTIME EMIT
// Feature controllers only describe who/what triggered the notification.

import Notification from "../models/notification.model.js";
import { getIO } from "../socket.js";

// One helper owns the complete notification delivery pipeline:
// 1. persist in MongoDB
// 2. populate sender data needed by the UI
// 3. emit to every active socket of the recipient
const createNotification = async ({
    recipient,
    sender,
    type,
    post,
    reel,
    comment
}) => {
    // Users should not receive notifications for actions on their own content.
    if (recipient.toString() === sender.toString()) {
        return null;
    }

    const notification = await Notification.create({
        recipient,
        sender,
        type,
        post,
        reel,
        comment
    });

    const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "name username profileImage");

    getIO()
        .to(`user:${recipient.toString()}`)
        .emit("notification:new", populatedNotification);

    return populatedNotification;
};

export default createNotification;
