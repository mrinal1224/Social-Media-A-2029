// NOTIFICATION STEP 8: PROTECT NOTIFICATION ROUTES WITH THE SAME JWT AUTH MIDDLEWARE

import express from "express";
import isAuthenticated from "../middlewares/authMiddleware.js";
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from "../controllers/notification.controllers.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", isAuthenticated, getNotifications);
notificationRoutes.patch("/read-all", isAuthenticated, markAllNotificationsRead);
notificationRoutes.patch("/:id/read", isAuthenticated, markNotificationRead);

export default notificationRoutes;
