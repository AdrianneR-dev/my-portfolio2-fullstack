export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Duplicate key (e.g. duplicate like, duplicate email) — surface as 409, not 500.
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'Conflict', message: 'This resource already exists.' });
  }

  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: 'ValidationError', message: err.message });
  }

  console.error('[error]', err);

  const isProd = process.env.NODE_ENV === 'production';
  res.status(err?.status || 500).json({
    error: 'ServerError',
    message: isProd ? 'Something went wrong.' : String(err?.message || err),
  });
}
