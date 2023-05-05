const express = require('express')
const { uploadImage, getGallery } = require('../controllers/imageController')
const upload = require('../middlewares/multerMiddleware')
const authMiddleware = require('../middlewares/authMiddleware')
const router = express.Router()

router.post('/upload', authMiddleware, upload.single('image'), uploadImage)
router.get('/gallery', authMiddleware, getGallery)

module.exports = router
