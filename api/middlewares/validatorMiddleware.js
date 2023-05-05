const { validationResult } = require('express-validator')

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array(),
    })
  }

  next()
}

module.exports = validatorMiddleware
