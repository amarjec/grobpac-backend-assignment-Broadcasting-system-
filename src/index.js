require('dotenv').config()

const express = require('express')
const path = require('path')
const multer = require('multer')
const authRoutes = require('./routes/authRoutes')
const contentRoutes = require('./routes/contentRoutes')
const db = require('./models')

const app = express()
const port = Number(process.env.PORT || 3000)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/health', (req, res) => {
  return res.status(200).json({ message: 'Server is running' })
})

app.use('/api/auth', authRoutes)
app.use(contentRoutes)

app.use((req, res) => {
  return res.status(404).json({ message: 'Route not found' })
})

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size must not exceed 10MB' })
    }

    return res.status(400).json({ message: error.message })
  }

  if (error) {
    return res.status(400).json({ message: error.message || 'Request failed' })
  }

  return next()
})

const startServer = async () => {
  try {
    await db.sequelize.authenticate()
    await db.sequelize.sync()

    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Unable to start server', error)
    process.exit(1)
  }
}

startServer()
