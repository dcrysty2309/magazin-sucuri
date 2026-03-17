import { Router } from 'express';

import { getEmailMode } from '../services/platform.service.mjs';

export const healthRouter = Router();

healthRouter.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, emailMode: getEmailMode(), database: 'postgresql' });
});
