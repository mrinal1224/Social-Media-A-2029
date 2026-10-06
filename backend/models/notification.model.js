import mongoose from "mongoose";

// NOTIFICATION STEP 3: PERSIST NOTIFICATIONS IN MONGODB
//
// Realtime delivery alone is not enough.
// If Rahul is offline when someone likes his post, there is no active socket
// to receive that event. Saving notifications in MongoDB lets Rahul fetch them
// later when he comes back online.
const notificationSchema = new mongoose.Schema(
    {
        // The user who should RECEIVE the notification.
        // Example: Mrinal likes Rahul's post -> recipient = Rahul.
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // The user whose action CREATED the notification.
        // Example: Mrinal likes Rahul's post -> sender = Mrinal.
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // One collection can store different kinds of notifications.
        // We can add more types later without creating separate models.
        type: {
            type: String,
            enum: ["follow", "like", "comment"],
            required: true
        },

        // These references provide context for the notification.
        // They are optional because different notification types need
        // different context. A follow notification, for example, has no post.
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },

        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel"
        },

        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },

        // Used later for the unread notification badge and mark-as-read flow.
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
