const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
// const dotenv = require('dotenv')

require('dotenv').config()

const { errorHandler } = require('./middlewares/errorHandler')
const userRoutes = require('./routes/userRoutes')
const imageRoutes = require('./routes/imageRoutes')

const app = express()

const MONGODB_URI = process.env.MONGODB_URI

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err)
  })

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/images', imageRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`)
})
