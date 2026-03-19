export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.statusCode || error.status || 500;
  res.status(status).json({ message: error.message || 'Internal server error' });
}
