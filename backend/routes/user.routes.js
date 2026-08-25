import express from 'express'
import {resgiterUser , loginUser} from '../controllers/user.controllers.js'
import isAuthenticated from '../middlewares/authMiddleware.js'

const userRoutes = express.Router()


// Resgiter User

userRoutes.post('/register' , resgiterUser)
userRoutes.post('/login' ,loginUser )
userRoutes.get('/me' ,isAuthenticated )


// Login User


export default userRoutes