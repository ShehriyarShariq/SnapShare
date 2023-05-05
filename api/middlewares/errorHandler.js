const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'An unexpected error occurred'
  const stack = err.stack || undefined

  res.status(statusCode).json({
    status: 'error',
    message,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined,
  })
}

module.exports = { errorHandler }
