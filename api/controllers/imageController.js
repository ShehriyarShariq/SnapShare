const { S3 } = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const Image = require('../models/Image')
const logger = require('../logger')
const { S3_BUCKET_NAME } = process.env

const s3 = new S3()

exports.uploadImage = async (req, res, next) => {
  const { file } = req
  const { user } = req

  if (!file) {
    return next(new Error('No file uploaded'))
  }

  const key = `images/${user.id}/${uuidv4()}`
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }

  try {
    const { Location } = await s3.upload(params).promise()
    const thumbnailUrl = Location.replace('/images/', '/thumbnails/')
    const image = new Image({
      url: Location,
      thumbnailUrl,
      owner: user._id,
    })

    await image.save()

    res.status(201).json({
      message: 'Image uploaded successfully',
      data: image,
    })
    logger.info(`Image uploaded: ${Location}`)
  } catch (error) {
    logger.error(`Error uploading image: ${error.message}`)
    next(error)
  }
}

exports.getGallery = async (req, res, next) => {
  const { user } = req

  try {
    const images = await Image.find({ owner: user._id })
    res.status(200).json({
      message: 'Images retrieved successfully',
      data: images,
    })
    logger.info(`Images retrieved for user: ${user._id}`)
  } catch (error) {
    logger.error(
      `Error retrieving images for user: ${user._id}, ${error.message}`,
    )
    next(error)
  }
}
