import multer from 'multer'

const storage = multer.memoryStorage()


// 

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/*')) {
        cb(null, true)
    } else {
        cb(new Error("File is Not an Image"), false)
    }
}

const upload = multer({
     storage,
     fileFilter,
     limits :{
        fileSize : 5*1024*1024
     }
})

export default upload