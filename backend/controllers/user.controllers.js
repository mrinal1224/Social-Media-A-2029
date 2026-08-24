

import User from "../models/user.model.js"
import bcrypt from 'bcrypt'

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
           const salt =  await  bcrypt.genSalt(10)
           console.log(salt)
        const hashedPassword = await bcrypt.hash(password , salt)


        const newUser = await User.create({ username, name, password:hashedPassword, email })


        res.status(200).json(newUser)












    }
    catch {
        res.status(500).json({ message: "Intenal Server Error" })
    }
}


// $2b$10$jvq5q5okClXf7zkVeiuaXOnHRJ6YNqOUpTr/20Vm7APdLbULOmYzS
"$2b$10$zRf5TaM8B59Vs48D24REGemXND4G6m0aqBMTYGkqAtNwMdewaONI."