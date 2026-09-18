const express = require('express')
const { pool } = require('../db')
const { asyncRoute, HttpError, ok } = require('../lib/http')
const { mapStory, storySelect } = require('../lib/story')

const router = express.Router()
const fromClause = ` FROM stories s JOIN categories c ON c.id=s.category_id JOIN authors a ON a.id=s.author_id`

router.get('/categories', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT id,name,slug,description FROM categories WHERE is_active=TRUE ORDER BY nav_order,name')
  ok(res, rows)
}))

router.get('/authors/:slug', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(`SELECT a.id,a.name,a.slug,a.bio,
    (SELECT COUNT(*) FROM author_followers af WHERE af.author_id=a.id)+a.manual_follower_count followerCount,
    (SELECT COUNT(*) FROM author_likes al WHERE al.author_id=a.id)+a.manual_like_count likeCount,
    ${req.user ? 'EXISTS(SELECT 1 FROM author_followers mine WHERE mine.author_id=a.id AND mine.user_id=?)' : 'FALSE'} followed,
    ${req.user ? 'EXISTS(SELECT 1 FROM author_likes mine_like WHERE mine_like.author_id=a.id AND mine_like.user_id=?)' : 'FALSE'} liked
    FROM authors a WHERE a.slug=? AND a.is_active=TRUE`, req.user ? [req.user.id,req.user.id,req.params.slug] : [req.params.slug])
  if (!rows[0]) throw new HttpError(404, 'AUTHOR_NOT_FOUND', 'Author not found.')
  const [stories] = await pool.execute(`${storySelect} ${fromClause} WHERE a.id=? AND s.status='published' AND s.deleted_at IS NULL AND s.published_at<=UTC_TIMESTAMP() ORDER BY s.published_at DESC`, [rows[0].id])
  ok(res, { ...rows[0], followerCount:Number(rows[0].followerCount), likeCount:Number(rows[0].likeCount), followed:Boolean(rows[0].followed), liked:Boolean(rows[0].liked), stories:stories.map(mapStory) })
}))

router.get('/stories', asyncRoute(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const where = [`s.status='published'`, 's.deleted_at IS NULL', 's.published_at<=UTC_TIMESTAMP()']
  const values = []
  if (req.query.category) { where.push('c.slug=?'); values.push(String(req.query.category).toLowerCase()) }
  if (req.query.author) { where.push('a.slug=?'); values.push(String(req.query.author).toLowerCase()) }
  if (req.query.q) {
    where.push('(s.title LIKE ? OR s.description LIKE ? OR JSON_SEARCH(LOWER(s.body_json), \'one\', ?) IS NOT NULL OR a.name LIKE ? OR c.name LIKE ?)')
    const pattern = `%${String(req.query.q).toLowerCase()}%`
    values.push(pattern, pattern, pattern, pattern, pattern)
  }
  const sort = { shortest: 's.reading_minutes ASC, s.published_at DESC', title: 's.title ASC', az: 's.title ASC', featured: 's.featured DESC, s.published_at DESC' }[req.query.sort] || 's.published_at DESC'
  const [countRows] = await pool.execute(`SELECT COUNT(*) total ${fromClause} WHERE ${where.join(' AND ')}`, values)
  const [rows] = await pool.execute(`${storySelect} ${fromClause} WHERE ${where.join(' AND ')} ORDER BY ${sort} LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit])
  ok(res, rows.map(mapStory), { page, limit, total: Number(countRows[0].total), hasMore: page * limit < countRows[0].total })
}))

router.get('/stories/:slug', asyncRoute(async (req, res) => {
  const savedJoin = req.user ? ', EXISTS(SELECT 1 FROM bookmarks b WHERE b.story_id=s.id AND b.user_id=?) saved' : ', FALSE saved'
  const values = req.user ? [req.user.id, req.params.slug] : [req.params.slug]
  const [rows] = await pool.execute(`${storySelect}${savedJoin} ${fromClause} WHERE s.slug=? AND s.status='published' AND s.deleted_at IS NULL AND s.published_at<=UTC_TIMESTAMP() LIMIT 1`, values)
  if (!rows[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  const story = mapStory(rows[0])
  const [related] = await pool.execute(`${storySelect} ${fromClause} WHERE s.status='published' AND s.id<>? ORDER BY (s.category_id=?) DESC,s.published_at DESC LIMIT 5`, [rows[0].id, rows[0].category_id])
  story.related = related.map(mapStory)
  ok(res, story)
}))

router.get('/trending', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`${storySelect} ${fromClause} WHERE s.status='published' AND s.deleted_at IS NULL ORDER BY s.featured DESC,comment_count DESC,s.published_at DESC LIMIT 20`)
  ok(res, rows.map(mapStory))
}))

router.get('/home', asyncRoute(async (_req, res) => {
  const [sections] = await pool.query('SELECT id,section_key AS `key`,section_type AS type,title,subtitle,settings,position FROM home_sections WHERE is_active=TRUE ORDER BY position')
  for (const section of sections) {
    const [items] = await pool.execute(`${storySelect} ${fromClause} JOIN home_section_items hsi ON hsi.story_id=s.id WHERE hsi.section_id=? AND s.status='published' ORDER BY hsi.position`, [section.id])
    section.stories = items.map(mapStory)
  }
  ok(res, { sections })
}))

router.get('/pages/:slug', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute("SELECT slug,title,body_json AS body,published_at AS publishedAt FROM static_pages WHERE slug=? AND status='published'", [req.params.slug])
  if (!rows[0]) throw new HttpError(404, 'PAGE_NOT_FOUND', 'Page not found.')
  ok(res, rows[0])
}))

module.exports = router
