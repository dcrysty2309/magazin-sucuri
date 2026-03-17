import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..', '..', '..');

function readDotEnv() {
  const envPath = resolve(rootDir, '.env');
  const values = {};

  if (!existsSync(envPath)) {
    return values;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    values[key] = rest.join('=').trim();
  }

  return values;
}

const envFile = readDotEnv();

export const env = {
  ...envFile,
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || envFile.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || process.env.API_PORT || envFile.PORT || envFile.API_PORT || 4300),
  DATABASE_URL: process.env.DATABASE_URL || envFile.DATABASE_URL || 'postgresql://magazin:magazin_dev@127.0.0.1:55432/magazin_sucuri',
  APP_BASE_URL: process.env.APP_BASE_URL || envFile.APP_BASE_URL || 'http://localhost:4200',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || envFile.ADMIN_EMAIL || 'admin@livadanoastra.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || envFile.ADMIN_PASSWORD || 'Admin123!',
};
