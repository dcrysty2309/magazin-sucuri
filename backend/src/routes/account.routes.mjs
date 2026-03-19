import { Router } from 'express';

import { addresses, orders, overview } from '../controllers/account.controller.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { asyncHandler } from '../middlewares/error-handler.mjs';

export const accountRouter = Router();

accountRouter.get('/api/account/overview', requireAuth, asyncHandler(overview));
accountRouter.get('/api/account/orders', requireAuth, asyncHandler(orders));
accountRouter.get('/api/account/addresses', requireAuth, asyncHandler(addresses));
