import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { env } from './config/env.mjs';
import { attachUser } from './middlewares/auth.mjs';
import { errorHandler } from './middlewares/error-handler.mjs';
import { accountRouter } from './routes/account.routes.mjs';
import { adminRouter } from './routes/admin.routes.mjs';
import { authRouter } from './routes/auth.routes.mjs';
import { healthRouter } from './routes/health.routes.mjs';
import { storeRouter } from './routes/store.routes.mjs';

function resolveAllowedOrigin(origin) {
  if (!origin) {
    return null;
  }

  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }

  const appBaseUrl = env.APP_BASE_URL;
  return origin === appBaseUrl ? origin : null;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, resolveAllowedOrigin(origin) ?? false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(attachUser);
  app.use(healthRouter);
  app.use(authRouter);
  app.use(storeRouter);
  app.use(accountRouter);
  app.use(adminRouter);
  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
