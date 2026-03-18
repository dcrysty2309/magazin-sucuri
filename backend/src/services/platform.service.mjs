import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.mjs';
import { sequelize } from '../config/database.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = resolve(__dirname, '..', '..');
const ROOT_DIR = resolve(BACKEND_DIR, '..');
const DATA_DIR = join(BACKEND_DIR, 'data');
const OUTBOX_DIR = join(DATA_DIR, 'outbox');
export const SESSION_COOKIE = 'livada_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const REMEMBER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;
const ACCOUNT_LOCK_MINUTES = 15;
const MAX_FAILED_LOGINS = 5;
const BCRYPT_ROUNDS = 12;
const rateLimiter = new Map();

ensureStorage();

export async function dbQuery(sql, bind = []) {
  return executeQuery(sql, bind);
}

export async function initializePlatform() {
  await sequelize.authenticate();
  await initializeDatabase();
}

async function executeQuery(sql, bind = [], transaction) {
  const [rows] = await sequelize.query(sql, { bind, raw: true, transaction });
  const normalizedRows = Array.isArray(rows) ? rows : rows ? [rows] : [];
  return {
    rows: normalizedRows,
    rowCount: normalizedRows.length,
  };
}

async function txQuery(transaction, sql, bind = []) {
  return executeQuery(sql, bind, transaction);
}

function ensureStorage() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(OUTBOX_DIR)) {
    mkdirSync(OUTBOX_DIR, { recursive: true });
  }
}





