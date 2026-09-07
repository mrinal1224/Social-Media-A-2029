import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getUserProfile
} from "../controllers/user.controllers.js";
import isAuthenticated from "../middlewares/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/logout", isAuthenticated, logoutUser);
userRoutes.get("/me", isAuthenticated, getMe);


userRoutes.get('/profile/:username' ,isAuthenticated, getUserProfile)

// following and followers

// userRoutes.post('/:id/follow' , isAuthenticated)



export default userRoutes;
