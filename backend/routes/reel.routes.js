import express from 'express'
import isAuthenticated from '../middlewares/authMiddleware.js';

import reelUpload from '../middlewares/reelUpload.middleware.js';
import { createReel, getReels } from '../controllers/reel.controllers.js';


const reelRoutes = express.Router();

reelRoutes.post('/createReel', isAuthenticated, reelUpload.single('video'), createReel)

// GET /reel
// Home page uses this endpoint to load the latest reels.
reelRoutes.get('/', isAuthenticated, getReels)



export default reelRoutes;