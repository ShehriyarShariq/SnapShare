const express = require('express')
const { body } = require('express-validator')
const {
  registerUser,
  loginUser,
  getShareableLink,
} = require('../controllers/userController')
const authMiddleware = require('../middlewares/authMiddleware')
const validatorMiddleware = require('../middlewares/validatorMiddleware')

const router = express.Router()

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .trim(),
]

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password').not().isEmpty().withMessage('Password is required').trim(),
]

router.post('/register', registerValidation, validatorMiddleware, registerUser)
router.post('/login', loginValidation, validatorMiddleware, loginUser)
router.get('/gallery/shareable-link', authMiddleware, getShareableLink)

module.exports = router
