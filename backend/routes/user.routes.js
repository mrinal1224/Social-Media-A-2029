import express from 'express'
import {resgiterUser , loginUser} from '../controllers/user.controllers.js'

const userRoutes = express.Router()


// Resgiter User

userRoutes.post('/register' , resgiterUser)
userRoutes.post('/login' ,loginUser )


// Login User


export default userRoutes