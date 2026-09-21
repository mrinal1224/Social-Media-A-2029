import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// create post
export const createPost = async (req, res) => {
    try {
        const { caption } = req.body

        if (caption.length > 500) {
            res.status(401).json({ message: 'Caption Cannot be more than 500 characters ' })
        }


        let image;

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(req.file.buffer)
            image = uploadedImage.secure_url
        }


        const post = await Post.create({
            author: req.user._id,
            caption: caption,
            image
        })


        // save the post id for the user 

        await User.findByIdAndUpdate(req.user._id, {
            $push: { posts: post._id }
        })

        //extarct username , name and profileImage from author


        const populatedPost = await Post.findById(post._id).populate('author', 'name username profileImage')

       res.status(201).json({ message: "Post Created", post: populatedPost })






    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// get post


// delete post