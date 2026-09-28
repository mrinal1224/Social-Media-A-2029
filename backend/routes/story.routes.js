import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.middleware.js';
import { createStory } from '../controllers/story.controllers.js';



const storyRoutes = express.Router();


storyRoutes.post('/createStory', isAuthenticated, upload.single('image'), createStory)





export default storyRoutes;