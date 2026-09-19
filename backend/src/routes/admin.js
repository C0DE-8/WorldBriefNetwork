const express = require('express')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const multer = require('multer')
const { pool } = require('../db')
const { asyncRoute, HttpError, ok } = require('../lib/http')
const { requireAuth, requireRole } = require('../lib/auth')

const router = express.Router()
router.use(requireAuth, requireRole('editor','moderator','admin','super_admin'))

const editorialRoles = requireRole('editor','admin','super_admin')
const storyStatuses = ['draft','in_review','approved','scheduled','published','unpublished','archived']
const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const uploadDirectory = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(uploadDirectory, { recursive: true })
const extensions = { 'image/jpeg':'.jpg', 'image/png':'.png', 'image/webp':'.webp', 'image/gif':'.gif' }
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensions[file.mimetype] || ''}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => extensions[file.mimetype] ? callback(null, true) : callback(Object.assign(new Error('Upload a JPEG, PNG, WebP, or GIF image.'), { code:'INVALID_IMAGE_TYPE' })),
})

function storyInput(body, partial = false) {
  const fields = {}
  const required = (key, value) => {
    if (!partial && !value) throw new HttpError(422, 'VALIDATION_ERROR', `${key} is required.`)
    if (value !== undefined) fields[key] = value
  }
  required('title', body.title === undefined ? undefined : String(body.title).trim())
  required('description', body.description === undefined ? undefined : String(body.description).trim())
  required('image_url', body.imageUrl === undefined ? undefined : String(body.imageUrl).trim())
  required('category_id', body.categoryId)
  required('author_id', body.authorId)
  if (fields.title && (fields.title.length < 5 || fields.title.length > 300)) throw new HttpError(422, 'VALIDATION_ERROR', 'Title must be between 5 and 300 characters.')
  if (fields.description && fields.description.length > 5000) throw new HttpError(422, 'VALIDATION_ERROR', 'Description is too long.')
  if (body.slug !== undefined || (!partial && fields.title)) fields.slug = slugify(body.slug || fields.title)
  if (fields.slug && (fields.slug.length < 3 || fields.slug.length > 220)) throw new HttpError(422, 'VALIDATION_ERROR', 'Enter a valid story slug.')
  if (body.body !== undefined) {
    const paragraphs = Array.isArray(body.body) ? body.body : String(body.body).split(/\n\s*\n/)
    fields.body_json = JSON.stringify(paragraphs.map((item) => String(item).trim()).filter(Boolean))
  } else if (!partial) fields.body_json = JSON.stringify([])
  const simple = { imageCaption:'image_caption', imageCredit:'image_credit', location:'location', seoTitle:'seo_title', seoDescription:'seo_description' }
  for (const [input, column] of Object.entries(simple)) if (body[input] !== undefined) fields[column] = String(body[input] || '').trim() || null
  if (body.readingMinutes !== undefined) fields.reading_minutes = Math.min(Math.max(Number(body.readingMinutes) || 1, 1), 120)
  if (body.status !== undefined) {
    if (!storyStatuses.includes(body.status)) throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid story status.')
    fields.status = body.status
  } else if (!partial) fields.status = 'draft'
  if (body.featured !== undefined) fields.featured = Boolean(body.featured)
  if (body.commentsEnabled !== undefined) fields.comments_enabled = Boolean(body.commentsEnabled)
  if (body.publishedAt !== undefined) fields.published_at = body.publishedAt || null
  if (fields.status === 'published' && !fields.published_at) fields.published_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
  return fields
}

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

router.get('/account-requests',requireRole('admin','super_admin'),asyncRoute(async(_req,res)=>{const [rows]=await pool.query(`SELECT ar.id,ar.request_type AS requestType,ar.proposed_data AS proposedData,ar.status,ar.created_at AS createdAt,u.id userId,u.display_name userName,u.email FROM account_requests ar JOIN users u ON u.id=ar.user_id WHERE ar.status='pending' ORDER BY ar.created_at`);ok(res,rows)}))

router.post('/account-requests/:id/approve',requireRole('admin','super_admin'),asyncRoute(async(req,res)=>{const [rows]=await pool.execute("SELECT ar.*,u.email current_email FROM account_requests ar JOIN users u ON u.id=ar.user_id WHERE ar.id=? AND ar.status='pending'",[req.params.id]);const request=rows[0];if(!request)throw new HttpError(404,'REQUEST_NOT_FOUND','Pending request not found.');if(request.request_type==='account_deletion'){if(request.user_id===req.user.id)throw new HttpError(422,'INVALID_ACTION','You cannot delete your own administrator account.');await pool.execute('DELETE FROM users WHERE id=?',[request.user_id]);return ok(res,{approved:true,deleted:true})}let proposed=request.proposed_data;if(typeof proposed==='string')proposed=JSON.parse(proposed);const [existing]=await pool.execute('SELECT id FROM users WHERE email=? AND id<>? AND deleted_at IS NULL',[proposed.email,request.user_id]);if(existing.length)throw new HttpError(409,'EMAIL_EXISTS','That requested email is now in use.');await pool.execute('UPDATE users SET display_name=?,email=? WHERE id=?',[proposed.name,proposed.email,request.user_id]);await pool.execute("UPDATE account_requests SET status='approved',reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?",[req.user.id,request.id]);ok(res,{approved:true})}))

