// Prépare la base e2e AVANT que Playwright ne démarre le serveur web
// (le serveur interroge la base dès le contrôle de disponibilité).
import { execSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { Client } from 'pg'

const ADMIN_URL = 'postgres://photos:photos@localhost:5432/photos'
const DB = 'photos_e2e'
const DB_URL = `postgres://photos:photos@localhost:5432/${DB}`

const admin = new Client({ connectionString: ADMIN_URL })
await admin.connect()
const exists = await admin.query('select 1 from pg_database where datname = $1', [DB])
if (exists.rowCount === 0) await admin.query(`create database ${DB}`)
await admin.end()

execSync('npx drizzle-kit push', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: DB_URL },
})

const c = new Client({ connectionString: DB_URL })
await c.connect()
await c.query(
  'truncate table selections, login_tokens, zip_jobs, photos, albums, clients restart identity cascade',
)
await c.end()

await rm('./data/e2e-photos', { recursive: true, force: true })
console.log('Base e2e prête.')
