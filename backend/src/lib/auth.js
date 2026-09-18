const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { pool } = require('../db')
const { HttpError } = require('./http')

const COOKIE = 'wbn_session'
const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex')

async function createSession(res, user, req) {
  const sessionId = crypto.randomUUID()
  const token = jwt.sign({ sub: user.id, sid: sessionId }, config.jwtSecret, { expiresIn: `${config.sessionDays}d` })
  await pool.execute(
    `INSERT INTO auth_sessions (id, user_id, token_hash, user_agent, ip_hash, expires_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))`,
    [sessionId, user.id, tokenHash(token), req.get('user-agent') || null, tokenHash(req.ip || ''), config.sessionDays],
  )
  res.cookie(COOKIE, token, { httpOnly: true, secure: config.production, sameSite: 'lax', maxAge: config.sessionDays * 86400000, path: '/' })
}

async function resolveUser(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return null
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.display_name AS name, u.status, u.email_verified_at AS emailVerifiedAt,
              GROUP_CONCAT(r.role_key) AS roles
       FROM auth_sessions s JOIN users u ON u.id=s.user_id
       LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
       WHERE s.id=? AND s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP()
       GROUP BY u.id`,
      [payload.sid, tokenHash(token)],
    )
    if (!rows[0] || rows[0].status !== 'active') return null
    return { ...rows[0], roles: rows[0].roles ? rows[0].roles.split(',') : ['reader'], sessionId: payload.sid }
  } catch {
    return null
  }
}

async function optionalAuth(req, _res, next) {
  req.user = await resolveUser(req)
  next()
}

function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in to continue.'))
  next()
}

function requireRole(...roles) {
  return (req, _res, next) => req.user?.roles.some((role) => roles.includes(role))
    ? next()
    : next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'))
}

module.exports = { COOKIE, createSession, tokenHash, optionalAuth, requireAuth, requireRole }
