import { createHash } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { setSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { loginTokens } from '@/lib/schema'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const fail = () => NextResponse.redirect(new URL('/login?error=1', req.url))

  if (!token) return fail()

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const [row] = await db
    .select()
    .from(loginTokens)
    .where(
      and(
        eq(loginTokens.tokenHash, tokenHash),
        isNull(loginTokens.usedAt),
        gt(loginTokens.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!row) return fail()

  // Jeton à usage unique.
  await db
    .update(loginTokens)
    .set({ usedAt: new Date() })
    .where(eq(loginTokens.id, row.id))

  await setSession(row.clientId)
  return NextResponse.redirect(new URL('/mes-albums', req.url))
}
