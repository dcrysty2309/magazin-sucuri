import { createServer } from 'node:http';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const DATA_DIR = join(__dirname, 'data');
const OUTBOX_DIR = join(DATA_DIR, 'outbox');
const PORT = Number(process.env.API_PORT || 4300);
const SESSION_COOKIE = 'livada_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const REMEMBER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;
const ACCOUNT_LOCK_MINUTES = 15;
const MAX_FAILED_LOGINS = 5;
const BCRYPT_ROUNDS = 12;

ensureStorage();
const env = loadEnv();
const pool = createPool();
const rateLimiter = new Map();

await initializeDatabase();

const server = createServer(async (req, res) => {
  const { method = 'GET', url = '/' } = req;
  const requestUrl = new URL(url, `http://${req.headers.host}`);
  const origin = req.headers.origin;
  const ipAddress = getClientIp(req);

  setCorsHeaders(res, origin);

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (requestUrl.pathname === '/api/store/home' && method === 'GET') {
      const payload = await getHomePageData();
      return sendJson(res, 200, payload);
    }

    if (requestUrl.pathname === '/api/store/categories' && method === 'GET') {
      const categories = await getCategories();
      return sendJson(res, 200, { categories });
    }

    if (requestUrl.pathname === '/api/store/products' && method === 'GET') {
      const categorySlug = requestUrl.searchParams.get('category') || null;
      const featuredOnly = requestUrl.searchParams.get('featured') === '1';
      const products = await getProducts({ categorySlug, featuredOnly });
      return sendJson(res, 200, { products });
    }

    if (requestUrl.pathname.startsWith('/api/store/products/') && method === 'GET') {
      const slug = requestUrl.pathname.replace('/api/store/products/', '').trim();
      const product = await getProductBySlug(slug);

      if (!product) {
        return sendJson(res, 404, { message: 'Produsul nu a fost gasit.' });
      }

      return sendJson(res, 200, { product });
    }

    if (requestUrl.pathname === '/api/store/checkout' && method === 'POST') {
      const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const user = await getUserFromSession(sessionId);
      const body = await readJson(req);
      const result = await createOrder(body, user ?? null);
      return sendJson(res, result.status, result.body);
    }

    if (requestUrl.pathname === '/api/account/overview' && method === 'GET') {
      const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const user = await getUserFromSession(sessionId);

      if (!user) {
        clearSessionCookie(res);
        return sendJson(res, 401, { message: 'Sesiunea nu este activa.' });
      }

      const overview = await getAccountOverview(user);
      return sendJson(res, 200, overview);
    }

    if (requestUrl.pathname === '/api/account/orders' && method === 'GET') {
      const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const user = await getUserFromSession(sessionId);

      if (!user) {
        clearSessionCookie(res);
        return sendJson(res, 401, { message: 'Sesiunea nu este activa.' });
      }

      const orders = await getAccountOrders(user.id);
      return sendJson(res, 200, { orders });
    }

    if (requestUrl.pathname === '/api/account/addresses' && method === 'GET') {
      const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const user = await getUserFromSession(sessionId);

      if (!user) {
        clearSessionCookie(res);
        return sendJson(res, 401, { message: 'Sesiunea nu este activa.' });
      }

      const addresses = await getAccountAddresses(user.id);
      return sendJson(res, 200, { addresses });
    }

    if (requestUrl.pathname === '/api/admin/login' && method === 'POST') {
      if (isRateLimited(`admin-login:${ipAddress}`, 8, 15 * 60 * 1000)) {
        return sendJson(res, 429, { message: 'Prea multe incercari de autentificare admin. Incearca din nou mai tarziu.' });
      }

      const body = await readJson(req);
      const result = await loginUser(body, ipAddress, req.headers['user-agent'], { requiredRole: 'admin' });

      if (result.sessionId) {
        setSessionCookie(res, result.sessionId, result.remember);
      }

      return sendJson(res, result.status, result.body);
    }

    if (requestUrl.pathname === '/api/admin/dashboard' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      return sendJson(res, 200, await getAdminDashboard());
    }

    if (requestUrl.pathname === '/api/admin/products' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      return sendJson(res, 200, { products: await getAdminProducts() });
    }

    if (requestUrl.pathname === '/api/admin/products' && method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const body = await readJson(req);
      return sendJson(res, 201, { product: await createAdminProduct(body) });
    }

    if (requestUrl.pathname.startsWith('/api/admin/products/') && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const productId = requestUrl.pathname.replace('/api/admin/products/', '').trim();
      return sendJson(res, 200, { product: await getAdminProduct(productId) });
    }

    if (requestUrl.pathname.startsWith('/api/admin/products/') && method === 'PATCH') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const productId = requestUrl.pathname.replace('/api/admin/products/', '').trim();
      const body = await readJson(req);
      return sendJson(res, 200, { product: await updateAdminProduct(productId, body) });
    }

    if (requestUrl.pathname === '/api/admin/categories' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      return sendJson(res, 200, { categories: await getCategories() });
    }

    if (requestUrl.pathname === '/api/admin/categories' && method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const body = await readJson(req);
      return sendJson(res, 201, { category: await createAdminCategory(body) });
    }

    if (requestUrl.pathname === '/api/admin/orders' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      return sendJson(res, 200, { orders: await getAdminOrders() });
    }

    if (requestUrl.pathname.startsWith('/api/admin/orders/') && method === 'PATCH') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const orderId = requestUrl.pathname.replace('/api/admin/orders/', '').trim();
      const body = await readJson(req);
      return sendJson(res, 200, { order: await updateAdminOrder(orderId, body) });
    }

    if (requestUrl.pathname === '/api/admin/customers' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      return sendJson(res, 200, { customers: await getAdminCustomers() });
    }

    if (requestUrl.pathname === '/api/admin/inventory' && method === 'GET') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      return sendJson(res, 200, { items: await getAdminInventory() });
    }

    if (requestUrl.pathname === '/api/auth/register' && method === 'POST') {
      if (isRateLimited(`register:${ipAddress}`, 8, 10 * 60 * 1000)) {
        return sendJson(res, 429, { message: 'Prea multe incercari. Incearca din nou in cateva minute.' });
      }

      const body = await readJson(req);
      const result = await registerUser(body);
      return sendJson(res, result.status, result.body);
    }

    if (requestUrl.pathname === '/api/auth/login' && method === 'POST') {
      if (isRateLimited(`login:${ipAddress}`, 10, 15 * 60 * 1000)) {
        return sendJson(res, 429, { message: 'Prea multe incercari de autentificare. Incearca din nou mai tarziu.' });
      }

      const body = await readJson(req);
      const result = await loginUser(body, ipAddress, req.headers['user-agent']);

      if (result.sessionId) {
        setSessionCookie(res, result.sessionId, result.remember);
      }

      return sendJson(res, result.status, result.body);
    }

    if (requestUrl.pathname === '/api/auth/logout' && method === 'POST') {
      const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      await logoutSession(sessionId);
      clearSessionCookie(res);
      return sendJson(res, 200, { message: 'Te-ai deconectat cu succes.' });
    }

    if (requestUrl.pathname === '/api/auth/me' && method === 'GET') {
      const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const user = await getUserFromSession(sessionId);

      if (!user) {
        clearSessionCookie(res);
        return sendJson(res, 401, { message: 'Sesiunea nu este activa.' });
      }

      return sendJson(res, 200, {
        user: buildSafeUser(user),
      });
    }

    if (requestUrl.pathname === '/api/auth/forgot-password' && method === 'POST') {
      if (isRateLimited(`forgot:${ipAddress}`, 5, 10 * 60 * 1000)) {
        return sendJson(res, 429, { message: 'Prea multe cereri. Incearca din nou mai tarziu.' });
      }

      const body = await readJson(req);
      const result = await requestPasswordReset(body);
      return sendJson(res, result.status, result.body);
    }

    if (requestUrl.pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await readJson(req);
      const result = await resetPassword(body);
      return sendJson(res, result.status, result.body);
    }

    if (requestUrl.pathname === '/api/auth/confirm-email' && method === 'GET') {
      const token = requestUrl.searchParams.get('token') || '';
      const html = await confirmEmail(token);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (requestUrl.pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, { ok: true, emailMode: getEmailMode(), database: 'postgresql' });
    }

    sendJson(res, 404, { message: 'Not found' });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { message: 'Internal server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth API listening on http://0.0.0.0:${PORT}`);
  console.log(`Email mode: ${getEmailMode()}`);
  console.log('Database mode: PostgreSQL');
});

