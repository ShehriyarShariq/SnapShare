const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
})

module.exports = mongoose.model('User', userSchema)
