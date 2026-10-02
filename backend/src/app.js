import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

import { generalLimiter } from './middleware/rateLimiters.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/projects.routes.js';
import skillRoutes from './routes/skills.routes.js';
import messageRoutes from './routes/messages.routes.js';

export function createApp() {
  const app = express();

  // Render/most PaaS put the app behind a reverse proxy; trust it so
  // req.ip and the rate limiter see the real client IP, not the proxy's.
  app.set('trust proxy', 1);

  app.use(helmet());

  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow no-origin requests (curl, server-to-server, mobile apps).
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(mongoSanitize()); // strips keys starting with "$" or containing "." from req.body/query/params

  app.use(generalLimiter);

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/skills', skillRoutes);
  app.use('/api/messages', messageRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
