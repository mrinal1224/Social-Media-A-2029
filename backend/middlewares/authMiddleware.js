import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const isAuthenticated = async (req, res) => {
    try {
        const token = req.cookies.token

        if (!token) {
            res.status(404).json({ message: "No token Found" })
        }

        const decoded = jwt.verify(token, process.env.jwt_secret)
       const user =   await User.findById(decoded.userId)


       console.log(user)
        






    } catch (error) {

    }
}

export default isAuthenticated