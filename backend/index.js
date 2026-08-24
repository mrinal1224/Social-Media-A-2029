import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()


const port = 8082

mongoose.connect(process.env.dbURL).then(() => {
    console.log('DB Connected')
}).catch((err) => {
    console.log(err)
})




const app = express()

app.listen(port, () => {
    console.log(`Server Started at ${port}`)
})