function ensureStorage() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(OUTBOX_DIR)) {
    mkdirSync(OUTBOX_DIR, { recursive: true });
  }
}

function loadEnv() {
  const envPath = join(ROOT_DIR, '.env');
  const values = {};

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      values[key] = rest.join('=').trim();
    }
  }

  return { ...values, ...process.env };
}

function createPool() {
  const connectionString = env.DATABASE_URL || 'postgresql://magazin:magazin_dev@127.0.0.1:55432/magazin_sucuri';
  return new Pool({ connectionString });
}

async function initializeDatabase() {
  const schemaSql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
  await pool.query(schemaSql);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'`);
  await pool.query(`DELETE FROM sessions WHERE expires_at < NOW();`);
  await seedStoreCatalog();
  await seedAdminUser();
}

async function seedStoreCatalog() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM categories');
  if (rows[0]?.count > 0) {
    return;
  }

  const now = new Date();
  const categories = [
    {
      id: 'cat-mere',
      slug: 'suc-de-mere',
      name: 'Suc de mere',
      description: 'Gama noastra clasica de sucuri naturale din mere romanesti, presate la rece.',
      imageUrl: '/images/homepage-hero.png',
      sortOrder: 1,
    },
    {
      id: 'cat-mixuri',
      slug: 'mixuri-naturale',
      name: 'Mixuri naturale',
      description: 'Combinatii curate cu morcov si sfecla, pentru gust si varietate.',
      imageUrl: '/images/product-4.png',
      sortOrder: 2,
    },
  ];

  for (const category of categories) {
    await pool.query(
      `
        INSERT INTO categories (id, slug, name, description, image_url, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [category.id, category.slug, category.name, category.description, category.imageUrl, category.sortOrder, now],
    );
  }

  const products = [
    {
      id: 'prod-mere-3l',
      categoryId: 'cat-mere',
      slug: 'suc-de-mere-3l',
      sku: 'LN-MER-3L',
      name: 'Suc de Mere 3L',
      subtitle: 'Bag-in-Box 3L',
      shortDescription: 'Bag-in-box de 3L, ideal pentru consum zilnic in familie.',
      description: 'Suc natural obtinut din mere romanesti, presat la rece si ambalat bag-in-box pentru pastrarea gustului curat.',
      volumeLabel: '3L',
      basePrice: 25,
      compareAtPrice: null,
      badge: 'Clasic',
      accent: 'gold',
      isFeatured: true,
      stockQuantity: 120,
      images: [
        { id: 'img-mere-3l-1', imageUrl: '/images/product-1.png', altText: 'Suc de Mere 3L', isPrimary: true, sortOrder: 1 },
        { id: 'img-mere-3l-2', imageUrl: '/images/homepage-hero.png', altText: 'Suc de Mere 3L - servire', isPrimary: false, sortOrder: 2 },
      ],
    },
    {
      id: 'prod-mere-5l',
      categoryId: 'cat-mere',
      slug: 'suc-de-mere-5l',
      sku: 'LN-MER-5L',
      name: 'Suc de Mere 5L',
      subtitle: 'Bag-in-Box 5L',
      shortDescription: 'Format generos, potrivit pentru familie sau consum constant.',
      description: 'Varianta noastra premium de 5L, cu mere romanesti selectionate si gust natural, fara zahar adaugat.',
      volumeLabel: '5L',
      basePrice: 36,
      compareAtPrice: 40,
      badge: 'Familie',
      accent: 'green',
      isFeatured: true,
      stockQuantity: 80,
      images: [
        { id: 'img-mere-5l-1', imageUrl: '/images/product-2.png', altText: 'Suc de Mere 5L', isPrimary: true, sortOrder: 1 },
        { id: 'img-mere-5l-2', imageUrl: '/images/homepage-hero.png', altText: 'Suc de Mere 5L - detaliu', isPrimary: false, sortOrder: 2 },
      ],
    },
    {
      id: 'prod-degustare',
      categoryId: 'cat-mere',
      slug: 'pachet-degustare',
      sku: 'LN-DEG-3X',
      name: 'Pachet Degustare',
      subtitle: '3 sticle artizanale',
      shortDescription: 'Selectie de sticle pentru degustare sau cadou.',
      description: 'Un pachet elegant pentru cei care vor sa descopere gustul natural al sucurilor noastre.',
      volumeLabel: '3 x 330ml',
      basePrice: 42,
      compareAtPrice: null,
      badge: 'Cadou',
      accent: 'red',
      isFeatured: false,
      stockQuantity: 35,
      images: [
        { id: 'img-degustare-1', imageUrl: '/images/product-3.png', altText: 'Pachet degustare', isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      id: 'prod-morcov',
      categoryId: 'cat-mixuri',
      slug: 'mere-si-morcov',
      sku: 'LN-MIX-MORCOV',
      name: 'Suc de Mere & Morcov',
      subtitle: 'Sticla 750ml',
      shortDescription: 'Mix bland, luminos, potrivit pentru toata familia.',
      description: 'Combinatie delicata de mere si morcov, cu gust curat si textura echilibrata.',
      volumeLabel: '750ml',
      basePrice: 14,
      compareAtPrice: null,
      badge: 'Mix bland',
      accent: 'gold',
      isFeatured: true,
      stockQuantity: 60,
      images: [
        { id: 'img-morcov-1', imageUrl: '/images/product-4.png', altText: 'Suc de Mere si Morcov', isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      id: 'prod-sfecla',
      categoryId: 'cat-mixuri',
      slug: 'mere-si-sfecla',
      sku: 'LN-MIX-SFECLA',
      name: 'Suc de Mere & Sfecla',
      subtitle: 'Sticla 750ml',
      shortDescription: 'Aroma intensa si culoare profunda, pentru gusturi mai ferme.',
      description: 'Suc natural din mere si sfecla, cu profil bogat si prezentare artizanala.',
      volumeLabel: '750ml',
      basePrice: 15,
      compareAtPrice: null,
      badge: 'Aroma intensa',
      accent: 'red',
      isFeatured: true,
      stockQuantity: 55,
      images: [
        { id: 'img-sfecla-1', imageUrl: '/images/product-5.png', altText: 'Suc de Mere si Sfecla', isPrimary: true, sortOrder: 1 },
      ],
    },
    {
      id: 'prod-limpede',
      categoryId: 'cat-mere',
      slug: 'suc-limpede-de-mere',
      sku: 'LN-MER-330',
      name: 'Suc limpede de mere',
      subtitle: 'Sticla 330ml',
      shortDescription: 'Format rapid pentru servire individuala.',
      description: 'Sticla de 330ml pentru consum rapid, cu gust limpede si proaspat.',
      volumeLabel: '330ml',
      basePrice: 8,
      compareAtPrice: null,
      badge: 'Servire rapida',
      accent: 'green',
      isFeatured: false,
      stockQuantity: 150,
      images: [
        { id: 'img-limpede-1', imageUrl: '/images/product-6.png', altText: 'Suc limpede de mere', isPrimary: true, sortOrder: 1 },
      ],
    },
  ];

  for (const product of products) {
    await pool.query(
      `
        INSERT INTO products (
          id, category_id, slug, sku, name, subtitle, short_description, description,
          volume_label, base_price, compare_at_price, badge, accent, is_featured, is_active, stock_quantity, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE, $15, $16)
      `,
      [
        product.id,
        product.categoryId,
        product.slug,
        product.sku,
        product.name,
        product.subtitle,
        product.shortDescription,
        product.description,
        product.volumeLabel,
        product.basePrice,
        product.compareAtPrice,
        product.badge,
        product.accent,
        product.isFeatured,
        product.stockQuantity,
        now,
      ],
    );

    for (const image of product.images) {
      await pool.query(
        `
          INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [image.id, product.id, image.imageUrl, image.altText, image.sortOrder, image.isPrimary],
      );
    }
  }
}

