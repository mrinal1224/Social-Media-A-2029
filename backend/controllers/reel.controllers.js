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


// get all reels
// Fetch the latest reels separately from posts so the feed can evolve each
// content type independently (pagination, recommendations, etc. can be added later).
export const getReels = async (req, res) => {
    try {
        const reels = await Reel.find()
            .populate("author", "name username profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Reels fetched successfully",
            reels
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateLikes = async (req, res) => {
    try {
        // get post id
        const reel = await Reel.findById(req.params.id)

        if (!post) {
            res.status(404).json({ message: 'No Post Found' })
        }
        const userId = req.user._id



        const isAlreadyLiked = reel.likes.some((id) => id.toString() === userId.toString())

        if (isAlreadyLiked) {
            reel.likes.pull(userId)
        } else {
            reel.likes.push(userId)
        }

        await reel.save()

        return res.status(200).json({ message: isAlreadyLiked ? "Post Unliked" : "Post Liked", likes:reel.likes.length })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" , error: error });
    }
}

