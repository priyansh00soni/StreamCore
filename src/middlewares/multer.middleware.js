import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    // replace spaces with underscores
        const sanitized = file.originalname.replace(/\s+/g, '_')
    cb(null, sanitized)
  }
})

export const upload = multer({storage})