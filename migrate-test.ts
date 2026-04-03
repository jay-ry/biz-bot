// Marks already-applied migrations as done in drizzle's tracking table
import { Pool } from 'pg'
import { readFileSync } from 'fs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const client = await pool.connect()

try {
  // Check which tables exist
  const { rows: tables } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  )
  console.log('Existing tables:', tables.map((r: any) => r.table_name).join(', '))

  // Check if drizzle migrations tracking table exists
  const { rows: migRows } = await client.query(
    `SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at`
  ).catch(() => ({ rows: [] }))
  console.log('Tracked migrations:', migRows.length)

  if (migRows.length === 0) {
    console.log('No tracked migrations — marking existing ones as applied...')

    // Create drizzle schema + table if missing
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `)

    // Compute hashes the same way drizzle-orm does
    const encoder = new TextEncoder()
    const migrations = [
      './server/db/migrations/0000_crazy_dagger.sql',
      './server/db/migrations/0001_enable_pgvector.sql',
    ]

    for (const file of migrations) {
      const sql = readFileSync(file, 'utf8')
      const buf = await crypto.subtle.digest('SHA-256', encoder.encode(sql))
      const hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
      await client.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        [hash, Date.now()]
      )
      console.log(`Marked as applied: ${file} (${hash.slice(0, 12)}...)`)
    }
    console.log('Done. Now run: bun run db:migrate')
  } else {
    console.log('Migrations already tracked — nothing to do.')
  }
} finally {
  client.release()
  await pool.end()
}
