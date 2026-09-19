const crypto = require('node:crypto')
const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')
const { asyncRoute, HttpError, ok } = require('../lib/http')
const { COOKIE, createSession, tokenHash, requireAuth } = require('../lib/auth')

const router = express.Router()
const cleanEmail = (value) => String(value || '').trim().toLowerCase()
const publicUser = (user) => ({ id: user.id, name: user.display_name || user.name, email: user.email, roles: Array.isArray(user.roles) ? user.roles : user.roles ? user.roles.split(',') : ['reader'] })

router.post('/register', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = cleanEmail(req.body.email)
  const password = String(req.body.password || '')
  if (name.length < 2 || name.length > 100) throw new HttpError(422, 'VALIDATION_ERROR', 'Display name must be between 2 and 100 characters.')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(422, 'VALIDATION_ERROR', 'Enter a valid email address.')
  if (password.length < 8 || password.length > 200) throw new HttpError(422, 'VALIDATION_ERROR', 'Password must be between 8 and 200 characters.')
  const [existing] = await pool.execute('SELECT id FROM users WHERE email=?', [email])
  if (existing.length) throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists.')
  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 12)
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute('INSERT INTO users (id,email,password_hash,display_name,email_verified_at) VALUES (?,?,?,?,UTC_TIMESTAMP())', [id,email,passwordHash,name])
    await connection.execute("INSERT INTO user_roles (user_id,role_id) SELECT ?,id FROM roles WHERE role_key='reader'", [id])
    await connection.commit()
  } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  const user = { id, email, display_name: name, roles: ['reader'] }
  await createSession(res, user, req)
  ok(res, publicUser(user))
}))

