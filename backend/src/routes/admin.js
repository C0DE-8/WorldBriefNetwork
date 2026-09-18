const express = require('express')
const crypto = require('node:crypto')
const { pool } = require('../db')
const { asyncRoute, HttpError, ok } = require('../lib/http')
const { requireAuth, requireRole } = require('../lib/auth')

const router = express.Router()
router.use(requireAuth, requireRole('editor','moderator','admin','super_admin'))

router.get('/dashboard', asyncRoute(async (_req, res) => {
  const [[stories],[users],[comments],[contacts],[subscribers]] = await Promise.all([
    pool.query('SELECT status,COUNT(*) count FROM stories GROUP BY status'),
    pool.query('SELECT status,COUNT(*) count FROM users GROUP BY status'),
    pool.query('SELECT status,COUNT(*) count FROM comments GROUP BY status'),
    pool.query('SELECT status,COUNT(*) count FROM contact_messages GROUP BY status'),
    pool.query('SELECT status,COUNT(*) count FROM newsletter_subscribers GROUP BY status'),
  ])
  ok(res, { stories,users,comments,contacts,subscribers })
}))

router.get('/stories', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT s.id,s.slug,s.title,s.status,s.published_at AS publishedAt,s.updated_at AS updatedAt,c.name category,a.name author FROM stories s JOIN categories c ON c.id=s.category_id JOIN authors a ON a.id=s.author_id WHERE s.deleted_at IS NULL ORDER BY s.updated_at DESC')
  ok(res, rows)
}))

router.patch('/stories/:id/status', asyncRoute(async (req, res) => {
  const allowed = ['draft','in_review','approved','scheduled','published','unpublished','archived']
  if (!allowed.includes(req.body.status)) throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid story status.')
  const [before] = await pool.execute('SELECT status FROM stories WHERE id=?', [req.params.id])
  if (!before[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  await pool.execute('UPDATE stories SET status=?,published_at=IF(?=\'published\',COALESCE(published_at,UTC_TIMESTAMP()),published_at),updated_by=? WHERE id=?', [req.body.status,req.body.status,req.user.id,req.params.id])
  await pool.execute('INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id,before_data,after_data) VALUES (?,\'story.status_changed\',\'story\',?,?,?)', [req.user.id,req.params.id,JSON.stringify(before[0]),JSON.stringify({ status:req.body.status })])
  ok(res, { id:req.params.id,status:req.body.status })
}))

router.get('/contacts', asyncRoute(async (_req, res) => { const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200'); ok(res, rows) }))
router.get('/comments', asyncRoute(async (_req, res) => { const [rows] = await pool.query('SELECT cm.*,s.title story_title FROM comments cm JOIN stories s ON s.id=cm.story_id ORDER BY cm.created_at DESC LIMIT 200'); ok(res, rows) }))

router.patch('/contacts/:id/status', asyncRoute(async (req, res) => {
  if (!['new','in_progress','resolved','spam'].includes(req.body.status)) throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid contact status.')
  await pool.execute('UPDATE contact_messages SET status=?,assigned_to=? WHERE id=?', [req.body.status,req.user.id,req.params.id])
  await pool.execute('INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id,after_data) VALUES (?,\'contact.status_changed\',\'contact_message\',?,?)', [req.user.id,req.params.id,JSON.stringify({ status:req.body.status })])
  ok(res, { id:req.params.id,status:req.body.status })
}))

router.patch('/comments/:id/status', asyncRoute(async (req, res) => {
  if (!['pending','approved','hidden','spam','deleted'].includes(req.body.status)) throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid comment status.')
  await pool.execute('UPDATE comments SET status=? WHERE id=?', [req.body.status,req.params.id])
  await pool.execute('INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id,after_data) VALUES (?,\'comment.status_changed\',\'comment\',?,?)', [req.user.id,req.params.id,JSON.stringify({ status:req.body.status })])
  ok(res, { id:req.params.id,status:req.body.status })
}))

router.get('/users', requireRole('admin','super_admin'), asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`SELECT u.id,u.email,u.display_name AS name,u.status,u.email_verified_at AS emailVerifiedAt,u.created_at AS createdAt,GROUP_CONCAT(r.role_key) roles
    FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
    WHERE u.email NOT LIKE '%@worldbrief.local' GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`)
  ok(res, rows.map((row) => ({ ...row, roles: row.roles ? row.roles.split(',') : [] })))
}))

router.patch('/users/:id/status', requireRole('admin','super_admin'), asyncRoute(async (req, res) => {
  if (!['active','suspended','banned'].includes(req.body.status)) throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid user status.')
  if (req.params.id === req.user.id && req.body.status !== 'active') throw new HttpError(422, 'INVALID_ACTION', 'You cannot restrict your own account.')
  await pool.execute('UPDATE users SET status=? WHERE id=?', [req.body.status,req.params.id])
  await pool.execute('INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id,after_data) VALUES (?,\'user.status_changed\',\'user\',?,?)', [req.user.id,req.params.id,JSON.stringify({ status:req.body.status })])
  ok(res, { id:req.params.id,status:req.body.status })
}))

module.exports = router
