

import User from "../models/user.model"

export const resgiterUser = async (req, res) => {
    // 
    const { name, username, email, password } = req.body

    // validations

    try {
        if (!username || !name || !password || !email) {
            return res.status(422).json({ message: 'All fields Required!' })
        }

        // if username exists

        const userNameExists = await User.findOne({ username })

        if (userNameExists) {
            return res.status(400).json({ message: 'username already Exists' })
        }

        const emailExists = await User.findOne({ email })

        if (emailExists) {
            return res.status(400).json({ message: 'username already Exists' })
        }

        if (password.length <= 6) {
            return res.status(400).json({ message: 'Password length should be greater or Equal to 6' })
        }


        const newUser = User.create({ username, name, password, email })


        res.send(newUser)












    }
    catch {

    }
}