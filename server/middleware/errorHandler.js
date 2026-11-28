const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (error, req, res, next) => {
  console.error(error);

  // SQLite/D1 unique constraint. Route-level checks handle the common cases with
  // friendlier messages; this is a safe fallback.
  if (error.message && /UNIQUE constraint failed/i.test(error.message)) {
    return res.status(400).json({ message: 'A record with this value already exists' });
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Something went wrong on the server',
  });
};

module.exports = { notFound, errorHandler };
