import { createApp } from './src/app.mjs';
import { env } from './src/config/env.mjs';
import { getEmailMode, initializePlatform } from './src/services/platform.service.mjs';

await initializePlatform();

const app = createApp();

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Auth API listening on http://0.0.0.0:${env.PORT}`);
  console.log(`Email mode: ${getEmailMode()}`);
  console.log('Database mode: PostgreSQL + Sequelize');
});
