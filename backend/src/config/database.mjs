import { Sequelize } from 'sequelize';

import { env } from './env.mjs';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    min: 1,
    max: 1,
    idle: 60_000,
    acquire: 30_000,
    evict: 10_000,
  },
  dialectOptions: {
    keepAlive: true,
  },
});
