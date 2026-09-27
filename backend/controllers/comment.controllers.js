import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import Reel from "../models/reel.model.js";

const getTargetModel = (type) => {
    if (type === "post") return Post;
    if (type === "reel") return Reel;
    return null;
};

export const createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const { type, id } = req.params;

        const cleanedText = text?.trim();

        if (!cleanedText) {
            return res.status(400).json({ message: "Comment Cannot be Empty" });
        }

        if (cleanedText.length > 500) {
            return res.status(400).json({ message: "Comment Cannot be more than 500 characters" });
        }

        const TargetModel = getTargetModel(type);

        if (!TargetModel) {
            return res.status(400).json({ message: "Invalid comment type" });
        }

        const target = await TargetModel.findById(id);

        if (!target) {
            return res.status(404).json({ message: `${type === "post" ? "Post" : "Reel"} Not Found` });
        }

        const comment = await Comment.create({
            text: cleanedText,
            user: req.user._id,
            [type]: id
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate("user", "name username profileImage");

        return res.status(201).json({
            message: "Comment Added",
            comment: populatedComment
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};

export const getComments = async (req, res) => {
    try {
        const { type, id } = req.params;

        if (!getTargetModel(type)) {
            return res.status(400).json({ message: "Invalid comment type" });
        }

        const comments = await Comment.find({ [type]: id })
            .populate("user", "name username profileImage")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Comments fetched successfully",
            comments
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};
