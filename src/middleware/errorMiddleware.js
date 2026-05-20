function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Endpoint tidak ditemukan: ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) {
  const status = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(status).json({
    success: false,
    message: error.message || 'Terjadi kesalahan server'
  });
}

module.exports = { notFound, errorHandler };
