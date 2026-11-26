const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (error, req, res, next) => {
  console.error(error);

  // Mongoose rejected a value defined in the schema (enum, min, required...)
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: messages[0], errors: messages });
  }

  // Invalid MongoDB id
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }

  // Duplicate value (for example, the same email twice)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    return res.status(400).json({ message: `${field} is already in use` });
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Something went wrong on the server',
  });
};

module.exports = { notFound, errorHandler };
