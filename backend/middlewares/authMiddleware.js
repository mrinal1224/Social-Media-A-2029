import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            res.status(404).json({ message: "No token Found" })
        }

        const decoded = jwt.verify(token, process.env.jwt_secret)
        const user = await User.findById(decoded.userId)

        if (!user) {
            res.status(404).json({ message: "User Not found" })
        }

        req.user = user
        next()
} catch (error) {
        return res.status(500).json({ message: "Server Error" })
    }
}

export default isAuthenticated