import express from "express";
import isAuthenticated from "../middlewares/authMiddleware.js";
import { createComment, getComments } from "../controllers/comment.controllers.js";

const commentRoutes = express.Router();

// type can be either "post" or "reel".
commentRoutes.get("/:type/:id", isAuthenticated, getComments);
commentRoutes.post("/:type/:id", isAuthenticated, createComment);

export default commentRoutes;
