import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.model.js";

import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import reelRoutes from "./routes/reel.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import storyRoutes from "./routes/story.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import notificationRoutes from "./routes/notification.routes.js";
import { setIO } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, ".env")
});

const requiredEnvVars = [
    "dbURL",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});
const port = 8084;

// Make this Socket.IO server available to notification helpers/controllers.
setIO(io);

// NOTIFICATION STEP 1: AUTHENTICATE SOCKETS AND PUT EACH USER IN A PRIVATE ROOM
//
// Socket.IO middleware runs before the "connection" event is allowed to fire.
// We reuse the same httpOnly JWT cookie that protects our REST APIs, so the
// client cannot simply claim to be another user by sending a random userId.
io.use(async (socket, next) => {
    try {
        // The browser sends cookies in the initial Socket.IO handshake request.
        // handshake.headers.cookie is the raw Cookie header string.
        const rawCookie = socket.handshake.headers.cookie;

        if (!rawCookie) {
            return next(new Error("Authentication required"));
        }

        // cookie-parser is Express middleware, so it does not automatically run
        // for Socket.IO. We therefore extract the existing "token" cookie here.
        const tokenCookie = rawCookie
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith("token="));

        if (!tokenCookie) {
            return next(new Error("Authentication required"));
        }

        const token = decodeURIComponent(tokenCookie.split("=")[1]);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return next(new Error("User not found"));
        }

        // Attach the authenticated MongoDB user to this socket connection.
        // From this point onward, socket.user is the trusted identity for
        // whoever owns this connection.
        socket.user = user;

        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

mongoose.connect(process.env.dbURL)
    .then(() => {
        console.log("DB Connected");
    })
    .catch((err) => {
        console.log(err);
    });

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/reels", reelRoutes);
app.use("/comments", commentRoutes);
app.use("/stories", storyRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorMiddleware);

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    console.log("Authenticated socket user:", socket.user.username, socket.user._id.toString());

    // Every active connection for this authenticated user joins the same room.
    // This lets one notification reach all of the user's open tabs/devices.
    const userRoom = `user:${socket.user._id.toString()}`;
    socket.join(userRoom);

    console.log(`${socket.user.username} joined room: ${userRoom}`);

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`Server Started at ${port}`);
});
