import rateLimit from 'express-rate-limit';

// Baseline for the whole API.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many requests, please try again later.' },
});

// Tighter limit on auth endpoints to slow down credential stuffing / brute force.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many auth attempts, please try again later.' },
});

// Guestbook + like endpoints are public-write, so they get their own modest cap
// to make spamming expensive without blocking normal visitor use.
export const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many submissions, please slow down.' },
});
