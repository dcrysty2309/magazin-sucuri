import { Router } from 'express';

import {
  analytics,
  categories,
  createCustomer,
  createCategory,
  createOrderAdmin,
  createProduct,
  customer,
  customers,
  dashboard,
  dashboardExport,
  dashboardRecentOrders,
  dashboardSales,
  dashboardStats,
  dashboardTopProducts,
  inventory,
  order,
  orders,
  payments,
  product,
  products,
  removeCustomer,
  removeOrder,
  removeProduct,
  settings,
  shipping,
  updateOrder,
  updateCustomer,
  updatePayments,
  updateProduct,
  updateSettings,
  updateShipping,
} from '../controllers/admin.controller.mjs';
import { requireAdmin } from '../middlewares/auth.mjs';
import { asyncHandler } from '../middlewares/error-handler.mjs';

export const adminRouter = Router();

adminRouter.get('/api/admin/dashboard', requireAdmin, asyncHandler(dashboard));
adminRouter.get('/api/admin/stats', requireAdmin, asyncHandler(dashboardStats));
adminRouter.get('/api/dashboard/stats', requireAdmin, asyncHandler(dashboardStats));
adminRouter.get('/api/dashboard/sales', requireAdmin, asyncHandler(dashboardSales));
adminRouter.get('/api/dashboard/recent-orders', requireAdmin, asyncHandler(dashboardRecentOrders));
adminRouter.get('/api/dashboard/top-products', requireAdmin, asyncHandler(dashboardTopProducts));
adminRouter.get('/api/dashboard/export', requireAdmin, asyncHandler(dashboardExport));
adminRouter.get('/api/admin/products', requireAdmin, asyncHandler(products));
adminRouter.post('/api/admin/products', requireAdmin, asyncHandler(createProduct));
adminRouter.get('/api/admin/products/:id', requireAdmin, asyncHandler(product));
adminRouter.patch('/api/admin/products/:id', requireAdmin, asyncHandler(updateProduct));
adminRouter.delete('/api/admin/products/:id', requireAdmin, asyncHandler(removeProduct));
adminRouter.get('/api/admin/categories', requireAdmin, asyncHandler(categories));
adminRouter.post('/api/admin/categories', requireAdmin, asyncHandler(createCategory));
adminRouter.get('/api/admin/orders', requireAdmin, asyncHandler(orders));
adminRouter.post('/api/admin/orders', requireAdmin, asyncHandler(createOrderAdmin));
adminRouter.get('/api/admin/orders/:id', requireAdmin, asyncHandler(order));
adminRouter.patch('/api/admin/orders/:id', requireAdmin, asyncHandler(updateOrder));
adminRouter.delete('/api/admin/orders/:id', requireAdmin, asyncHandler(removeOrder));
adminRouter.get('/api/admin/customers', requireAdmin, asyncHandler(customers));
adminRouter.post('/api/admin/customers', requireAdmin, asyncHandler(createCustomer));
adminRouter.get('/api/admin/customers/:id', requireAdmin, asyncHandler(customer));
adminRouter.patch('/api/admin/customers/:id', requireAdmin, asyncHandler(updateCustomer));
adminRouter.delete('/api/admin/customers/:id', requireAdmin, asyncHandler(removeCustomer));
adminRouter.get('/api/admin/inventory', requireAdmin, asyncHandler(inventory));
adminRouter.get('/api/admin/shipping', requireAdmin, asyncHandler(shipping));
adminRouter.post('/api/admin/shipping', requireAdmin, asyncHandler(updateShipping));
adminRouter.get('/api/admin/payments', requireAdmin, asyncHandler(payments));
adminRouter.post('/api/admin/payments', requireAdmin, asyncHandler(updatePayments));
adminRouter.get('/api/admin/analytics', requireAdmin, asyncHandler(analytics));
adminRouter.get('/api/settings', requireAdmin, asyncHandler(settings));
adminRouter.post('/api/settings', requireAdmin, asyncHandler(updateSettings));
