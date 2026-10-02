import { verifyToken } from '../utils/jwt.js';

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success attaches
 * { id, email, role } to req.user. Does not touch the database — the token's
 * signature and expiry are the source of truth for request-time auth, which
 * keeps every protected route fast and stateless.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or malformed Authorization header.' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
  }
}

/** Must run after requireAuth. Rejects any non-admin caller with 403. */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' });
  }
  next();
}
