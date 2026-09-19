const express = require('express')
const path = require('node:path')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const { rateLimit } = require('express-rate-limit')
const config = require('./src/config')
const { pool } = require('./src/db')
const { optionalAuth } = require('./src/lib/auth')
const contentRoutes = require('./src/routes/content')
const authRoutes = require('./src/routes/auth')
const engagementRoutes = require('./src/routes/engagement')
const formRoutes = require('./src/routes/forms')
const adminRoutes = require('./src/routes/admin')

if (!config.jwtSecret) throw new Error('JWT_SECRET is required in production')

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.frontendUrls.includes(origin.replace(/\/$/, ''))) return callback(null, true)
    const error = new Error('This website origin is not allowed to access the API.')
    error.status = 403
    return callback(error)
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: config.production ? '7d' : 0, immutable: config.production }))
app.use(rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use(optionalAuth)

app.get('/api/v1/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ data: { status: 'ok', database: 'connected' } }) }
  catch { res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database connection is unavailable.' } }) }
})
const sensitiveAuthLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 50 })
app.use(['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/forgot-password'], sensitiveAuthLimiter)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1', engagementRoutes, formRoutes, contentRoutes)
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }))
app.use((error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: { code: 'IMAGE_TOO_LARGE', message: 'Images must be 5 MB or smaller.' } })
  if (error.code === 'INVALID_IMAGE_TYPE') return res.status(422).json({ error: { code: error.code, message: error.message } })
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: { code: 'CONFLICT', message: 'That record already exists.' } })
  const status = error.status || 500
  if (status === 500) console.error(error)
  res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: status === 500 ? 'An unexpected error occurred.' : error.message, fields: error.fields } })
})

if (require.main === module) app.listen(config.port, () => console.log(`WorldBriefNetwork API listening on http://localhost:${config.port}`))
module.exports = app
