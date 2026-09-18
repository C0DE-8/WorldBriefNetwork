const crypto = require('node:crypto')
const bcrypt = require('bcryptjs')
const { pool } = require('../src/db')

async function main() {
  const [emailArg, password, ...nameParts] = process.argv.slice(2)
  const email = String(emailArg || '').trim().toLowerCase()
  const name = nameParts.join(' ').trim() || 'Administrator'
  if (!/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8) {
    throw new Error('Usage: npm run admin:create -- admin@example.com "password" "Display Name" (password: 8+ characters)')
  }
  const [existing] = await pool.execute('SELECT id FROM users WHERE email=?', [email])
  const id = existing[0]?.id || crypto.randomUUID()
  const hash = await bcrypt.hash(password, 12)
  await pool.execute(
    `INSERT INTO users (id,email,password_hash,display_name,email_verified_at) VALUES (?,?,?,?,UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),display_name=VALUES(display_name),status='active',email_verified_at=COALESCE(email_verified_at,UTC_TIMESTAMP())`,
    [id,email,hash,name],
  )
  await pool.execute("INSERT IGNORE INTO user_roles (user_id,role_id) SELECT ?,id FROM roles WHERE role_key='super_admin'", [id])
  process.stdout.write(`Super admin ready: ${email}\n`)
  await pool.end()
}

main().catch((error) => { console.error(error.message); process.exit(1) })
