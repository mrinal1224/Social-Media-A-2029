import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe
} from "../controllers/user.controllers.js";
import isAuthenticated from "../middlewares/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/logout", isAuthenticated, logoutUser);
userRoutes.get("/me", isAuthenticated, getMe);

export default userRoutes;
