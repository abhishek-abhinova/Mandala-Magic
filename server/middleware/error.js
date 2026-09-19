// Central error handler + 404 handler.
function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  console.error('API error:', err);
  if (res.headersSent) return next(err);
  const status = err.status || (err.code === 'YOYCOL_NOT_CONFIGURED' ? 503 : 500);
  const message = err.code === 'YOYCOL_NOT_CONFIGURED'
    ? 'Yoycol is not configured yet. Use the manual workflow until the account is connected.'
    : 'Something went wrong. Please try again.';
  res.status(status).json({ error: message, code: err.code || 'INTERNAL' });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFound, errorHandler, asyncHandler };