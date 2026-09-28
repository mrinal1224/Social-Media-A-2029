// Create a Story

import Story from "../models/Story.model.js"
import uploadToCloudinary from "../utils/uploadToCloudinary.js"



const STORY_LIFETIME = 24 * 60 * 60 * 1000

export const createStory = async (req, res) => {
    try {

        const { caption } = req.body
        let image;


        if (caption.length > 200) {
            res.status(400).json({ message: "Caption should be less than 200 characters" })
        }

        if (!req.file) {
            res.status(404).json({ message: "No Content to Upload" })
        }

       

        if (req.file) {
            let upoloadedImage = await uploadToCloudinary(req.file.buffer)
            image = upoloadedImage.secure_url
            console.log(image)

        }


        const story = await Story.create({
            caption,
            author: req.user._id,
            image,
            expiresAt: new Date(Date.now() + STORY_LIFETIME)
        })



        res.status(201).json({ message: "Story Created", story: story })} 
        
        catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }

}
// Get the Stories



// Delete a Story


