const User = require('../models/User')
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} = require('amazon-cognito-identity-js')
const { COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env
const logger = require('../logger')

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_APP_CLIENT_ID,
})

exports.registerUser = async (req, res, next) => {
  const { email, password } = req.body

  try {
    await new Promise((resolve, reject) => {
      userPool.signUp(email, password, [], null, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })

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

    res.status(200).json({
      message: 'User logged in successfully.',
      idToken: authResult.getIdToken().getJwtToken(),
    })
    logger.info(`User logged in: ${email}`)
  } catch (error) {
    logger.error(`Error logging in user: ${email}, ${error.message}`)
    next(error)
  }
}

exports.getShareableLink = async (req, res, next) => {
  const { user } = req

  try {
    const userData = await User.findById(user.sub)

    if (!userData) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const shareableLink = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/gallery/${userData._id}`
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