async function seedAdminUser() {
  const email = normalizeEmail(env.ADMIN_EMAIL || 'admin');
  const firstName = env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = env.ADMIN_LAST_NAME || 'Livada';
  const phone = env.ADMIN_PHONE || '0700000000';
  const password = env.ADMIN_PASSWORD || 'admin';
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
  if (existing.rowCount) {
    await pool.query(
      'UPDATE users SET role = $2, password_hash = $3, email_verified = TRUE WHERE email = $1',
      [email, 'admin', passwordHash],
    );
    return;
  }

  await pool.query(
    `
      INSERT INTO users (
        id, role, first_name, last_name, email, phone, password_hash,
        email_verified, email_verification_token, email_verification_expires_at,
        password_reset_token, password_reset_expires_at, failed_login_attempts,
        locked_until, gdpr_consent_at, created_at
      )
      VALUES ($1, 'admin', $2, $3, $4, $5, $6, TRUE, NULL, NULL, NULL, NULL, 0, NULL, $7, $8)
    `,
    [randomUUID(), firstName, lastName, email, phone, passwordHash, new Date(), new Date()],
  );
}

function setCorsHeaders(res, origin) {
  const allowedOrigin = resolveAllowedOrigin(origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function resolveAllowedOrigin(origin) {
  const defaultOrigin = env.APP_BASE_URL || 'http://localhost:4200';
  if (!origin) {
    return defaultOrigin;
  }

  if (/^https?:\/\/[^/]+:4200$/.test(origin)) {
    return origin;
  }

  const allowedOrigins = new Set([defaultOrigin, 'http://localhost:4200', 'http://127.0.0.1:4200']);
  return allowedOrigins.has(origin) ? origin : defaultOrigin;
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function validatePassword(password) {
  return password.length >= 8;
}

function buildSafeUser(user) {
  return {
    id: user.id,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    emailVerified: user.email_verified,
  };
}

async function registerUser(body) {
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const email = normalizeEmail(body.email);
  const phone = String(body.phone || '').trim();
  const password = String(body.password || '');
  const terms = Boolean(body.terms);

  if (!firstName || !lastName || !email || !phone || !validatePassword(password) || !terms) {
    return { status: 400, body: { message: 'Datele formularului sunt invalide.' } };
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
  if (existing.rowCount) {
    return { status: 409, body: { message: 'Exista deja un cont cu acest email.' } };
  }

  const confirmationToken = createToken();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await pool.query(
    `
      INSERT INTO users (
        id, first_name, last_name, email, phone, password_hash, email_verified,
        email_verification_token, email_verification_expires_at,
        password_reset_token, password_reset_expires_at,
        failed_login_attempts, locked_until, gdpr_consent_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8, NULL, NULL, 0, NULL, $9, $10)
    `,
    [
      randomUUID(),
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      confirmationToken,
      new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
      new Date(),
      new Date(),
    ],
  );

  const confirmationUrl = `${apiBaseUrl()}/api/auth/confirm-email?token=${confirmationToken}`;
  const emailResult = await sendEmail({
    to: email,
    subject: 'Confirma contul Livada Noastra',
    html: buildConfirmationEmail({ firstName, confirmationUrl }),
  });

  return {
    status: 201,
    body: {
      message: emailResult.mode === 'resend'
        ? 'Contul a fost creat. Verifica emailul pentru confirmare.'
        : 'Contul a fost creat. Emailul a fost salvat local in outbox pentru test.',
      emailMode: emailResult.mode,
      previewFile: emailResult.previewFile || null,
    },
  };
}

async function loginUser(body, ipAddress, userAgent, options = {}) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const remember = Boolean(body.remember);
  const requiredRole = options.requiredRole || null;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  const user = rows[0];

  if (!user) {
    return { status: 401, body: { message: 'Email sau parola incorecte.' } };
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return {
      status: 423,
      body: { message: `Contul este blocat temporar. Incearca din nou peste ${ACCOUNT_LOCK_MINUTES} minute.` },
    };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    const failedAttempts = Number(user.failed_login_attempts || 0) + 1;
    const shouldLock = failedAttempts >= MAX_FAILED_LOGINS;

    await pool.query(
      `
        UPDATE users
        SET failed_login_attempts = $2,
            locked_until = $3
        WHERE id = $1
      `,
      [
        user.id,
        failedAttempts,
        shouldLock ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000) : null,
      ],
    );

    return { status: 401, body: { message: 'Email sau parola incorecte.' } };
  }

  if (!user.email_verified) {
    return { status: 403, body: { message: 'Confirma emailul inainte de autentificare.' } };
  }

  if (requiredRole && user.role !== requiredRole) {
    return { status: 403, body: { message: 'Nu ai acces in aceasta zona.' } };
  }

  await pool.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);

  const sessionId = createToken();
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_SESSION_TTL_MS : SESSION_TTL_MS));
  await pool.query(
    `
      INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [sessionId, user.id, new Date(), expiresAt, userAgent || null, ipAddress || null],
  );

  return {
    status: 200,
    body: {
      message: 'Autentificare reusita.',
      user: buildSafeUser(user),
    },
    sessionId,
    remember,
  };
}

async function logoutSession(sessionId) {
  if (!sessionId) {
    return;
  }
  await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

async function getUserFromSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const { rows } = await pool.query(
    `
      SELECT u.*
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > NOW()
      LIMIT 1
    `,
    [sessionId],
  );

  return rows[0] || null;
}

async function requireAdmin(req, res) {
  const sessionId = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const user = await getUserFromSession(sessionId);

  if (!user) {
    clearSessionCookie(res);
    sendJson(res, 401, { message: 'Sesiunea nu este activa.' });
    return null;
  }

  if (user.role !== 'admin') {
    sendJson(res, 403, { message: 'Nu ai acces in aceasta zona.' });
    return null;
  }

  return user;
}

async function requestPasswordReset(body) {
  const email = normalizeEmail(body.email);
  if (!email) {
    return { status: 400, body: { message: 'Emailul este obligatoriu.' } };
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  const user = rows[0];

  if (!user) {
    return {
      status: 200,
      body: { message: 'Daca exista un cont cu acest email, vei primi instructiuni de resetare.' },
    };
  }

  const resetToken = createToken();
  await pool.query(
    `
      UPDATE users
      SET password_reset_token = $2,
          password_reset_expires_at = $3
      WHERE id = $1
    `,
    [user.id, resetToken, new Date(Date.now() + RESET_TOKEN_TTL_MS)],
  );

  const resetUrl = `${apiBaseUrl()}/auth/reset-password?token=${resetToken}`;
  const emailResult = await sendEmail({
    to: email,
    subject: 'Resetare parola Livada Noastra',
    html: buildResetEmail({ firstName: user.first_name, resetUrl }),
  });

  return {
    status: 200,
    body: {
      message: emailResult.mode === 'resend'
        ? 'Emailul de resetare a fost trimis.'
        : 'Cererea a fost pregatita. Emailul a fost salvat local in outbox.',
      emailMode: emailResult.mode,
      previewFile: emailResult.previewFile || null,
    },
  };
}

async function resetPassword(body) {
  const token = String(body.token || '').trim();
  const password = String(body.password || '');

  if (!token || !validatePassword(password)) {
    return { status: 400, body: { message: 'Datele de resetare sunt invalide.' } };
  }

  const { rows } = await pool.query(
    `
      SELECT *
      FROM users
      WHERE password_reset_token = $1
        AND password_reset_expires_at > NOW()
      LIMIT 1
    `,
    [token],
  );
  const user = rows[0];

  if (!user) {
    return { status: 400, body: { message: 'Linkul de resetare nu mai este valid.' } };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await pool.query(
    `
      UPDATE users
      SET password_hash = $2,
          password_reset_token = NULL,
          password_reset_expires_at = NULL,
          failed_login_attempts = 0,
          locked_until = NULL
      WHERE id = $1
    `,
    [user.id, passwordHash],
  );

  await pool.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

  return { status: 200, body: { message: 'Parola a fost actualizata. Te poti autentifica acum.' } };
}

async function confirmEmail(token) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email_verification_token = $1
        AND email_verification_expires_at > NOW()
      LIMIT 1
    `,
    [token],
  );
  const user = rows[0];

  if (!user) {
    return renderEmailPage('Link invalid', 'Linkul de confirmare nu mai este valid sau a expirat.');
  }

  await pool.query(
    `
      UPDATE users
      SET email_verified = TRUE,
          email_verification_token = NULL,
          email_verification_expires_at = NULL
      WHERE id = $1
    `,
    [user.id],
  );

  return renderEmailPage(
    'Cont confirmat',
    `Emailul pentru ${user.email} a fost confirmat. Te poti intoarce in site pentru autentificare.`,
  );
}