router.post('/login', asyncRoute(async (req, res) => {
  const email = cleanEmail(req.body.email)
  const [rows] = await pool.execute(`SELECT u.id,u.email,u.password_hash,u.display_name,u.status,GROUP_CONCAT(r.role_key) roles
    FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
    WHERE u.email=? AND u.deleted_at IS NULL GROUP BY u.id`, [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) throw new HttpError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.')
  if (user.status !== 'active') throw new HttpError(403, 'ACCOUNT_RESTRICTED', 'This account is not currently available.')
  await pool.execute('UPDATE users SET last_login_at=UTC_TIMESTAMP() WHERE id=?', [user.id])
  await createSession(res, user, req)
  ok(res, publicUser(user))
}))

router.post('/logout', requireAuth, asyncRoute(async (req, res) => {
  await pool.execute('UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP() WHERE id=?', [req.user.sessionId])
  res.clearCookie(COOKIE, { path: '/' })
  ok(res, { success: true })
}))

router.get('/me', asyncRoute(async (req, res) => ok(res, req.user ? publicUser(req.user) : null)))

router.patch('/profile', requireAuth, asyncRoute(async (req,res)=>{
  const name=String(req.body.name||'').trim();const email=cleanEmail(req.body.email)
  if(name.length<2||name.length>100)throw new HttpError(422,'VALIDATION_ERROR','Display name must be between 2 and 100 characters.')
  if(!/^\S+@\S+\.\S+$/.test(email))throw new HttpError(422,'VALIDATION_ERROR','Enter a valid email address.')
  const [existing]=await pool.execute('SELECT id FROM users WHERE email=? AND id<>? AND deleted_at IS NULL',[email,req.user.id])
  if(existing.length)throw new HttpError(409,'EMAIL_EXISTS','An account with this email already exists.')
  const staff=req.user.roles.some(role=>['editor','moderator','admin','super_admin'].includes(role))
  if(staff){await pool.execute('UPDATE users SET display_name=?,email=? WHERE id=?',[name,email,req.user.id]);return ok(res,{id:req.user.id,name,email,roles:req.user.roles,approved:true})}
  await pool.execute("UPDATE account_requests SET status='rejected',reviewed_at=UTC_TIMESTAMP() WHERE user_id=? AND request_type='profile_change' AND status='pending'",[req.user.id])
  const id=crypto.randomUUID();await pool.execute("INSERT INTO account_requests (id,user_id,request_type,proposed_data) VALUES (?,?,'profile_change',?)",[id,req.user.id,JSON.stringify({name,email})])
  ok(res,{id,pending:true,message:'Your profile change was sent to an administrator for approval.'})
}))

router.post('/delete-account-request',requireAuth,asyncRoute(async(req,res)=>{
  if(req.user.roles.some(role=>['admin','super_admin'].includes(role)))throw new HttpError(422,'INVALID_ACTION','Administrator accounts cannot request deletion here.')
  const [found]=await pool.execute("SELECT id FROM account_requests WHERE user_id=? AND request_type='account_deletion' AND status='pending'",[req.user.id])
  if(found[0])return ok(res,{id:found[0].id,pending:true,message:'Your account deletion request is already awaiting approval.'})
  const id=crypto.randomUUID();await pool.execute("INSERT INTO account_requests (id,user_id,request_type) VALUES (?,?,'account_deletion')",[id,req.user.id])
  ok(res,{id,pending:true,message:'Your permanent account deletion request was sent to an administrator.'})
}))

router.patch('/password', requireAuth, asyncRoute(async (req,res)=>{
  const currentPassword=String(req.body.currentPassword||'');const newPassword=String(req.body.newPassword||'')
  if(newPassword.length<8||newPassword.length>200)throw new HttpError(422,'VALIDATION_ERROR','New password must be between 8 and 200 characters.')
  const [rows]=await pool.execute('SELECT password_hash FROM users WHERE id=?',[req.user.id])
  if(!rows[0]||!(await bcrypt.compare(currentPassword,rows[0].password_hash)))throw new HttpError(401,'INVALID_CURRENT_PASSWORD','The current password is incorrect.')
  const passwordHash=await bcrypt.hash(newPassword,12);await pool.execute('UPDATE users SET password_hash=? WHERE id=?',[passwordHash,req.user.id])
  await pool.execute('UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP() WHERE user_id=? AND id<>? AND revoked_at IS NULL',[req.user.id,req.user.sessionId])
  ok(res,{success:true,message:'Password updated successfully.'})
}))

router.post('/forgot-password', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT id FROM users WHERE email=? AND status=\'active\'', [cleanEmail(req.body.email)])
  if (rows[0]) {
    const raw = crypto.randomBytes(32).toString('hex')
    await pool.execute("INSERT INTO account_tokens (id,user_id,token_type,token_hash,expires_at) VALUES (?,?, 'reset_password', ?, DATE_ADD(UTC_TIMESTAMP(),INTERVAL 1 HOUR))", [crypto.randomUUID(),rows[0].id,tokenHash(raw)])
    if (process.env.NODE_ENV !== 'production') console.info(`Development password reset token: ${raw}`)
  }
  ok(res, { message: 'If that account exists, password reset instructions have been prepared.' })
}))

router.post('/reset-password', asyncRoute(async (req, res) => {
  const password = String(req.body.password || '')
  if (password.length < 8 || password.length > 200) throw new HttpError(422, 'VALIDATION_ERROR', 'Password must be between 8 and 200 characters.')
  const [rows] = await pool.execute("SELECT id,user_id FROM account_tokens WHERE token_hash=? AND token_type='reset_password' AND consumed_at IS NULL AND expires_at>UTC_TIMESTAMP()", [tokenHash(String(req.body.token || ''))])
  if (!rows[0]) throw new HttpError(400, 'INVALID_TOKEN', 'This password reset link is invalid or expired.')
  const hash = await bcrypt.hash(password, 12)
  await pool.execute('UPDATE users SET password_hash=? WHERE id=?', [hash, rows[0].user_id])
  await pool.execute('UPDATE account_tokens SET consumed_at=UTC_TIMESTAMP() WHERE id=?', [rows[0].id])
  await pool.execute('UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP() WHERE user_id=? AND revoked_at IS NULL', [rows[0].user_id])
  ok(res, { success: true })
}))

module.exports = router
