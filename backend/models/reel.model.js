import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
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

        video : {
            type : String
        },

        likes : [
            // userIds
        ]


    },
    { timestamps: true }
);

const Reel = mongoose.model("Reel",reelSchema);

export default Reel;
