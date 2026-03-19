import { Router } from 'express';

import {
  checkout,
  getHome,
  getStoreCategories,
  getStoreProduct,
  getStoreProducts,
} from '../controllers/store.controller.mjs';
import { requireAuth } from '../middlewares/auth.mjs';
import { asyncHandler } from '../middlewares/error-handler.mjs';

export const storeRouter = Router();

storeRouter.get('/api/store/home', asyncHandler(getHome));
storeRouter.get('/api/store/categories', asyncHandler(getStoreCategories));
storeRouter.get('/api/store/products', asyncHandler(getStoreProducts));
storeRouter.get('/api/store/products/:slug', asyncHandler(getStoreProduct));
storeRouter.post('/api/store/checkout', asyncHandler(checkout));
