const jwt = require('jsonwebtoken')
const { COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided.' })
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(
    token,
    `https://cognito-idp.us-east-1.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
    {
      audience: COGNITO_APP_CLIENT_ID,
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' })
      }

      req.user = decoded
      next()
    },
  )
}

module.exports = authMiddleware