router.post('/account-requests/:id/reject',requireRole('admin','super_admin'),asyncRoute(async(req,res)=>{const [result]=await pool.execute("UPDATE account_requests SET status='rejected',reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE id=? AND status='pending'",[req.user.id,req.params.id]);if(!result.affectedRows)throw new HttpError(404,'REQUEST_NOT_FOUND','Pending request not found.');ok(res,{rejected:true})}))

router.get('/stories', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT s.id,s.slug,s.title,s.status,s.published_at AS publishedAt,s.updated_at AS updatedAt,c.name category,a.name author FROM stories s JOIN categories c ON c.id=s.category_id JOIN authors a ON a.id=s.author_id WHERE s.deleted_at IS NULL ORDER BY s.updated_at DESC')
  ok(res, rows)
}))

router.get('/story-options', editorialRoles, asyncRoute(async (_req, res) => {
  const [[categories],[authors]] = await Promise.all([
    pool.query('SELECT id,name,slug FROM categories WHERE is_active=TRUE ORDER BY nav_order,name'),
    pool.query('SELECT id,name,slug FROM authors WHERE is_active=TRUE ORDER BY name'),
  ])
  ok(res, { categories, authors, statuses: storyStatuses })
}))

router.get('/authors', editorialRoles, asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`SELECT a.id,a.name,a.slug,a.bio,a.is_active AS isActive,
    a.manual_like_count AS manualLikeCount,a.manual_follower_count AS manualFollowerCount,
    COUNT(DISTINCT af.user_id)+a.manual_follower_count followerCount,COUNT(DISTINCT al.user_id)+a.manual_like_count likeCount
    FROM authors a LEFT JOIN author_followers af ON af.author_id=a.id LEFT JOIN author_likes al ON al.author_id=a.id
    GROUP BY a.id ORDER BY a.name`)
  ok(res, rows.map(row=>({...row,isActive:Boolean(row.isActive),followerCount:Number(row.followerCount),likeCount:Number(row.likeCount),manualLikeCount:Number(row.manualLikeCount),manualFollowerCount:Number(row.manualFollowerCount)})))
}))

router.post('/authors', editorialRoles, asyncRoute(async (req, res) => {
  const name=String(req.body.name||'').trim();const slug=slugify(req.body.slug||name);const bio=String(req.body.bio||'').trim()||null;const manualLikeCount=Math.max(0,Number(req.body.manualLikeCount)||0);const manualFollowerCount=Math.max(0,Number(req.body.manualFollowerCount)||0)
  if(name.length<2||name.length>120||slug.length<2)throw new HttpError(422,'VALIDATION_ERROR','Enter a valid author name and slug.')
  const id=crypto.randomUUID();await pool.execute('INSERT INTO authors (id,name,slug,bio,is_active,manual_like_count,manual_follower_count) VALUES (?,?,?,?,TRUE,?,?)',[id,name,slug,bio,manualLikeCount,manualFollowerCount])
  res.status(201);ok(res,{id,name,slug,bio,isActive:true,followerCount:manualFollowerCount,likeCount:manualLikeCount,manualLikeCount,manualFollowerCount})
}))

router.put('/authors/:id', editorialRoles, asyncRoute(async (req,res)=>{
  const name=String(req.body.name||'').trim();const slug=slugify(req.body.slug||name);const bio=String(req.body.bio||'').trim()||null;const isActive=req.body.isActive!==false;const manualLikeCount=Math.max(0,Number(req.body.manualLikeCount)||0);const manualFollowerCount=Math.max(0,Number(req.body.manualFollowerCount)||0)
  if(name.length<2||name.length>120||slug.length<2)throw new HttpError(422,'VALIDATION_ERROR','Enter a valid author name and slug.')
  const [result]=await pool.execute('UPDATE authors SET name=?,slug=?,bio=?,is_active=?,manual_like_count=?,manual_follower_count=? WHERE id=?',[name,slug,bio,isActive,manualLikeCount,manualFollowerCount,req.params.id])
  if(!result.affectedRows)throw new HttpError(404,'AUTHOR_NOT_FOUND','Author not found.')
  ok(res,{id:req.params.id,name,slug,bio,isActive,manualLikeCount,manualFollowerCount})
}))

