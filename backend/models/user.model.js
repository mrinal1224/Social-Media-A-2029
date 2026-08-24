import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
    },

    phone: {
        type: Number
    },

    bio: {
        type: String
    },

    followers: [
        // ids to be stored
    ],

    followings: [
        // ids to be stored
    ],

    posts: [
        // ids to be stored
    ],

    stories: [
        // ids to be stored
    ],

    reels: [
        // ids to be stored
    ],

    profileImage: {
        type: String
    }

})


const User = mongoose.model('User', userSchema)

export default User