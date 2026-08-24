import express from 'express'
import {resgiterUser} from '../controllers/user.controllers.js'

const userRoutes = express.Router()


// Resgiter User

userRoutes.post('/register' , resgiterUser)


// Login User


export default userRoutes