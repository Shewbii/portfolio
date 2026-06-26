import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.AUTH_SECRET ?? ''
const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function createSessionToken(clientId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const payload = Buffer.from(JSON.stringify({ clientId, exp })).toString(
    'base64url',
  )
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(
  token: string | undefined,
): { clientId: string } | null {
  if (!token || !SECRET) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null

  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.clientId !== 'string') return null
    if (typeof data.exp !== 'number' || data.exp * 1000 < Date.now()) return null
    return { clientId: data.clientId }
  } catch {
    return null
  }
}

export async function getSession() {
  const store = await cookies()
  return verifySessionToken(store.get(COOKIE)?.value)
}

export async function setSession(clientId: string) {
  const store = await cookies()
  store.set(COOKIE, createSessionToken(clientId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

// --- Accès à un album protégé par mot de passe (cookie signé, par album) ---

const ALBUM_PREFIX = 'alb_'

export function createAlbumToken(albumId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const payload = Buffer.from(JSON.stringify({ albumId, exp })).toString(
    'base64url',
  )
  return `${payload}.${sign(payload)}`
}

export function verifyAlbumToken(
  albumId: string,
  token: string | undefined,
): boolean {
  if (!token || !SECRET) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false

  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return (
      data.albumId === albumId &&
      typeof data.exp === 'number' &&
      data.exp * 1000 >= Date.now()
    )
  } catch {
    return false
  }
}

export async function hasAlbumAccess(albumId: string): Promise<boolean> {
  const store = await cookies()
  return verifyAlbumToken(albumId, store.get(ALBUM_PREFIX + albumId)?.value)
}

export async function grantAlbumAccess(albumId: string) {
  const store = await cookies()
  store.set(ALBUM_PREFIX + albumId, createAlbumToken(albumId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}
