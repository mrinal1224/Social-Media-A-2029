

import User from "../models/user.model.js"
import bcrypt from 'bcrypt'
import genToken from "../utils/genToken.js"

export const resgiterUser = async (req, res) => {
    // 
    const { name, username, email, password } = req.body

    // validations

    try {
        if (!username || !name || !password || !email) {
            return res.status(422).json({ message: 'All fields Required!' })
        }

        // if username exists

        const user = await User.findOne({ username })

        if (user) {
            return res.status(400).json({ message: 'username already Exists' })
        }

        const emailExists = await User.findOne({ email })


        if (emailExists) {
            return res.status(400).json({ message: 'username already Exists' })
        }

        if (password.length <= 6) {
            return res.status(400).json({ message: 'Password length should be greater or Equal to 6' })
        }
        const salt = await bcrypt.genSalt(10)
        // console.log(salt)
        const hashedPassword = await bcrypt.hash(password, 10)

        // Generate JWT 


        const newUser = await User.create({ username, name, password: hashedPassword, email })

        const token = genToken(newUser._id)

        console.log(token)


        res.status(200).json(newUser)

    }
    catch {
        res.status(500).json({ message: "Intenal Server Error" })
    }
}


export const loginUser = async (req, res) => {
    // login the user

    try {

        const { email, password } = req.body

        if (!email || !password) {
            return res.status(422).json({ message: 'All fields Required!' })
        }


        const userExists = await User.findOne({ email })

        if (!userExists) {
            return res.status(404).json({ message: "User not Found" })
        }

        const correctPassword = bcrypt.compareSync(password, userExists.password)


        if (!correctPassword) {
            return res.status(401).json({ message: "Invalid Password" })
        }

        res.status(200).json({
            message: "Login Successfull",
            user: userExists,
        })

    } catch (error) {
        res.status(500).json({ message: "Intenal Server Error" }, error)
    }
}







