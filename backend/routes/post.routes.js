import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.middleware.js';
import { createPost, getPosts, updateLikes } from '../controllers/post.controllers.js';


const postRoutes = express.Router();


postRoutes.post('/create', isAuthenticated, upload.single('image'), createPost)

// GET /post
// Home page uses this endpoint to load the latest posts.
postRoutes.get('/', isAuthenticated, getPosts)
// postRoutes.post('/likes/:id', isAuthenticated, updateLikes)



export default postRoutes;