async function getHomePageData() {
  const featuredProducts = await getProducts({ featuredOnly: true, limit: 4 });
  const categories = await getCategories();

  return {
    hero: {
      eyebrow: '100% Natural',
      title: ['Suc Natural de Mere,', 'Presat la Rece'],
      subtitle: ['100% natural, fara conservanti.', 'Gust adevarat, direct din livada noastra.'],
      image: '/images/homepage-hero.png',
    },
    benefits: [
      { label: '100% Natural', icon: 'leaf' },
      { label: 'Presat la Rece', icon: 'waves' },
      { label: 'Fara Zahar Adaugat', icon: 'heart' },
      { label: 'Ambalaj Bag-in-Box', icon: 'box' },
    ],
    featuredProducts,
    categories,
  };
}

async function getCategories() {
  const { rows } = await pool.query(
    `
      SELECT id, slug, name, description, image_url
      FROM categories
      ORDER BY sort_order ASC, name ASC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image_url,
  }));
}

async function getProducts({ categorySlug = null, featuredOnly = false, limit = null } = {}) {
  const params = [];
  const conditions = ['p.is_active = TRUE'];

  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`c.slug = $${params.length}`);
  }

  if (featuredOnly) {
    conditions.push('p.is_featured = TRUE');
  }

  let limitClause = '';
  if (limit) {
    params.push(limit);
    limitClause = `LIMIT $${params.length}`;
  }

  const { rows } = await pool.query(
    `
      SELECT
        p.id,
        p.slug,
        p.name,
        p.subtitle,
        p.short_description,
        p.description,
        p.volume_label,
        p.base_price,
        p.compare_at_price,
        p.badge,
        p.accent,
        p.stock_quantity,
        c.slug AS category_slug,
        c.name AS category_name,
        COALESCE(
          (
            SELECT pi.image_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY pi.is_primary DESC, pi.sort_order ASC
            LIMIT 1
          ),
          '/images/homepage-hero.png'
        ) AS primary_image
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.is_featured DESC, p.created_at ASC
      ${limitClause}
    `,
    params,
  );

  return rows.map(mapProductCard);
}

async function getProductBySlug(slug) {
  const { rows } = await pool.query(
    `
      SELECT
        p.*,
        c.slug AS category_slug,
        c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.slug = $1 AND p.is_active = TRUE
      LIMIT 1
    `,
    [slug],
  );

  const product = rows[0];
  if (!product) {
    return null;
  }

  const imagesResult = await pool.query(
    `
      SELECT image_url, alt_text, is_primary, sort_order
      FROM product_images
      WHERE product_id = $1
      ORDER BY is_primary DESC, sort_order ASC
    `,
    [product.id],
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    shortDescription: product.short_description,
    description: product.description,
    volumeLabel: product.volume_label,
    price: Number(product.base_price),
    compareAtPrice: product.compare_at_price == null ? null : Number(product.compare_at_price),
    badge: product.badge,
    accent: product.accent,
    stockQuantity: product.stock_quantity,
    category: {
      slug: product.category_slug,
      name: product.category_name,
    },
    images: imagesResult.rows.map((image) => ({
      url: image.image_url,
      alt: image.alt_text,
      isPrimary: image.is_primary,
    })),
    highlights: ['100% natural', 'Presat la rece', 'Fara zahar adaugat', 'Ambalaj Bag-in-Box'],
  };
}

function mapProductCard(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    volumeLabel: row.volume_label,
    price: Number(row.base_price),
    compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    badge: row.badge,
    accent: row.accent,
    stockQuantity: row.stock_quantity,
    image: row.primary_image,
    category: {
      slug: row.category_slug,
      name: row.category_name,
    },
  };
}

async function getAccountOverview(user) {
  const [orders, addresses] = await Promise.all([
    getAccountOrders(user.id),
    getAccountAddresses(user.id),
  ]);

  const totalOrders = orders.length;
  const activeOrders = orders.filter((order) => ['In pregatire', 'In livrare', 'Confirmata'].includes(order.status)).length;
  const lastOrder = orders[0] ?? null;

  return {
    user: buildSafeUser(user),
    highlights: [
      {
        label: 'Comenzi active',
        value: `${activeOrders}`,
        detail: activeOrders ? 'urmareste statusul direct din cont' : 'nu ai comenzi active in acest moment',
      },
      {
        label: 'Ultima comanda',
        value: lastOrder ? formatMoney(lastOrder.total) : 'Nicio comanda',
        detail: lastOrder ? `plasata pe ${formatDateRo(lastOrder.createdAt)}` : 'prima ta comanda va aparea aici',
      },
      {
        label: 'Adrese salvate',
        value: `${addresses.length}`,
        detail: addresses.length ? 'gestioneaza rapid livrarile din cont' : 'adauga o adresa pentru checkout mai rapid',
      },
    ],
    recentOrders: orders.slice(0, 3),
  };
}

async function getAccountOrders(userId) {
  const { rows } = await pool.query(
    `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.total,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'productName', oi.product_name,
              'variantLabel', oi.variant_label,
              'quantity', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.order_number,
    status: row.status,
    total: Number(row.total),
    createdAt: row.created_at,
    items: row.items.map((item) => ({
      name: item.productName,
      variant: item.variantLabel,
      quantity: item.quantity,
    })),
  }));
}

