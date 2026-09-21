import Reel from "../models/reel.model.js";
import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";


const uploadReelToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "social-media/reels",
                resource_type: "video",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};


// create post
export const createReel = async (req, res) => {
    try {
        const { caption } = req.body

        if (caption.length > 500) {
            res.status(401).json({ message: 'Caption Cannot be more than 500 characters ' })
        }


        let video;

        if (req.file) {
            const uploadedVideo = await uploadReelToCloudinary(req.file.buffer)
            video = uploadedVideo.secure_url
        }


        const reel = await Reel.create({
            author: req.user._id,
            caption: caption,
            video
        })


        // save the post id for the user 

        await User.findByIdAndUpdate(req.user._id, {
            $push: { reels: reel._id }
        })

        //extarct username , name and profileImage from author


        const populatedReel = await Reel.findById(reel._id).populate('author', 'name username profileImage')

       res.status(201).json({ message: "Reel Created",reel: populatedReel })






    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" , error : error });
    }
}
