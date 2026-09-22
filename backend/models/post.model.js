import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {

        author:{
            type: mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required: true
        },

        caption : {
            type : String,
            maxlength : 500
        },

        image : {
            type : String
        },

        likes : [
            // userIds
        ]


    },
    { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
