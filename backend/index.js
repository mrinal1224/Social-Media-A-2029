import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import reelRoutes from "./routes/reel.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import storyRoutes from "./routes/story.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8084;

const requiredEnvVars = ["dbURL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

mongoose.connect(process.env.dbURL)
    .then(() => {
        console.log("DB Connected");
    })
    .catch((err) => {
        console.error("DB connection failed:", err.message);
        process.exit(1);
    });

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/post", postRoutes);
app.use("/reel", reelRoutes);
app.use("/comment", commentRoutes);
app.use('/story' , storyRoutes)

app.use(errorMiddleware);

app.listen(port, () => {
    console.log(`Server Started at ${port}`);
});