async function getAccountAddresses(userId) {
  const { rows } = await pool.query(
    `
      SELECT id, label, recipient_name, phone, line1, line2, city, county, postal_code, country_code, is_default
      FROM addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    county: row.county,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    isDefault: row.is_default,
  }));
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? `${amount} Lei` : `${amount.toFixed(2).replace(/\.?0+$/, '')} Lei`;
}

function formatDateRo(value) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

async function createOrder(body, user) {
  const items = Array.isArray(body.items) ? body.items : [];
  const customerName = String(body.customerName || '').trim();
  const customerEmail = normalizeEmail(body.customerEmail || user?.email || '');
  const customerPhone = String(body.customerPhone || user?.phone || '').trim();
  const county = String(body.county || '').trim();
  const city = String(body.city || '').trim();
  const line1 = String(body.addressLine1 || '').trim();
  const line2 = String(body.addressLine2 || '').trim();
  const postalCode = String(body.postalCode || '').trim();
  const notes = String(body.notes || '').trim();

  if (!customerName || !customerEmail || !customerPhone || !county || !city || !line1 || !postalCode || !items.length) {
    return { status: 400, body: { message: 'Datele checkout-ului sunt incomplete.' } };
  }

  const productIds = items.map((item) => item.id).filter(Boolean);
  const productsResult = await pool.query(
    `
      SELECT id, name, subtitle, base_price, stock_quantity
      FROM products
      WHERE id = ANY($1::text[]) AND is_active = TRUE
    `,
    [productIds],
  );

  const productsMap = new Map(productsResult.rows.map((row) => [row.id, row]));
  if (productsMap.size !== productIds.length) {
    return { status: 400, body: { message: 'Unul sau mai multe produse nu mai sunt disponibile.' } };
  }

  let subtotal = 0;
  const normalizedItems = [];

  for (const item of items) {
    const product = productsMap.get(item.id);
    const quantity = Math.max(1, Number(item.quantity || 1));

    if (product.stock_quantity < quantity) {
      return { status: 400, body: { message: `Stoc insuficient pentru ${product.name}.` } };
    }

    const unitPrice = Number(product.base_price);
    subtotal += unitPrice * quantity;

    normalizedItems.push({
      productId: product.id,
      productName: product.name,
      variantLabel: product.subtitle,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  const shippingTotal = subtotal >= 150 ? 0 : 19;
  const total = subtotal + shippingTotal;
  const orderId = randomUUID();
  const orderNumber = `LN-${Math.floor(1000 + Math.random() * 9000)}`;
  const addressId = randomUUID();

  await pool.query('BEGIN');

  try {
    let savedAddressId = null;

    if (user) {
      const existingDefaultAddress = await pool.query(
        'SELECT id FROM addresses WHERE user_id = $1 AND is_default = TRUE LIMIT 1',
        [user.id],
      );

      await pool.query(
        `
          INSERT INTO addresses (
            id, user_id, label, recipient_name, phone, line1, line2, city, county, postal_code, country_code, is_default, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RO', $11, $12)
        `,
        [
          addressId,
          user.id,
          body.addressLabel || 'Adresa de livrare',
          customerName,
          customerPhone,
          line1,
          line2 || null,
          city,
          county,
          postalCode,
          existingDefaultAddress.rowCount === 0,
          new Date(),
        ],
      );

      savedAddressId = addressId;
    }

    await pool.query(
      `
        INSERT INTO orders (
          id, user_id, order_number, status, payment_status, currency, subtotal, shipping_total,
          discount_total, total, customer_name, customer_email, customer_phone, shipping_address_id, notes, created_at
        )
        VALUES ($1, $2, $3, 'In pregatire', 'Neplatita', 'RON', $4, $5, 0, $6, $7, $8, $9, $10, $11, $12)
      `,
      [orderId, user?.id || null, orderNumber, subtotal, shippingTotal, total, customerName, customerEmail, customerPhone, savedAddressId, notes || null, new Date()],
    );

    for (const item of normalizedItems) {
      await pool.query(
        `
          INSERT INTO order_items (id, order_id, product_id, product_name, variant_label, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [randomUUID(), orderId, item.productId, item.productName, item.variantLabel, item.quantity, item.unitPrice, item.lineTotal],
      );

      await pool.query(
        'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $2) WHERE id = $1',
        [item.productId, item.quantity],
      );
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }

  return {
    status: 201,
    body: {
      message: `Comanda ${orderNumber} a fost inregistrata.`,
      orderNumber,
      total,
    },
  };
}

async function getAdminDashboard() {
  const [ordersCountResult, revenueResult, customersResult, lowStockResult, recentOrders] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM orders`),
    pool.query(`SELECT COALESCE(SUM(total), 0)::numeric AS revenue FROM orders`),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE stock_quantity <= 20 AND is_active = TRUE`),
    pool.query(
      `
        SELECT order_number, status, total, customer_name, created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 5
      `,
    ),
  ]);

  return {
    stats: [
      { label: 'Comenzi totale', value: `${ordersCountResult.rows[0].count}`, detail: 'toate comenzile inregistrate' },
      { label: 'Venit brut', value: formatMoney(revenueResult.rows[0].revenue), detail: 'fara costuri si retururi' },
      { label: 'Clienti', value: `${customersResult.rows[0].count}`, detail: 'conturi client inregistrate' },
      { label: 'Stoc redus', value: `${lowStockResult.rows[0].count}`, detail: 'produse sub pragul de 20 bucati' },
    ],
    recentOrders: recentOrders.rows.map((row) => ({
      code: row.order_number,
      status: row.status,
      total: Number(row.total),
      customerName: row.customer_name,
      createdAt: row.created_at,
    })),
  };
}

