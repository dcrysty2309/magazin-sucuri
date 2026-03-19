import { DataTypes } from 'sequelize';

import { sequelize } from '../config/database.mjs';

export const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    role: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'customer' },
    firstName: { type: DataTypes.TEXT, allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.TEXT, allowNull: false, field: 'last_name' },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    phone: { type: DataTypes.TEXT, allowNull: false },
    passwordHash: { type: DataTypes.TEXT, allowNull: false, field: 'password_hash' },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, field: 'email_verified' },
    emailVerificationToken: { type: DataTypes.TEXT, field: 'email_verification_token' },
    emailVerificationExpiresAt: { type: DataTypes.DATE, field: 'email_verification_expires_at' },
    passwordResetToken: { type: DataTypes.TEXT, field: 'password_reset_token' },
    passwordResetExpiresAt: { type: DataTypes.DATE, field: 'password_reset_expires_at' },
    failedLoginAttempts: { type: DataTypes.INTEGER, allowNull: false, field: 'failed_login_attempts' },
    lockedUntil: { type: DataTypes.DATE, field: 'locked_until' },
    gdprConsentAt: { type: DataTypes.DATE, allowNull: false, field: 'gdpr_consent_at' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
  },
  { tableName: 'users', timestamps: false },
);

export const Session = sequelize.define(
  'Session',
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    userId: { type: DataTypes.TEXT, allowNull: false, field: 'user_id' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    userAgent: { type: DataTypes.TEXT, field: 'user_agent' },
    ipAddress: { type: DataTypes.TEXT, field: 'ip_address' },
  },
  { tableName: 'sessions', timestamps: false },
);

export const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    imageUrl: { type: DataTypes.TEXT, field: 'image_url' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, field: 'sort_order' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
  },
  { tableName: 'categories', timestamps: false },
);

export const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    categoryId: { type: DataTypes.TEXT, allowNull: false, field: 'category_id' },
    slug: { type: DataTypes.TEXT, allowNull: false, unique: true },
    sku: { type: DataTypes.TEXT, allowNull: false, unique: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    subtitle: { type: DataTypes.TEXT, allowNull: false },
    shortDescription: { type: DataTypes.TEXT, allowNull: false, field: 'short_description' },
    description: { type: DataTypes.TEXT, allowNull: false },
    volumeLabel: { type: DataTypes.TEXT, allowNull: false, field: 'volume_label' },
    basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'base_price' },
    compareAtPrice: { type: DataTypes.DECIMAL(10, 2), field: 'compare_at_price' },
    badge: { type: DataTypes.TEXT },
    accent: { type: DataTypes.TEXT, allowNull: false },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, field: 'is_featured' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, field: 'is_active' },
    stockQuantity: { type: DataTypes.INTEGER, allowNull: false, field: 'stock_quantity' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
  },
  { tableName: 'products', timestamps: false },
);

export const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    userId: { type: DataTypes.TEXT, field: 'user_id' },
    orderNumber: { type: DataTypes.TEXT, allowNull: false, field: 'order_number' },
    status: { type: DataTypes.TEXT, allowNull: false },
    paymentStatus: { type: DataTypes.TEXT, allowNull: false, field: 'payment_status' },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    customerName: { type: DataTypes.TEXT, allowNull: false, field: 'customer_name' },
    customerEmail: { type: DataTypes.TEXT, allowNull: false, field: 'customer_email' },
    customerPhone: { type: DataTypes.TEXT, allowNull: false, field: 'customer_phone' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
  },
  { tableName: 'orders', timestamps: false },
);

export const StoreSetting = sequelize.define(
  'StoreSetting',
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    settings: { type: DataTypes.JSONB, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
  },
  { tableName: 'store_settings', timestamps: false },
);
