const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT || '4173', 10),
  host: process.env.HOST || '0.0.0.0',
  isDev: process.env.NODE_ENV !== 'production',
  session: {
    secret: process.env.SESSION_SECRET || 'mm-dev-secret-change-me',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  db: {
    url: process.env.DATABASE_URL || '',
    file: path.join(__dirname, 'data', 'mandala.db'),
  },
  yoycol: {
    apiKey: process.env.YOYCOL_API_KEY || '',
    apiSecret: process.env.YOYCOL_API_SECRET || '',
    baseUrl: process.env.YOYCOL_API_BASE_URL || 'https://www.yoycol.com',
    // Auth header names are configurable per Yoycol's API contract.
    keyHeader: process.env.YOYCOL_KEY_HEADER || 'X-Yoycol-Api-Key',
    secretHeader: process.env.YOYCOL_SECRET_HEADER || 'X-Yoycol-Api-Secret',
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
    secretKey: process.env.PAYMENT_SECRET_KEY || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'hello@mandalamagicbyom.com',
  },
  upload: {
    maxMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '15', 10),
    dir: path.join(__dirname, '..', 'assets', 'uploads'),
  },
  site: {
    url: process.env.SITE_URL || 'http://localhost:4173',
    name: process.env.SITE_NAME || 'Mandala Magic by OM',
  },
};

module.exports = config;
