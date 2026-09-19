const path = require('node:path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const production = process.env.NODE_ENV === 'production'
const configuredFrontendUrls = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean)

const frontendUrls = [...new Set([
  ...configuredFrontendUrls,
  'https://www.worldbriefnet.work',
  'https://worldbriefnet.work',
  ...(!production ? ['http://localhost:5173'] : []),
])]

module.exports = {
  production,
  port: Number(process.env.PORT || 4000),
  frontendUrl: frontendUrls[0],
  frontendUrls,
  jwtSecret: process.env.JWT_SECRET || (production ? '' : 'development-only-secret-change-before-production'),
  sessionDays: Number(process.env.SESSION_DAYS || 30),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'worldbriefnet',
  },
}
