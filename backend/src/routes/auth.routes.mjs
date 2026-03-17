import { Router } from 'express';

import {
  adminLogin,
  confirmEmailController,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPasswordController,
} from '../controllers/auth.controller.mjs';
import { asyncHandler } from '../middlewares/error-handler.mjs';

export const authRouter = Router();

authRouter.post('/api/admin/login', asyncHandler(adminLogin));
authRouter.post('/api/auth/register', asyncHandler(register));
authRouter.post('/api/auth/login', asyncHandler(login));
authRouter.post('/api/auth/logout', asyncHandler(logout));
authRouter.get('/api/auth/me', asyncHandler(me));
authRouter.post('/api/auth/forgot-password', asyncHandler(forgotPassword));
authRouter.post('/api/auth/reset-password', asyncHandler(resetPasswordController));
authRouter.get('/api/auth/confirm-email', asyncHandler(confirmEmailController));
