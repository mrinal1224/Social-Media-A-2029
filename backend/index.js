import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import cors from 'cors'

import userRoutes from "./routes/user.routes.js";

dotenv.config()
const app = express()


const port = 8082


mongoose.connect(process.env.dbURL).then(() => {
    console.log('DB Connected')
}).catch((err) => {
    console.log(err)
})

app.use(cors({
    origin: 'http://localhost:5173', // Must match exact frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(cookieParser())




app.use('/users' , userRoutes)






app.listen(port, () => {
    console.log(`Server Started at ${port}`)
})