async function getAdminProducts() {
  const { rows } = await pool.query(
    `
      SELECT p.id, p.name, p.slug, p.sku, p.subtitle, p.short_description, p.base_price, p.stock_quantity, p.is_active, p.badge, p.accent, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at ASC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    price: Number(row.base_price),
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    badge: row.badge,
    accent: row.accent,
    categoryName: row.category_name,
  }));
}

async function getAdminProduct(productId) {
  const { rows } = await pool.query(
    `
      SELECT
        p.id,
        p.category_id,
        p.slug,
        p.sku,
        p.name,
        p.subtitle,
        p.short_description,
        p.description,
        p.volume_label,
        p.base_price,
        p.badge,
        p.accent,
        p.stock_quantity,
        p.is_active,
        COALESCE(
          (
            SELECT image_url
            FROM product_images
            WHERE product_id = p.id
            ORDER BY is_primary DESC, sort_order ASC
            LIMIT 1
          ),
          '/images/homepage-hero.png'
        ) AS image_url
      FROM products p
      WHERE p.id = $1
      LIMIT 1
    `,
    [productId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    description: row.description,
    volumeLabel: row.volume_label,
    price: Number(row.base_price),
    badge: row.badge,
    accent: row.accent,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    image: row.image_url,
  };
}

async function createAdminProduct(body) {
  const name = String(body.name || '').trim();
  const categoryId = String(body.categoryId || '').trim();
  const subtitle = String(body.subtitle || '').trim();
  const shortDescription = String(body.shortDescription || '').trim();
  const description = String(body.description || '').trim();
  const volumeLabel = String(body.volumeLabel || '').trim();
  const badge = String(body.badge || '').trim();
  const accent = String(body.accent || 'gold').trim();
  const image = String(body.image || '/images/homepage-hero.png').trim();
  const price = Number(body.price || 0);
  const stockQuantity = Number(body.stockQuantity || 0);

  const id = randomUUID();
  const slug = slugify(name);
  const sku = `LN-${slug.toUpperCase().replace(/-/g, '').slice(0, 10)}-${Date.now().toString().slice(-4)}`;

  await pool.query(
    `
      INSERT INTO products (
        id, category_id, slug, sku, name, subtitle, short_description, description, volume_label,
        base_price, compare_at_price, badge, accent, is_featured, is_active, stock_quantity, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, FALSE, TRUE, $13, $14)
    `,
    [id, categoryId, slug, sku, name, subtitle, shortDescription, description, volumeLabel, price, badge || null, accent, stockQuantity, new Date()],
  );

  await pool.query(
    `
      INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order, is_primary)
      VALUES ($1, $2, $3, $4, 1, TRUE)
    `,
    [randomUUID(), id, image, name],
  );

  return (await getAdminProducts()).find((product) => product.id === id);
}

async function updateAdminProduct(productId, body) {
  const image = body.image ? String(body.image).trim() : null;
  await pool.query(
    `
      UPDATE products
      SET
        category_id = COALESCE($2, category_id),
        name = COALESCE($3, name),
        subtitle = COALESCE($4, subtitle),
        short_description = COALESCE($5, short_description),
        description = COALESCE($6, description),
        volume_label = COALESCE($7, volume_label),
        badge = COALESCE($8, badge),
        accent = COALESCE($9, accent),
        base_price = COALESCE($10, base_price),
        stock_quantity = COALESCE($11, stock_quantity),
        is_active = COALESCE($12, is_active)
      WHERE id = $1
    `,
    [
      productId,
      body.categoryId || null,
      body.name || null,
      body.subtitle || null,
      body.shortDescription || null,
      body.description || null,
      body.volumeLabel || null,
      body.badge || null,
      body.accent || null,
      body.price == null ? null : Number(body.price),
      body.stockQuantity == null ? null : Number(body.stockQuantity),
      body.isActive == null ? null : Boolean(body.isActive),
    ],
  );

  if (image) {
    const existingImage = await pool.query(
      `
        SELECT id
        FROM product_images
        WHERE product_id = $1
        ORDER BY is_primary DESC, sort_order ASC
        LIMIT 1
      `,
      [productId],
    );

    if (existingImage.rowCount) {
      await pool.query('UPDATE product_images SET image_url = $2, alt_text = $3 WHERE id = $1', [
        existingImage.rows[0].id,
        image,
        body.name || 'Produs',
      ]);
    } else {
      await pool.query(
        `
          INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order, is_primary)
          VALUES ($1, $2, $3, $4, 1, TRUE)
        `,
        [randomUUID(), productId, image, body.name || 'Produs'],
      );
    }
  }

  return getAdminProduct(productId);
}

async function createAdminCategory(body) {
  const id = randomUUID();
  const name = String(body.name || '').trim();
  const slug = slugify(String(body.slug || name));
  const description = String(body.description || '').trim();
  const image = String(body.image || '/images/homepage-hero.png').trim();
  const sortOrder = Number(body.sortOrder || 99);

  await pool.query(
    `
      INSERT INTO categories (id, slug, name, description, image_url, sort_order, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [id, slug, name, description, image, sortOrder, new Date()],
  );

  return (await getCategories()).find((category) => category.id === id);
}

