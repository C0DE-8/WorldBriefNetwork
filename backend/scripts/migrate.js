const fs = require('node:fs/promises')
const path = require('node:path')
const mysql = require('mysql2/promise')
const config = require('../src/config')

async function main() {
  const admin = await mysql.createConnection({ ...config.db, database: undefined, multipleStatements: true })
  const safeName = config.db.database.replace(/`/g, '``')
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${safeName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await admin.end()

  const connection = await mysql.createConnection({ ...config.db, multipleStatements: true })
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)
  const directory = path.join(__dirname, '..', 'migrations')
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
  for (const filename of files) {
    const [found] = await connection.execute('SELECT filename FROM schema_migrations WHERE filename=?', [filename])
    if (found.length) continue
    const sql = await fs.readFile(path.join(directory, filename), 'utf8')
    await connection.beginTransaction()
    try {
      await connection.query(sql)
      await connection.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [filename])
      await connection.commit()
      process.stdout.write(`Applied ${filename}\n`)
    } catch (error) {
      await connection.rollback()
      throw error
    }
  }
  await connection.end()
}

main().catch((error) => { console.error(`Migration failed: ${error.message}`); process.exit(1) })
