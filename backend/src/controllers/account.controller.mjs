import { getAccountAddresses, getAccountOrders, getAccountOverview } from '../services/platform.service.mjs';

export async function overview(req, res) {
  res.status(200).json(await getAccountOverview(req.user));
}

export async function orders(req, res) {
  res.status(200).json({ orders: await getAccountOrders(req.user.id) });
}

export async function addresses(req, res) {
  res.status(200).json({ addresses: await getAccountAddresses(req.user.id) });
}