async function initializeDatabase() {
  const schemaSql = readFileSync(join(BACKEND_DIR, 'init.sql'), 'utf8');
  await dbQuery(schemaSql);
  await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'`);
  await dbQuery(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
  await dbQuery(`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)`);
  await dbQuery(`CREATE INDEX IF NOT EXISTS idx_products_stock_active ON products(is_active, stock_quantity)`);
  await dbQuery(`DELETE FROM sessions WHERE expires_at < NOW();`);
  await seedStoreCatalog();
  await seedAdminUser();
  await seedStoreSettings();
}

async function seedStoreCatalog() {
  const { rows } = await dbQuery('SELECT COUNT(*)::int AS count FROM categories');
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
    await dbQuery(
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
    await dbQuery(
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
      await dbQuery(
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
  const email = normalizeEmail(env.ADMIN_EMAIL || 'admin@livadanoastra.local');
  const firstName = env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = env.ADMIN_LAST_NAME || 'Livada';
  const phone = env.ADMIN_PHONE || '0700000000';
  const password = env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await dbQuery('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
  if (existing.rowCount) {
    await dbQuery('UPDATE users SET role = $2 WHERE email = $1', [email, 'admin']);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await dbQuery(
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

async function seedStoreSettings() {
  const existing = await dbQuery('SELECT id FROM store_settings LIMIT 1');
  if (existing.rowCount) {
    return;
  }

  await dbQuery(
    `
      INSERT INTO store_settings (id, settings, created_at, updated_at)
      VALUES ($1, $2::jsonb, $3, $3)
    `,
    ['default', JSON.stringify(getDefaultStoreSettings()), new Date()],
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

  const existing = await dbQuery('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
  if (existing.rowCount) {
    return { status: 409, body: { message: 'Exista deja un cont cu acest email.' } };
  }

  const confirmationToken = createToken();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await dbQuery(
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
  const { rows } = await dbQuery('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
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

    await dbQuery(
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

  await dbQuery('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);

  const sessionId = createToken();
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_SESSION_TTL_MS : SESSION_TTL_MS));
  await dbQuery(
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
  await dbQuery('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

async function getUserFromSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const { rows } = await dbQuery(
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

  const { rows } = await dbQuery('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  const user = rows[0];

  if (!user) {
    return {
      status: 200,
      body: { message: 'Daca exista un cont cu acest email, vei primi instructiuni de resetare.' },
    };
  }

  const resetToken = createToken();
  await dbQuery(
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

  const { rows } = await dbQuery(
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
  await dbQuery(
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

  await dbQuery('DELETE FROM sessions WHERE user_id = $1', [user.id]);

  return { status: 200, body: { message: 'Parola a fost actualizata. Te poti autentifica acum.' } };
}

async function confirmEmail(token) {
  const { rows } = await dbQuery(
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

  await dbQuery(
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
  const { rows } = await dbQuery(
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

  const { rows } = await dbQuery(
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
  const { rows } = await dbQuery(
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

  const imagesResult = await dbQuery(
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
  const { rows } = await dbQuery(
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
  const { rows } = await dbQuery(
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

function calculatePercentageChange(currentValue, previousValue) {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function inferTrend(change) {
  if (change > 0) {
    return 'up';
  }

  if (change < 0) {
    return 'down';
  }

  return 'neutral';
}

function estimatePageViews(orderCount, userCount, base = 0) {
  return Math.round(base + Number(orderCount || 0) * 24 + Number(userCount || 0) * 11);
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short' }).format(new Date(value));
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
  const productsResult = await dbQuery(
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

  const transaction = await sequelize.transaction();

  try {
    let savedAddressId = null;

    if (user) {
      const existingDefaultAddress = await txQuery(
        transaction,
        'SELECT id FROM addresses WHERE user_id = $1 AND is_default = TRUE LIMIT 1',
        [user.id],
      );

      await txQuery(
        transaction,
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

    await txQuery(
      transaction,
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
      await txQuery(
        transaction,
        `
          INSERT INTO order_items (id, order_id, product_id, product_name, variant_label, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [randomUUID(), orderId, item.productId, item.productName, item.variantLabel, item.quantity, item.unitPrice, item.lineTotal],
      );

      await txQuery(
        transaction,
        'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $2) WHERE id = $1',
        [item.productId, item.quantity],
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
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

async function getAdminDashboard(range = '7') {
  const safeRange = range === '1' || range === '30' || range === 'total' ? range : '7';
  const [statsPayload, salesPayload, ordersPayload, productsPayload, dashboardProducts] = await Promise.all([
    getDashboardStats(),
    getDashboardSales(safeRange),
    getDashboardRecentOrders(),
    getDashboardTopProducts(safeRange),
    dbQuery(
      `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.volume_label,
          p.stock_quantity,
          p.base_price,
          p.is_active,
          c.name AS category_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY p.stock_quantity ASC, p.created_at DESC
        LIMIT 6
      `,
    ),
  ]);

  return {
    stats: statsPayload.stats,
    kpis: statsPayload.kpis,
    range: safeRange,
    sales: salesPayload.points,
    orderVolume: salesPayload.points.map((point) => ({ label: point.label, value: point.orders || 0 })),
    recentOrders: ordersPayload.orders,
    topProducts: productsPayload.products,
    products: dashboardProducts.rows.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      volumeLabel: row.volume_label,
      stockQuantity: row.stock_quantity,
      price: Number(row.base_price),
      isActive: row.is_active,
      categoryName: row.category_name,
    })),
  };
}

async function getAdminProducts() {
  const { rows } = await dbQuery(
    `
      SELECT p.id, p.name, p.slug, p.sku, p.subtitle, p.short_description, p.base_price, p.stock_quantity, p.is_active, p.badge, p.accent, c.name AS category_name
      , p.volume_label
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
    volumeLabel: row.volume_label,
    price: Number(row.base_price),
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    badge: row.badge,
    accent: row.accent,
    categoryName: row.category_name,
  }));
}

async function getAdminProduct(productId) {
  const { rows } = await dbQuery(
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

  await dbQuery(
    `
      INSERT INTO products (
        id, category_id, slug, sku, name, subtitle, short_description, description, volume_label,
        base_price, compare_at_price, badge, accent, is_featured, is_active, stock_quantity, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, FALSE, TRUE, $13, $14)
    `,
    [id, categoryId, slug, sku, name, subtitle, shortDescription, description, volumeLabel, price, badge || null, accent, stockQuantity, new Date()],
  );

  await dbQuery(
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
  await dbQuery(
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
    const existingImage = await dbQuery(
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
      await dbQuery('UPDATE product_images SET image_url = $2, alt_text = $3 WHERE id = $1', [
        existingImage.rows[0].id,
        image,
        body.name || 'Produs',
      ]);
    } else {
      await dbQuery(
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

async function deleteAdminProduct(productId) {
  const existing = await getAdminProduct(productId);
  if (!existing) {
    return { message: 'Produsul nu a fost gasit.' };
  }

  const transaction = await sequelize.transaction();

  try {
    await txQuery(transaction, 'DELETE FROM cart_items WHERE product_id = $1', [productId]);
    await txQuery(transaction, 'DELETE FROM product_images WHERE product_id = $1', [productId]);
    await txQuery(transaction, 'DELETE FROM products WHERE id = $1', [productId]);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return { message: `Produsul ${existing.name} a fost sters.` };
}

async function createAdminCategory(body) {
  const id = randomUUID();
  const name = String(body.name || '').trim();
  const slug = slugify(String(body.slug || name));
  const description = String(body.description || '').trim();
  const image = String(body.image || '/images/homepage-hero.png').trim();
  const sortOrder = Number(body.sortOrder || 99);

  await dbQuery(
    `
      INSERT INTO categories (id, slug, name, description, image_url, sort_order, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [id, slug, name, description, image, sortOrder, new Date()],
  );

  return (await getCategories()).find((category) => category.id === id);
}

async function getAdminOrders() {
  const { rows } = await dbQuery(
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

async function getAdminOrder(orderId) {
  const orderResult = await dbQuery(
    `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.currency,
        o.subtotal,
        o.shipping_total,
        o.discount_total,
        o.total,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.notes,
        o.created_at,
        a.label AS address_label,
        a.line1,
        a.line2,
        a.city,
        a.county,
        a.postal_code
      FROM orders o
      LEFT JOIN addresses a ON a.id = o.shipping_address_id
      WHERE o.id = $1
      LIMIT 1
    `,
    [orderId],
  );

  const order = orderResult.rows[0];
  if (!order) {
    return null;
  }

  const itemsResult = await dbQuery(
    `
      SELECT product_name, variant_label, quantity, unit_price, line_total
      FROM order_items
      WHERE order_id = $1
      ORDER BY product_name ASC
    `,
    [orderId],
  );

  return {
    id: order.id,
    code: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shipping_total),
    discountTotal: Number(order.discount_total),
    total: Number(order.total),
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    notes: order.notes,
    createdAt: order.created_at,
    address: order.line1
      ? {
          label: order.address_label || 'Adresa livrare',
          line1: order.line1,
          line2: order.line2,
          city: order.city,
          county: order.county,
          postalCode: order.postal_code,
        }
      : null,
    items: itemsResult.rows.map((item) => ({
      productName: item.product_name,
      variantLabel: item.variant_label,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
  };
}

async function updateAdminOrder(orderId, body) {
  await dbQuery(
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

async function createAdminOrder(body) {
  const result = await createOrder(body, null);
  if (result?.status && result.status >= 400) {
    throw new Error(result.body?.message || 'Nu am putut crea comanda.');
  }

  const createdOrder = await dbQuery(`SELECT id FROM orders WHERE order_number = $1 LIMIT 1`, [result.body.orderNumber]);
  const orderId = createdOrder.rows[0]?.id;
  return orderId ? getAdminOrder(orderId) : { code: result.body.orderNumber, total: result.body.total };
}

async function deleteAdminOrder(orderId) {
  const existing = await getAdminOrder(orderId);
  if (!existing) {
    return { message: 'Comanda nu a fost gasita.' };
  }

  await dbQuery(`DELETE FROM orders WHERE id = $1`, [orderId]);
  return { message: `Comanda ${existing.code} a fost stearsa.` };
}

async function getAdminCustomers() {
  const { rows } = await dbQuery(
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

async function getAdminCustomer(customerId) {
  const customerResult = await dbQuery(
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
      WHERE u.role = 'customer' AND u.id = $1
      GROUP BY u.id
      LIMIT 1
    `,
    [customerId],
  );

  const customer = customerResult.rows[0];
  if (!customer) {
    return null;
  }

  const [ordersResult, addressesResult] = await Promise.all([
    dbQuery(
      `
        SELECT id, order_number, status, payment_status, total, created_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [customerId],
    ),
    dbQuery(
      `
        SELECT id, label, recipient_name, phone, line1, line2, city, county, postal_code, is_default, created_at
        FROM addresses
        WHERE user_id = $1
        ORDER BY is_default DESC, created_at DESC
      `,
      [customerId],
    ),
  ]);

  return {
    id: customer.id,
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone,
    ordersCount: customer.orders_count,
    totalSpent: Number(customer.total_spent),
    createdAt: customer.created_at,
    orders: ordersResult.rows.map((order) => ({
      id: order.id,
      code: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      total: Number(order.total),
      createdAt: order.created_at,
    })),
    addresses: addressesResult.rows.map((address) => ({
      id: address.id,
      label: address.label,
      recipientName: address.recipient_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      county: address.county,
      postalCode: address.postal_code,
      isDefault: address.is_default,
      createdAt: address.created_at,
    })),
  };
}

async function createAdminCustomer(body) {
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const email = normalizeEmail(body.email || '');
  const phone = String(body.phone || '').trim();
  const password = String(body.password || 'Client123!').trim();

  if (!firstName || !lastName || !email || !phone || password.length < 8) {
    throw new Error('Datele clientului sunt incomplete.');
  }

  const existing = await dbQuery(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email]);
  if (existing.rowCount) {
    throw new Error('Exista deja un client cu acest email.');
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const now = new Date();

  await dbQuery(
    `
      INSERT INTO users (
        id, role, first_name, last_name, email, phone, password_hash, email_verified,
        failed_login_attempts, gdpr_consent_at, created_at
      )
      VALUES ($1, 'customer', $2, $3, $4, $5, $6, TRUE, 0, $7, $8)
    `,
    [id, firstName, lastName, email, phone, passwordHash, now, now],
  );

  return getAdminCustomer(id);
}

async function updateAdminCustomer(customerId, body) {
  const firstName = body.firstName == null ? null : String(body.firstName).trim();
  const lastName = body.lastName == null ? null : String(body.lastName).trim();
  const email = body.email == null ? null : normalizeEmail(body.email);
  const phone = body.phone == null ? null : String(body.phone).trim();

  if (email) {
    const existing = await dbQuery(`SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1`, [email, customerId]);
    if (existing.rowCount) {
      throw new Error('Exista deja un client cu acest email.');
    }
  }

  await dbQuery(
    `
      UPDATE users
      SET
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone)
      WHERE id = $1 AND role = 'customer'
    `,
    [customerId, firstName, lastName, email, phone],
  );

  if (body.password) {
    const passwordHash = await bcrypt.hash(String(body.password), BCRYPT_ROUNDS);
    await dbQuery(`UPDATE users SET password_hash = $2 WHERE id = $1 AND role = 'customer'`, [customerId, passwordHash]);
  }

  return getAdminCustomer(customerId);
}

async function deleteAdminCustomer(customerId) {
  const existing = await getAdminCustomer(customerId);
  if (!existing) {
    return { message: 'Clientul nu a fost gasit.' };
  }

  await dbQuery(`DELETE FROM users WHERE id = $1 AND role = 'customer'`, [customerId]);
  return { message: `Clientul ${existing.name} a fost sters.` };
}

async function getAdminInventory() {
  const { rows } = await dbQuery(
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

async function getStoreSettings() {
  const { rows } = await dbQuery(
    `
      SELECT settings
      FROM store_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `,
  );

  return normalizeStoreSettings(rows[0]?.settings);
}

async function updateStoreSettings(input) {
  const settings = normalizeStoreSettings(input);

  await dbQuery(
    `
      INSERT INTO store_settings (id, settings, created_at, updated_at)
      VALUES ('default', $1::jsonb, NOW(), NOW())
      ON CONFLICT (id)
      DO UPDATE SET settings = EXCLUDED.settings, updated_at = EXCLUDED.updated_at
    `,
    [JSON.stringify(settings)],
  );

  return settings;
}

async function getAdminShippingSettings() {
  const settings = await getStoreSettings();
  return {
    shipping: settings.shipping,
    location: settings.location,
  };
}

async function updateAdminShippingSettings(input) {
  const existing = await getStoreSettings();
  const shipping = input?.shipping && typeof input.shipping === 'object' ? input.shipping : input;
  const location = input?.location && typeof input.location === 'object' ? input.location : {};

  const settings = await updateStoreSettings({
    ...existing,
    shipping: {
      ...existing.shipping,
      ...(shipping || {}),
    },
    location: {
      ...existing.location,
      ...(location || {}),
    },
  });

  return {
    shipping: settings.shipping,
    location: settings.location,
  };
}

async function getAdminPaymentsSettings() {
  const settings = await getStoreSettings();
  return {
    payments: settings.payments,
  };
}

async function updateAdminPaymentsSettings(input) {
  const existing = await getStoreSettings();
  const settings = await updateStoreSettings({
    ...existing,
    payments: {
      ...existing.payments,
      ...(input?.payments && typeof input.payments === 'object' ? input.payments : input),
    },
  });

  return {
    payments: settings.payments,
  };
}

async function getAdminAnalytics() {
  const [orders, customers, inventory] = await Promise.all([
    getAdminOrders(),
    getAdminCustomers(),
    getAdminInventory(),
  ]);
  const orderDetails = await Promise.all(orders.slice(0, 20).map((order) => getAdminOrder(order.id)));

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const litersSold = orderDetails
    .flatMap((order) => order?.items ?? [])
    .reduce((sum, item) => sum + extractVariantLiters(item.variantLabel) * Number(item.quantity || 0), 0);
  const activeCustomers = customers.filter((customer) => customer.ordersCount > 0).length;

  const salesByDayMap = new Map();
  for (const order of orders.slice(0, 14).reverse()) {
    const label = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short' }).format(new Date(order.createdAt));
    salesByDayMap.set(label, (salesByDayMap.get(label) || 0) + Number(order.total || 0));
  }

  const productsMap = new Map();
  for (const order of orderDetails) {
    for (const item of order?.items ?? []) {
      productsMap.set(item.productName, (productsMap.get(item.productName) || 0) + Number(item.quantity || 0));
    }
  }

  return {
    kpis: {
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue),
      litersSold: Number(litersSold.toFixed(1)),
      activeCustomers,
    },
    salesByDay: Array.from(salesByDayMap.entries()).map(([label, value]) => ({ label, value })),
    popularProducts: [...productsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value })),
    recentOrders: orders.slice(0, 5),
    inventorySnapshot: inventory.slice(0, 5),
  };
}

async function getDashboardStats() {
  const [summaryResult, historyResult] = await Promise.all([
    dbQuery(
      `
        WITH month_ranges AS (
          SELECT
            DATE_TRUNC('month', NOW()) AS current_start,
            DATE_TRUNC('month', NOW()) + INTERVAL '1 month' AS next_start,
            DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AS previous_start
        )
        SELECT
          (SELECT COALESCE(SUM(total), 0)::numeric FROM orders, month_ranges WHERE created_at >= current_start AND created_at < next_start) AS revenue_current,
          (SELECT COALESCE(SUM(total), 0)::numeric FROM orders, month_ranges WHERE created_at >= previous_start AND created_at < current_start) AS revenue_previous,
          (SELECT COUNT(*)::int FROM orders, month_ranges WHERE created_at >= current_start AND created_at < next_start) AS orders_current,
          (SELECT COUNT(*)::int FROM orders, month_ranges WHERE created_at >= previous_start AND created_at < current_start) AS orders_previous,
          (SELECT COUNT(*)::int FROM users, month_ranges WHERE role = 'customer' AND created_at >= current_start AND created_at < next_start) AS users_current,
          (SELECT COUNT(*)::int FROM users, month_ranges WHERE role = 'customer' AND created_at >= previous_start AND created_at < current_start) AS users_previous,
          (SELECT COUNT(*)::int FROM orders) AS orders_total,
          (SELECT COALESCE(SUM(total), 0)::numeric FROM orders) AS revenue_total,
          (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS users_total
      `,
    ),
    dbQuery(
      `
        SELECT
          day::date AS bucket,
          COALESCE((
            SELECT SUM(total)
            FROM orders
            WHERE created_at >= day AND created_at < day + INTERVAL '1 day'
          ), 0)::numeric AS revenue,
          COALESCE((
            SELECT COUNT(*)
            FROM orders
            WHERE created_at >= day AND created_at < day + INTERVAL '1 day'
          ), 0)::int AS orders,
          COALESCE((
            SELECT COUNT(*)
            FROM users
            WHERE role = 'customer' AND created_at >= day AND created_at < day + INTERVAL '1 day'
          ), 0)::int AS users
        FROM generate_series(CURRENT_DATE - INTERVAL '6 day', CURRENT_DATE, INTERVAL '1 day') AS day
        ORDER BY bucket ASC
      `,
    ),
  ]);

  const summary = summaryResult.rows[0] ?? {};
  const history = historyResult.rows.map((row) => ({
    label: formatShortDate(row.bucket),
    revenue: Math.round(Number(row.revenue || 0)),
    orders: Number(row.orders || 0),
    users: Number(row.users || 0),
  }));

  const revenueTotal = Math.round(Number(summary.revenue_total || 0));
  const usersTotal = Number(summary.users_total || 0);
  const ordersTotal = Number(summary.orders_total || 0);
  const pageViewsTotal = estimatePageViews(ordersTotal, usersTotal, 3200);

  const revenueChange = calculatePercentageChange(summary.revenue_current, summary.revenue_previous);
  const usersChange = calculatePercentageChange(summary.users_current, summary.users_previous);
  const ordersChange = calculatePercentageChange(summary.orders_current, summary.orders_previous);
  const pageViewsChange = calculatePercentageChange(
    estimatePageViews(summary.orders_current, summary.users_current, 900),
    estimatePageViews(summary.orders_previous, summary.users_previous, 900),
  );

  const kpis = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: revenueTotal,
      unit: 'currency',
      changePct: revenueChange,
      trend: inferTrend(revenueChange),
      history: history.map((point) => ({ label: point.label, value: point.revenue })),
      description: 'Venit total cumulat din comenzi',
    },
    {
      id: 'users',
      label: 'Active Users',
      value: usersTotal,
      unit: 'number',
      changePct: usersChange,
      trend: inferTrend(usersChange),
      history: history.map((point) => ({ label: point.label, value: point.users })),
      description: 'Conturi client inregistrate in platforma',
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: ordersTotal,
      unit: 'number',
      changePct: ordersChange,
      trend: inferTrend(ordersChange),
      history: history.map((point) => ({ label: point.label, value: point.orders })),
      description: 'Comenzi plasate in sistem',
    },
    {
      id: 'pageViews',
      label: 'Page Views',
      value: pageViewsTotal,
      unit: 'number',
      changePct: pageViewsChange,
      trend: inferTrend(pageViewsChange),
      history: history.map((point, index) => ({
        label: point.label,
        value: estimatePageViews(point.orders, point.users, 90 + index * 8),
      })),
      description: 'Estimare temporara pana la introducerea trackingului dedicat',
      isMock: true,
    },
  ];

  return {
    stats: [
      { label: 'Total Revenue', value: formatMoney(revenueTotal), detail: 'venit cumulat din comenzi' },
      { label: 'Active Users', value: `${usersTotal}`, detail: 'conturi client in platforma' },
      { label: 'Total Orders', value: `${ordersTotal}`, detail: 'comenzi inregistrate in sistem' },
      { label: 'Page Views', value: `${pageViewsTotal}`, detail: 'estimare temporara bazata pe activitate' },
    ],
    kpis,
  };
}

async function getDashboardSales(range = '7') {
  const allowedRange = range === '1' ? 1 : range === '30' ? 30 : 7;
  const rowsResult =
    range === 'total'
      ? await dbQuery(
          `
            SELECT created_at, total
            FROM orders
            ORDER BY created_at ASC
          `,
        )
      : await dbQuery(
          `
            SELECT created_at, total
            FROM orders
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
            ORDER BY created_at ASC
          `,
          [allowedRange],
        );
  const { rows } = rowsResult;

  const formatter = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short' });
  const buckets = new Map();

  if (range === 'total' && rows.length) {
    const firstDate = new Date(rows[0].created_at);
    firstDate.setHours(0, 0, 0, 0);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    for (const cursor = new Date(firstDate); cursor <= currentDate; cursor.setDate(cursor.getDate() + 1)) {
      buckets.set(formatter.format(cursor), { revenue: 0, orders: 0 });
    }
  } else {
    for (let offset = allowedRange - 1; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      buckets.set(formatter.format(date), { revenue: 0, orders: 0 });
    }
  }

  for (const row of rows) {
    const label = formatter.format(new Date(row.created_at));
    const current = buckets.get(label) || { revenue: 0, orders: 0 };
    current.revenue += Number(row.total || 0);
    current.orders += 1;
    buckets.set(label, current);
  }

  return {
    range: range === 'total' ? 'total' : allowedRange,
    points: Array.from(buckets.entries()).map(([label, value]) => ({
      label,
      value: Math.round(value.revenue),
      orders: value.orders,
    })),
  };
}

async function getDashboardRecentOrders() {
  const { rows } = await dbQuery(
    `
      SELECT id, order_number, status, payment_status, total, customer_name, customer_email, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 8
    `,
  );

  return {
    orders: rows.map((row) => ({
      id: row.id,
      code: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      total: Number(row.total),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      createdAt: row.created_at,
    })),
  };
}

async function getDashboardTopProducts(range = '30') {
  const allowedRange = range === '1' ? 1 : range === '7' ? 7 : 30;
  const { rows } =
    range === 'total'
      ? await dbQuery(
          `
            SELECT oi.product_name, COALESCE(SUM(oi.quantity), 0)::int AS quantity
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            GROUP BY oi.product_name
            ORDER BY quantity DESC, oi.product_name ASC
            LIMIT 6
          `,
        )
      : await dbQuery(
          `
            SELECT oi.product_name, COALESCE(SUM(oi.quantity), 0)::int AS quantity
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.created_at >= NOW() - ($1::int * INTERVAL '1 day')
            GROUP BY oi.product_name
            ORDER BY quantity DESC, oi.product_name ASC
            LIMIT 6
          `,
          [allowedRange],
        );

  return {
    range: range === 'total' ? 'total' : allowedRange,
    products: rows.map((row) => ({
      label: row.product_name,
      value: Number(row.quantity),
    })),
  };
}

function escapeCsv(value) {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function createSimplePdf(lines) {
  const escapedLines = lines.map((line) => String(line).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
  const content = ['BT', '/F1 12 Tf', '50 780 Td'];

  escapedLines.forEach((line, index) => {
    if (index > 0) {
      content.push('0 -18 Td');
    }
    content.push(`(${line}) Tj`);
  });

  content.push('ET');
  const streamText = content.join('\n');
  const streamLength = Buffer.byteLength(streamText, 'utf8');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${streamLength} >> stream\n${streamText}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

async function exportDashboardReport(type = 'csv', range = '1') {
  const safeRange = range === '1' || range === '7' || range === '30' || range === 'total' ? range : '1';
  const [statsPayload, salesPayload, ordersPayload, productsPayload] = await Promise.all([
    getDashboardStats(),
    getDashboardSales(safeRange),
    getDashboardRecentOrders(),
    getDashboardTopProducts(safeRange),
  ]);

  const statsLines = statsPayload.stats.map((stat) => `${stat.label}: ${stat.value}`);
  const salesLines = salesPayload.points.map((point) => `${point.label}: ${point.value} Lei`);
  const productLines = productsPayload.products.map((product) => `${product.label}: ${product.value} buc`);
  const orderLines = ordersPayload.orders.map((order) => `${order.code} | ${order.customerName} | ${order.status} | ${order.total} Lei`);

  if (type === 'excel') {
    const rows = [
      '<?xml version="1.0"?>',
      '<?mso-application progid="Excel.Sheet"?>',
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
      '<Worksheet ss:Name="Raport"><Table>',
      ...statsPayload.stats.map((stat) => `<Row><Cell><Data ss:Type="String">${stat.label}</Data></Cell><Cell><Data ss:Type="String">${stat.value}</Data></Cell></Row>`),
      '<Row />',
      '<Row><Cell><Data ss:Type="String">Vanzari pe zile</Data></Cell></Row>',
      ...salesPayload.points.map((point) => `<Row><Cell><Data ss:Type="String">${point.label}</Data></Cell><Cell><Data ss:Type="Number">${point.value}</Data></Cell></Row>`),
      '<Row />',
      '<Row><Cell><Data ss:Type="String">Top produse</Data></Cell></Row>',
      ...productsPayload.products.map((product) => `<Row><Cell><Data ss:Type="String">${product.label}</Data></Cell><Cell><Data ss:Type="Number">${product.value}</Data></Cell></Row>`),
      '</Table></Worksheet></Workbook>',
    ];

    return {
      filename: `dashboard-report-${safeRange === 'total' ? 'total' : `${safeRange}z`}.xls`,
      contentType: 'application/vnd.ms-excel',
      body: Buffer.from(rows.join(''), 'utf8'),
    };
  }

  if (type === 'pdf') {
    const pdfLines = ['Raport Dashboard', '', ...statsLines, '', 'Vanzari 30 zile', ...salesLines, '', 'Top produse', ...productLines, '', 'Comenzi recente', ...orderLines];

    return {
      filename: `dashboard-report-${safeRange === 'total' ? 'total' : `${safeRange}z`}.pdf`,
      contentType: 'application/pdf',
      body: createSimplePdf(pdfLines),
    };
  }

  const csvSections = [
    'Sectiune,Eticheta,Valoare',
    ...statsPayload.stats.map((stat) => [escapeCsv('KPI'), escapeCsv(stat.label), escapeCsv(stat.value)].join(',')),
    ...salesPayload.points.map((point) => [escapeCsv('Vanzari'), escapeCsv(point.label), escapeCsv(point.value)].join(',')),
    ...productsPayload.products.map((product) => [escapeCsv('Top produse'), escapeCsv(product.label), escapeCsv(product.value)].join(',')),
    ...ordersPayload.orders.map((order) => [escapeCsv('Comenzi'), escapeCsv(order.code), escapeCsv(`${order.customerName} | ${order.status} | ${order.total} Lei`)].join(',')),
  ];

  return {
    filename: `dashboard-report-${safeRange === 'total' ? 'total' : `${safeRange}z`}.csv`,
    contentType: 'text/csv; charset=utf-8',
    body: Buffer.from(csvSections.join('\n'), 'utf8'),
  };
}

function getDefaultStoreSettings() {
  return {
    general: {
      storeName: 'Livada Noastra',
      email: env.STORE_EMAIL || 'contact@livadanoastra.local',
      phone: env.STORE_PHONE || '0722000000',
      currency: 'RON',
      logoUrl: '/images/homepage-hero.png',
    },
    shipping: {
      cost: 19,
      freeThreshold: 150,
      enabled: true,
      zones: [
        { id: 'north', name: 'Nord', enabled: true, etaDays: 1, priceModifier: 0 },
        { id: 'south', name: 'Sud', enabled: true, etaDays: 1, priceModifier: 0 },
        { id: 'east', name: 'Est', enabled: true, etaDays: 2, priceModifier: 4 },
        { id: 'west', name: 'Vest', enabled: true, etaDays: 2, priceModifier: 2 },
      ],
    },
    payments: {
      cashOnDelivery: true,
      onlineCard: false,
      bankTransfer: true,
    },
    seo: {
      metaTitle: 'Livada Noastra | Suc de mere natural',
      metaDescription: 'Magazin online cu suc de mere natural, presat la rece, fara zahar adaugat.',
      keywords: 'suc de mere, suc natural, livada, mere romanesti',
    },
    taxes: {
      vatRate: 19,
      includedInPrice: true,
    },
    location: {
      warehouseName: 'Depozit principal Livada Noastra',
      addressLine: 'Strada Merilor 12',
      city: 'Pitesti',
      county: 'Arges',
      postalCode: '110000',
    },
  };
}

function normalizeStoreSettings(input) {
  const defaults = getDefaultStoreSettings();
  const source = input && typeof input === 'object' ? input : {};

  return {
    general: {
      ...defaults.general,
      ...(source.general && typeof source.general === 'object' ? source.general : {}),
      currency: ['RON', 'EUR', 'USD'].includes(source?.general?.currency) ? source.general.currency : defaults.general.currency,
    },
    shipping: {
      ...defaults.shipping,
      ...(source.shipping && typeof source.shipping === 'object' ? source.shipping : {}),
      cost: clampNumber(source?.shipping?.cost, defaults.shipping.cost, 0),
      freeThreshold: clampNumber(source?.shipping?.freeThreshold, defaults.shipping.freeThreshold, 0),
      enabled: Boolean(source?.shipping?.enabled ?? defaults.shipping.enabled),
      zones: normalizeShippingZones(source?.shipping?.zones, defaults.shipping.zones),
    },
    payments: {
      ...defaults.payments,
      ...(source.payments && typeof source.payments === 'object' ? source.payments : {}),
      cashOnDelivery: Boolean(source?.payments?.cashOnDelivery ?? defaults.payments.cashOnDelivery),
      onlineCard: Boolean(source?.payments?.onlineCard ?? defaults.payments.onlineCard),
      bankTransfer: Boolean(source?.payments?.bankTransfer ?? defaults.payments.bankTransfer),
    },
    seo: {
      ...defaults.seo,
      ...(source.seo && typeof source.seo === 'object' ? source.seo : {}),
    },
    taxes: {
      ...defaults.taxes,
      ...(source.taxes && typeof source.taxes === 'object' ? source.taxes : {}),
      vatRate: clampNumber(source?.taxes?.vatRate, defaults.taxes.vatRate, 0, 100),
      includedInPrice: Boolean(source?.taxes?.includedInPrice ?? defaults.taxes.includedInPrice),
    },
    location: {
      ...defaults.location,
      ...(source.location && typeof source.location === 'object' ? source.location : {}),
    },
  };
}

function clampNumber(value, fallback, min, max = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function normalizeShippingZones(input, defaults) {
  if (!Array.isArray(input)) {
    return defaults;
  }

  return input.map((zone, index) => ({
    id: String(zone?.id || defaults[index]?.id || `zone-${index + 1}`),
    name: String(zone?.name || defaults[index]?.name || `Zona ${index + 1}`),
    enabled: Boolean(zone?.enabled ?? defaults[index]?.enabled ?? true),
    etaDays: clampNumber(zone?.etaDays, defaults[index]?.etaDays ?? 1, 1, 10),
    priceModifier: clampNumber(zone?.priceModifier, defaults[index]?.priceModifier ?? 0, 0, 200),
  }));
}

function extractVariantLiters(label) {
  const normalized = String(label || '').toLowerCase().replace(',', '.');
  const litersMatch = normalized.match(/(\d+(?:\.\d+)?)\s*l/);
  if (litersMatch) {
    return Number(litersMatch[1]);
  }

  const mlMatch = normalized.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (mlMatch) {
    return Number(mlMatch[1]) / 1000;
  }

  return 0;
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
  return String(env.APP_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');
}

export {
  initializeDatabase,
  buildSafeUser,
  registerUser,
  loginUser,
  logoutSession,
  getUserFromSession,
  requestPasswordReset,
  resetPassword,
  confirmEmail,
  getHomePageData,
  getCategories,
  getProducts,
  getProductBySlug,
  getAccountOverview,
  getAccountOrders,
  getAccountAddresses,
  createOrder,
  getAdminDashboard,
  getAdminProducts,
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  createAdminCategory,
  getAdminOrders,
  createAdminOrder,
  getAdminOrder,
  updateAdminOrder,
  deleteAdminOrder,
  getAdminCustomers,
  getAdminCustomer,
  createAdminCustomer,
  updateAdminCustomer,
  deleteAdminCustomer,
  getAdminInventory,
  getStoreSettings,
  updateStoreSettings,
  getAdminShippingSettings,
  updateAdminShippingSettings,
  getAdminPaymentsSettings,
  updateAdminPaymentsSettings,
  getAdminAnalytics,
  getDashboardStats,
  getDashboardSales,
  getDashboardRecentOrders,
  getDashboardTopProducts,
  exportDashboardReport,
  getEmailMode,
  setSessionCookie,
  clearSessionCookie,
  isRateLimited,
  getClientIp,
  apiBaseUrl,
};
