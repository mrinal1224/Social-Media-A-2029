import express from "express";
import isAuthenticated from "../middlewares/authMiddleware.js";
import { getUploadSignature } from "../controllers/upload.controllers.js";

const uploadRoutes = express.Router();

// GET /upload/signature?type=image|video
uploadRoutes.get("/signature", isAuthenticated, getUploadSignature);

export default uploadRoutes;
