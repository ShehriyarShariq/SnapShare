const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const { COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env

const client = jwksClient({
  jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
})

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey
    callback(null, signingKey)
  })
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided.' })
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(
    token,
    getKey,
    { audience: COGNITO_APP_CLIENT_ID },
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
