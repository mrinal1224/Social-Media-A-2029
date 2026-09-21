import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware';
import upload from '../middlewares/upload.middleware';
import { createPost } from '../controllers/post.controllers';


const postRoutes = express.Router();


// postRoutes.post('/create', isAuthenticated, upload.single('image'), createPost)



export default postRoutes;