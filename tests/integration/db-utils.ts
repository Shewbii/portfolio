import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function resetDb() {
  await db.execute(
    sql`truncate table selections, login_tokens, zip_jobs, photos, albums, clients restart identity cascade`,
  )
}
