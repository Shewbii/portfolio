import { execSync } from 'node:child_process'
import { Client } from 'pg'

const ADMIN_URL = 'postgres://photos:photos@localhost:5432/photos'
const TEST_DB = 'photos_test'
const TEST_DB_URL = `postgres://photos:photos@localhost:5432/${TEST_DB}`

// Crée la base de test si besoin et y applique le schéma (une fois par run).
export default async function setup() {
  const admin = new Client({ connectionString: ADMIN_URL })
  await admin.connect()
  const exists = await admin.query(
    'select 1 from pg_database where datname = $1',
    [TEST_DB],
  )
  if (exists.rowCount === 0) {
    await admin.query(`create database ${TEST_DB}`)
  }
  await admin.end()

  // dotenv (dans drizzle.config) n'écrase PAS une variable déjà définie :
  // notre DATABASE_URL de test l'emporte.
  execSync('npx drizzle-kit push', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  })
}
