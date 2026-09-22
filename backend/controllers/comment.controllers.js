import Post from "../models/post.model.js";
import User from "../models/user.model.js";


export const createComment = (req , res)=>{
  try {

       const {text} = req.body
    
      const post = Post.findById(req.params.id)

      const userId = req.user._id

      // next Steps

      if(!text){
        res.status(400).json({ message: 'Comment Cannot be Empty ' })
      }


      if(text.length>500){
        res.status(400).json({ message: 'Comment Cannot be more than 500 characters ' })
      }

      // Figure this out 

      




  } catch (error) {
    
  }
}