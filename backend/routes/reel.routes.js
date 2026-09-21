import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js';

import reelUpload from '../middlewares/reelUpload.middleware.js';
import { createReel } from '../controllers/reel.controllers.js';


const reelRoutes = express.Router();

reelRoutes.post('/createReel', isAuthenticated, reelUpload.single('video'), createReel)



export default reelRoutes;