const crypto = require('node:crypto')
const express = require('express')
const { pool } = require('../db')
const { asyncRoute, HttpError, ok } = require('../lib/http')
const { requireAuth } = require('../lib/auth')
const { mapStory, storySelect } = require('../lib/story')

const router = express.Router()
const fromClause = ' FROM stories s JOIN categories c ON c.id=s.category_id JOIN authors a ON a.id=s.author_id'

router.get('/me/bookmarks', requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(`${storySelect} ${fromClause} JOIN bookmarks b ON b.story_id=s.id WHERE b.user_id=? AND s.status='published' ORDER BY b.created_at DESC`, [req.user.id])
  ok(res, rows.map(mapStory))
}))

router.put('/me/bookmarks/:storyId', requireAuth, asyncRoute(async (req, res) => {
  const [stories] = await pool.execute('SELECT id FROM stories WHERE id=? OR slug=?', [req.params.storyId,req.params.storyId])
  if (!stories[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  await pool.execute('INSERT IGNORE INTO bookmarks (user_id,story_id) VALUES (?,?)', [req.user.id,stories[0].id])
  ok(res, { saved: true })
}))

router.delete('/me/bookmarks/:storyId', requireAuth, asyncRoute(async (req, res) => {
  await pool.execute('DELETE b FROM bookmarks b JOIN stories s ON s.id=b.story_id WHERE b.user_id=? AND (s.id=? OR s.slug=?)', [req.user.id,req.params.storyId,req.params.storyId])
  ok(res, { saved: false })
}))

router.get('/stories/:storyId/comments', asyncRoute(async (req, res) => {
  const [stories] = await pool.execute('SELECT id FROM stories WHERE id=? OR slug=?', [req.params.storyId,req.params.storyId])
  if (!stories[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  const order = req.query.sort === 'latest' ? 'cm.created_at DESC' : 'likes DESC,cm.created_at DESC'
  const [rows] = await pool.execute(
    `SELECT cm.id,cm.parent_id AS parentId,cm.user_id AS authorId,cm.author_name_snapshot AS author,cm.body AS text,cm.created_at AS createdAt,
       COUNT(cr.user_id) likes, EXISTS(SELECT 1 FROM comment_reactions mine WHERE mine.comment_id=cm.id AND mine.user_id=?) liked
     FROM comments cm LEFT JOIN comment_reactions cr ON cr.comment_id=cm.id
     WHERE cm.story_id=? AND cm.status='approved' GROUP BY cm.id ORDER BY ${order}`,
    [req.user?.id || '',stories[0].id],
  )
  const top = rows.filter((row) => !row.parentId).map((row) => ({ ...row, likes: Number(row.likes), liked: Boolean(row.liked), replies: [] }))
  const byId = Object.fromEntries(top.map((row) => [row.id,row]))
  rows.filter((row) => row.parentId).forEach((row) => byId[row.parentId]?.replies.push({ ...row, likes: Number(row.likes), liked: Boolean(row.liked) }))
  ok(res, top)
}))

router.post('/stories/:storyId/comments', requireAuth, asyncRoute(async (req, res) => {
  const body = String(req.body.text || '').trim()
  if (!body || body.length > 1000) throw new HttpError(422, 'VALIDATION_ERROR', 'Comment must be between 1 and 1,000 characters.')
  const [stories] = await pool.execute("SELECT id FROM stories WHERE (id=? OR slug=?) AND status='published' AND comments_enabled=TRUE", [req.params.storyId,req.params.storyId])
  if (!stories[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found or comments are closed.')
  const id = crypto.randomUUID()
  await pool.execute('INSERT INTO comments (id,story_id,user_id,author_name_snapshot,body,status) VALUES (?,?,?,?,?,\'approved\')', [id,stories[0].id,req.user.id,req.user.name,body])
  ok(res, { id, authorId: req.user.id, author: req.user.name, text: body, createdAt: new Date().toISOString(), likes: 0, liked: false, replies: [] })
}))

router.post('/comments/:id/replies', requireAuth, asyncRoute(async (req, res) => {
  const text = String(req.body.text || '').trim()
  if (!text || text.length > 500) throw new HttpError(422, 'VALIDATION_ERROR', 'Reply must be between 1 and 500 characters.')
  const [parents] = await pool.execute("SELECT id,story_id,parent_id FROM comments WHERE id=? AND status='approved'", [req.params.id])
  if (!parents[0] || parents[0].parent_id) throw new HttpError(404, 'COMMENT_NOT_FOUND', 'Comment not found.')
  const id = crypto.randomUUID()
  await pool.execute('INSERT INTO comments (id,story_id,user_id,author_name_snapshot,parent_id,body,status) VALUES (?,?,?,?,?,?,\'approved\')', [id,parents[0].story_id,req.user.id,req.user.name,req.params.id,text])
  ok(res, { id, authorId: req.user.id, author: req.user.name, text, createdAt: new Date().toISOString(), likes: 0 })
}))

router.put('/comments/:id/reaction', requireAuth, asyncRoute(async (req, res) => {
  await pool.execute('INSERT IGNORE INTO comment_reactions (comment_id,user_id,reaction_type) VALUES (?,?,\'like\')', [req.params.id,req.user.id])
  ok(res, { liked: true })
}))

router.delete('/comments/:id/reaction', requireAuth, asyncRoute(async (req, res) => {
  await pool.execute('DELETE FROM comment_reactions WHERE comment_id=? AND user_id=? AND reaction_type=\'like\'', [req.params.id,req.user.id])
  ok(res, { liked: false })
}))

module.exports = router
