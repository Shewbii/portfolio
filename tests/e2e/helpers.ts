import { createHash, randomBytes } from 'node:crypto'
import { Client } from 'pg'
import sharp from 'sharp'

const DB_URL = 'postgres://photos:photos@localhost:5432/photos_e2e'

/** Image JPEG de test (buffer) pour les uploads via l'UI. */
export function sampleJpeg(background = { r: 80, g: 120, b: 160 }) {
  return sharp({
    create: { width: 1200, height: 800, channels: 3, background },
  })
    .jpeg()
    .toBuffer()
}

async function withDb<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: DB_URL })
  await c.connect()
  try {
    return await fn(c)
  } finally {
    await c.end()
  }
}

/**
 * Crée un jeton de connexion valide pour un client existant et renvoie le
 * jeton brut (à passer à /login/verify?token=...). Reproduit le hachage de prod.
 */
export async function createLoginToken(email: string): Promise<string> {
  const raw = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(raw).digest('hex')
  await withDb(async (c) => {
    const r = await c.query('select id from clients where email = $1', [email])
    if (r.rowCount === 0) throw new Error(`client introuvable : ${email}`)
    await c.query(
      "insert into login_tokens (client_id, token_hash, expires_at) values ($1, $2, now() + interval '15 minutes')",
      [r.rows[0].id, hash],
    )
  })
  return raw
}
