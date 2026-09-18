const crypto = require('node:crypto')
const express = require('express')
const { pool } = require('../db')
const { asyncRoute, HttpError, ok } = require('../lib/http')

const router = express.Router()
const emailPattern = /^\S+@\S+\.\S+$/

router.post('/newsletter/subscriptions', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  if (!emailPattern.test(email)) throw new HttpError(422, 'VALIDATION_ERROR', 'Enter a valid email address.')
  await pool.execute(
    `INSERT INTO newsletter_subscribers (id,user_id,email,status,source,consent_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE status=IF(status IN ('bounced','complained','suppressed'),status,'active'),unsubscribed_at=NULL,consent_at=UTC_TIMESTAMP(),user_id=COALESCE(VALUES(user_id),user_id)`,
    [crypto.randomUUID(),req.user?.id || null,email,'active','website'],
  )
  ok(res, { message: 'You are subscribed to The Daily Brief.' })
}))

router.post('/contact', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const message = String(req.body.message || '').trim()
  const subjects = { 'Share a story idea':'story_idea', 'General enquiry':'general', 'Partnerships':'partnerships', 'Corrections and feedback':'corrections', story_idea:'story_idea', general:'general', partnerships:'partnerships', corrections:'corrections' }
  const subject = subjects[req.body.subject]
  if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || !subject || message.length < 10 || message.length > 10000) throw new HttpError(422, 'VALIDATION_ERROR', 'Please complete all contact fields correctly.')
  const id = crypto.randomUUID()
  await pool.execute('INSERT INTO contact_messages (id,user_id,name,email,subject,message) VALUES (?,?,?,?,?,?)', [id,req.user?.id || null,name,email,subject,message])
  res.status(201)
  ok(res, { id, message: 'Thanks—your message has been received.' })
}))

module.exports = router
