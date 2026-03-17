import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminProduct,
  exportDashboardReport,
  getAdminAnalytics,
  getAdminCustomer,
  getAdminCustomers,
  getAdminDashboard,
  getAdminInventory,
  getAdminOrder,
  getAdminOrders,
  getAdminPaymentsSettings,
  getAdminProduct,
  getAdminProducts,
  getAdminShippingSettings,
  getCategories,
  getDashboardRecentOrders,
  getDashboardSales,
  getDashboardStats,
  getDashboardTopProducts,
  getStoreSettings,
  updateAdminOrder,
  updateAdminPaymentsSettings,
  updateAdminProduct,
  updateAdminShippingSettings,
  updateStoreSettings,
} from '../services/platform.service.mjs';

export async function dashboard(req, res) {
  res.status(200).json(await getAdminDashboard());
}

export async function products(req, res) {
  res.status(200).json({ products: await getAdminProducts() });
}

export async function product(req, res) {
  res.status(200).json({ product: await getAdminProduct(req.params.id) });
}

export async function createProduct(req, res) {
  res.status(201).json({ product: await createAdminProduct(req.body) });
}

export async function updateProduct(req, res) {
  res.status(200).json({ product: await updateAdminProduct(req.params.id, req.body) });
}

export async function removeProduct(req, res) {
  res.status(200).json(await deleteAdminProduct(req.params.id));
}

export async function categories(req, res) {
  res.status(200).json({ categories: await getCategories() });
}

export async function createCategory(req, res) {
  res.status(201).json({ category: await createAdminCategory(req.body) });
}

export async function orders(req, res) {
  res.status(200).json({ orders: await getAdminOrders() });
}

export async function order(req, res) {
  const orderData = await getAdminOrder(req.params.id);
  if (!orderData) {
    return res.status(404).json({ message: 'Comanda nu a fost gasita.' });
  }
  res.status(200).json({ order: orderData });
}

export async function updateOrder(req, res) {
  res.status(200).json({ order: await updateAdminOrder(req.params.id, req.body) });
}

export async function customers(req, res) {
  res.status(200).json({ customers: await getAdminCustomers() });
}

export async function customer(req, res) {
  const customerData = await getAdminCustomer(req.params.id);
  if (!customerData) {
    return res.status(404).json({ message: 'Clientul nu a fost gasit.' });
  }
  res.status(200).json({ customer: customerData });
}

export async function inventory(req, res) {
  res.status(200).json({ items: await getAdminInventory() });
}

export async function shipping(req, res) {
  res.status(200).json(await getAdminShippingSettings());
}

export async function updateShipping(req, res) {
  res.status(200).json(await updateAdminShippingSettings(req.body));
}

export async function payments(req, res) {
  res.status(200).json(await getAdminPaymentsSettings());
}

export async function updatePayments(req, res) {
  res.status(200).json(await updateAdminPaymentsSettings(req.body));
}

export async function analytics(req, res) {
  res.status(200).json(await getAdminAnalytics());
}

export async function settings(req, res) {
  res.status(200).json({ settings: await getStoreSettings() });
}

export async function updateSettings(req, res) {
  res.status(200).json({ settings: await updateStoreSettings(req.body.settings ?? req.body) });
}

export async function dashboardStats(req, res) {
  res.status(200).json(await getDashboardStats());
}

export async function dashboardSales(req, res) {
  res.status(200).json(await getDashboardSales(String(req.query.range || '7')));
}

export async function dashboardRecentOrders(req, res) {
  res.status(200).json(await getDashboardRecentOrders());
}

export async function dashboardTopProducts(req, res) {
  res.status(200).json(await getDashboardTopProducts(String(req.query.range || '30')));
}

export async function dashboardExport(req, res) {
  const type = String(req.query.type || 'csv');
  if (!['csv', 'excel', 'pdf'].includes(type)) {
    return res.status(400).json({ message: 'Tip export invalid.' });
  }

  const report = await exportDashboardReport(type);
  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.status(200).send(report.body);
}
