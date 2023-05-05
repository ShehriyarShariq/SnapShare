const User = require('../models/User')
const Image = require('../models/Image')
const { CognitoIdentityServiceProvider } = require('aws-sdk')
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} = require('amazon-cognito-identity-js')
const { AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env
const logger = require('../logger')

const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: AWS_REGION,
})

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_APP_CLIENT_ID,
})

exports.registerUser = async (req, res, next) => {
  const { name, email, password } = req.body

  try {
    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
    ]

    await new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributes, null, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })

    // Save the user in the MongoDB database
    const newUser = new User({
      email,
      name,
    })

    await newUser.save()

    res.status(201).json({ message: 'User registered successfully.' })
    logger.info(`User registered: ${email}`)
  } catch (error) {
    logger.error(`Error registering user: ${email}, ${error.message}`)
    next(error)
  }
}

exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body

  try {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    })

    const authResult = await new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err),
      })
    })

    // Get the user from the database using the email
    const userData = await User.findOne({ email })

    if (!userData) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    // Include the user's _id from the database in the JWT token
    const idToken = authResult.getIdToken().getJwtToken()

    res.status(200).json({
      message: 'User logged in successfully.',
      idToken,
      id: userData._id,
    })
    logger.info(`User logged in: ${email}`)
  } catch (error) {
    logger.error(`Error logging in user: ${email}, ${error.message}`)
    next(error)
  }
}

exports.confirmRegistration = async (req, res, next) => {
  const { email, code } = req.body

  try {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

    await new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })

    res.status(200).json({ message: 'User registration confirmed.' })
    logger.info(`User registration confirmed: ${email}`)
  } catch (error) {
    logger.error(
      `Error confirming user registration: ${email}, ${error.message}`,
    )
    next(error)
  }
}

exports.getUserName = async (req, res, next) => {
  const { userId } = req.params

  console.log(userId)

  try {
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const result = await cognitoIdentityServiceProvider
      .adminGetUser({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: user.email,
      })
      .promise()

    const nameAttribute = result.UserAttributes.find(
      (attr) => attr.Name === 'name',
    )
    const name = nameAttribute ? nameAttribute.Value : ''

    res.status(200).json({
      message: 'User name retrieved successfully.',
      data: { name },
    })
  } catch (error) {
    logger.error(`Error retrieving user name: ${error.message}`)
    next(error)
  }
}

exports.getShareableLink = async (req, res, next) => {
  const { user } = req

  try {
    const userData = await User.findOne({ email: user.email })

    if (!userData) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const shareableLink = `${req.protocol}://${req.get('host')}/gallery/${
      userData._id
    }`
    res.status(200).json({
      message: 'Shareable link generated successfully',
      data: { shareableLink },
    })
    logger.info(`Shareable link generated: ${shareableLink}`)
  } catch (error) {
    logger.error(`Error generating shareable link: ${error.message}`)
    next(error)
  }
}

exports.getGalleryFromShareableLink = async (req, res, next) => {
  const { userId } = req.params

  try {
    const images = await Image.find({
      owner: ObjectId.createFromHexString(userId),
    })

    if (!images) {
      logger.warn(`No images found for user ID: ${userId}`)
      return res.status(404).json({
        message: 'No images found for this user.',
      })
    }

    res.status(200).json({
      message: 'Images retrieved successfully',
      data: images,
    })
    logger.info(`Images retrieved successfully for user ID: ${userId}`)
  } catch (error) {
    logger.error(
      `Error retrieving images for user ID: ${userId}, ${error.message}`,
    )
    next(error)
  }
}
