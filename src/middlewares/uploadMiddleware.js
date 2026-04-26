const fs = require('fs')
const path = require('path')
const multer = require('multer')

const uploadDirectory = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory)
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const baseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    cb(null, `${Date.now()}-${baseName || 'file'}${extension}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.png', '.gif']
  const extension = path.extname(file.originalname).toLowerCase()

  if (!allowed.includes(extension)) {
    return cb(new Error('Only .jpg, .png, and .gif files are allowed'))
  }

  cb(null, true)
}

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
})

module.exports = upload
