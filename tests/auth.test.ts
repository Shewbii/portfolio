import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

// On n'exécute pas Next : on neutralise l'accès aux cookies.
vi.mock('next/headers', () => ({ cookies: vi.fn() }))

import {
  createAlbumToken,
  createSessionToken,
  verifyAlbumToken,
  verifySessionToken,
} from '@/lib/auth'

const SECRET = process.env.AUTH_SECRET as string

// Forge un jeton signé valide avec un payload arbitraire (pour tester l'expiration).
function signed(payloadObj: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

describe('jeton de session', () => {
  it('aller-retour sur un jeton valide', () => {
    const token = createSessionToken('client-1')
    expect(verifySessionToken(token)).toEqual({ clientId: 'client-1' })
  })

  it('rejette undefined et les chaînes invalides', () => {
    expect(verifySessionToken(undefined)).toBeNull()
    expect(verifySessionToken('nimporte-quoi')).toBeNull()
    expect(verifySessionToken('a.b')).toBeNull()
  })

  it('rejette un payload falsifié (signature invalide)', () => {
    const token = createSessionToken('client-1')
    const sig = token.split('.')[1]
    const forgedPayload = Buffer.from(
      JSON.stringify({ clientId: 'admin', exp: Math.floor(Date.now() / 1000) + 1000 }),
    ).toString('base64url')
    expect(verifySessionToken(`${forgedPayload}.${sig}`)).toBeNull()
  })

  it('rejette un jeton bien signé mais expiré', () => {
    const token = signed({ clientId: 'c', exp: Math.floor(Date.now() / 1000) - 10 })
    expect(verifySessionToken(token)).toBeNull()
  })
})

describe("jeton d'accès album", () => {
  it('aller-retour pour le même album', () => {
    const token = createAlbumToken('album-9')
    expect(verifyAlbumToken('album-9', token)).toBe(true)
  })

  it("rejette un jeton émis pour un autre album", () => {
    const token = createAlbumToken('album-9')
    expect(verifyAlbumToken('album-AUTRE', token)).toBe(false)
  })

  it('rejette les entrées invalides', () => {
    expect(verifyAlbumToken('a', undefined)).toBe(false)
    expect(verifyAlbumToken('a', 'x.y')).toBe(false)
  })
})