async function getAdminOrders() {
  const { rows } = await pool.query(
    `
      SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.customer_name, o.customer_email, o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    total: Number(row.total),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    createdAt: row.created_at,
  }));
}

async function updateAdminOrder(orderId, body) {
  await pool.query(
    `
      UPDATE orders
      SET
        status = COALESCE($2, status),
        payment_status = COALESCE($3, payment_status)
      WHERE id = $1
    `,
    [orderId, body.status || null, body.paymentStatus || null],
  );

  return (await getAdminOrders()).find((order) => order.id === orderId);
}

async function getAdminCustomers() {
  const { rows } = await pool.query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.created_at,
        COUNT(o.id)::int AS orders_count,
        COALESCE(SUM(o.total), 0)::numeric AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    phone: row.phone,
    ordersCount: row.orders_count,
    totalSpent: Number(row.total_spent),
    createdAt: row.created_at,
  }));
}

async function getAdminInventory() {
  const { rows } = await pool.query(
    `
      SELECT id, name, sku, stock_quantity, is_active
      FROM products
      ORDER BY stock_quantity ASC, created_at ASC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
  }));
}

function getEmailMode() {
  return env.RESEND_API_KEY && env.AUTH_FROM_EMAIL ? 'resend' : 'local-outbox';
}

async function sendEmail({ to, subject, html }) {
  if (getEmailMode() === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.AUTH_FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Resend error: ${details}`);
    }

    return { mode: 'resend' };
  }

  const fileName = `${Date.now()}-${slugify(subject)}.html`;
  const filePath = join(OUTBOX_DIR, fileName);
  writeFileSync(filePath, html, 'utf8');
  return { mode: 'local-outbox', previewFile: filePath };
}

function buildConfirmationEmail({ firstName, confirmationUrl }) {
  return `
    <div style="font-family: Georgia, serif; background:#f7f0e4; padding:32px; color:#3a2110">
      <h1 style="margin:0 0 16px;">Bine ai venit, ${firstName}</h1>
      <p style="margin:0 0 20px; line-height:1.6;">Contul tau Livada Noastra a fost creat. Pentru a activa autentificarea, confirma adresa de email.</p>
      <a href="${confirmationUrl}" style="display:inline-block; padding:14px 20px; border-radius:12px; background:#3d6b44; color:#fff9f1; text-decoration:none; font-weight:700;">Confirma emailul</a>
      <p style="margin:20px 0 0; line-height:1.6;">Daca nu ai creat acest cont, ignora acest mesaj.</p>
    </div>
  `;
}

function buildResetEmail({ firstName, resetUrl }) {
  return `
    <div style="font-family: Georgia, serif; background:#f7f0e4; padding:32px; color:#3a2110">
      <h1 style="margin:0 0 16px;">Salut, ${firstName}</h1>
      <p style="margin:0 0 20px; line-height:1.6;">Am primit o cerere de resetare a parolei. Linkul este valabil 30 de minute.</p>
      <a href="${resetUrl}" style="display:inline-block; padding:14px 20px; border-radius:12px; background:#3d6b44; color:#fff9f1; text-decoration:none; font-weight:700;">Reseteaza parola</a>
    </div>
  `;
}

function renderEmailPage(title, message) {
  return `
    <!doctype html>
    <html lang="ro">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0; font-family: Georgia, serif; background:#f7f0e4; color:#3a2110;">
        <main style="min-height:100vh; display:grid; place-items:center; padding:24px;">
          <section style="max-width:640px; padding:32px; border-radius:24px; background:#fbf7f0; border:1px solid rgba(90,53,40,.12); box-shadow:0 20px 50px rgba(83,58,35,.08);">
            <h1 style="margin:0 0 16px;">${title}</h1>
            <p style="margin:0; line-height:1.7;">${message}</p>
          </section>
        </main>
      </body>
    </html>
  `;
}

function createToken() {
  return randomBytes(32).toString('hex');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const [key, ...rest] = entry.split('=');
      cookies[key] = decodeURIComponent(rest.join('='));
      return cookies;
    }, {});
}

function setSessionCookie(res, sessionId, remember) {
  const maxAge = remember ? REMEMBER_SESSION_TTL_MS : SESSION_TTL_MS;
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, sessionId, maxAge));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, '', 0));
}

function serializeCookie(name, value, maxAgeMs) {
  const isSecure = env.NODE_ENV === 'production';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`,
  ];

  if (isSecure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function isRateLimited(key, limit, windowMs) {
  const now = Date.now();
  const attempts = (rateLimiter.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
  attempts.push(now);
  rateLimiter.set(key, attempts);
  return attempts.length > limit;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function apiBaseUrl() {
  return env.APP_BASE_URL || 'http://localhost:4200';
}
