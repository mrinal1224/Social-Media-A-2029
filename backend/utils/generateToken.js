import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.jwt_secret,
        { expiresIn: "7d" }
    );
};

export default generateToken;
