import {
  createOrder,
  getCategories,
  getHomePageData,
  getProductBySlug,
  getProducts,
} from '../services/platform.service.mjs';

export async function getHome(req, res) {
  res.status(200).json(await getHomePageData());
}

export async function getStoreCategories(req, res) {
  res.status(200).json({ categories: await getCategories() });
}

export async function getStoreProducts(req, res) {
  const categorySlug = req.query.category || null;
  const featuredOnly = req.query.featured === '1';
  res.status(200).json({ products: await getProducts({ categorySlug, featuredOnly }) });
}

export async function getStoreProduct(req, res) {
  const product = await getProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).json({ message: 'Produsul nu a fost gasit.' });
  }

  res.status(200).json({ product });
}

export async function checkout(req, res) {
  const result = await createOrder(req.body, req.user ?? null);
  res.status(result.status).json(result.body);
}