router.delete('/authors/:id', editorialRoles, asyncRoute(async (req,res)=>{
  const [[usage]]=await pool.execute('SELECT COUNT(*) count FROM stories WHERE author_id=? AND deleted_at IS NULL',[req.params.id])
  if(Number(usage.count)>0)throw new HttpError(409,'AUTHOR_IN_USE','Authors with stories cannot be deleted. Deactivate the author instead.')
  const [result]=await pool.execute('DELETE FROM authors WHERE id=?',[req.params.id]);if(!result.affectedRows)throw new HttpError(404,'AUTHOR_NOT_FOUND','Author not found.')
  ok(res,{deleted:true})
}))

router.post('/uploads', editorialRoles, upload.single('image'), (req, res, next) => {
  if (!req.file) return next(new HttpError(422, 'IMAGE_REQUIRED', 'Choose an image to upload.'))
  ok(res, { url:`${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`, filename:req.file.filename, size:req.file.size })
})

router.get('/stories/:id', editorialRoles, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(`SELECT id,slug,title,description,body_json AS body,image_url AS imageUrl,image_caption AS imageCaption,
    image_credit AS imageCredit,category_id AS categoryId,author_id AS authorId,location,reading_minutes AS readingMinutes,status,
    featured,comments_enabled AS commentsEnabled,seo_title AS seoTitle,seo_description AS seoDescription,published_at AS publishedAt
    FROM stories WHERE id=? AND deleted_at IS NULL`, [req.params.id])
  if (!rows[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  const story = rows[0]
  if (typeof story.body === 'string') story.body = JSON.parse(story.body)
  story.featured = Boolean(story.featured); story.commentsEnabled = Boolean(story.commentsEnabled)
  ok(res, story)
}))

router.post('/stories', editorialRoles, asyncRoute(async (req, res) => {
  const values = storyInput(req.body)
  const id = crypto.randomUUID()
  const columns = ['id', ...Object.keys(values), 'created_by', 'updated_by']
  await pool.execute(`INSERT INTO stories (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`, [id, ...Object.values(values), req.user.id, req.user.id])
  await pool.execute('INSERT INTO story_revisions (id,story_id,revision_number,snapshot,change_summary,created_by) VALUES (?,?,1,?,\'Story created\',?)', [crypto.randomUUID(),id,JSON.stringify(req.body),req.user.id])
  res.status(201); ok(res, { id, slug:values.slug, status:values.status })
}))

router.put('/stories/:id', editorialRoles, asyncRoute(async (req, res) => {
  const values = storyInput(req.body)
  const [before] = await pool.execute('SELECT * FROM stories WHERE id=? AND deleted_at IS NULL', [req.params.id])
  if (!before[0]) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  const assignments = Object.keys(values).map((key) => `${key}=?`).join(',')
  await pool.execute(`UPDATE stories SET ${assignments},updated_by=? WHERE id=?`, [...Object.values(values),req.user.id,req.params.id])
  const [[revision]] = await pool.execute('SELECT COALESCE(MAX(revision_number),0)+1 number FROM story_revisions WHERE story_id=?', [req.params.id])
  await pool.execute('INSERT INTO story_revisions (id,story_id,revision_number,snapshot,change_summary,created_by) VALUES (?,?,?,?,?,?)', [crypto.randomUUID(),req.params.id,revision.number,JSON.stringify(req.body),String(req.body.changeSummary || 'Story updated').slice(0,500),req.user.id])
  ok(res, { id:req.params.id, slug:values.slug, status:values.status })
}))

router.delete('/stories/:id', editorialRoles, asyncRoute(async (req, res) => {
  const [stories] = await pool.execute('SELECT image_url FROM stories WHERE id=? AND deleted_at IS NULL', [req.params.id])
  const [result] = await pool.execute("UPDATE stories SET deleted_at=UTC_TIMESTAMP(),status='archived',updated_by=? WHERE id=? AND deleted_at IS NULL", [req.user.id,req.params.id])
  if (!result.affectedRows) throw new HttpError(404, 'STORY_NOT_FOUND', 'Story not found.')
  const localPrefix = `${req.protocol}://${req.get('host')}/uploads/`
  if (stories[0]?.image_url?.startsWith(localPrefix)) fs.unlink(path.join(uploadDirectory, path.basename(stories[0].image_url)), () => {})
  await pool.execute('INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id) VALUES (?,\'story.deleted\',\'story\',?)', [req.user.id,req.params.id])
  ok(res, { deleted:true })
}))

router.patch('/stories/:id/status', asyncRoute(async (req, res) => {
  if (!storyStatuses.includes(req.body.status)) throw new HttpError(422, 'VALIDATION_ERROR', 'Invalid story status.')
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
