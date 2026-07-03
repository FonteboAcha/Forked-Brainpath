export function notFoundHandler(req, res, next) {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
}

export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
}
