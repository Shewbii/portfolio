import { beforeEach, describe, expect, it, vi } from 'vitest'

// On contrôle la session et l'accès par mot de passe : checkAlbumAccess ne dépend
// que de ces deux fonctions + de l'objet album (pas de base de données).
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  hasAlbumAccess: vi.fn(),
}))

import { checkAlbumAccess, isViewable } from '@/lib/access'
import { getSession, hasAlbumAccess } from '@/lib/auth'

const mockGetSession = vi.mocked(getSession)
const mockHasAlbumAccess = vi.mocked(hasAlbumAccess)

function album(overrides: Partial<Parameters<typeof checkAlbumAccess>[0]> = {}) {
  return {
    id: 'a1',
    isPublic: false,
    expiresAt: null,
    clientId: null,
    passwordHash: null,
    ...overrides,
  }
}

const past = () => new Date(Date.now() - 60_000)

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue(null)
  mockHasAlbumAccess.mockResolvedValue(false)
})

describe('checkAlbumAccess', () => {
  it('album public => public', async () => {
    expect(await checkAlbumAccess(album({ isPublic: true }))).toBe('public')
  })

  it('album privé expiré => expired', async () => {
    expect(await checkAlbumAccess(album({ expiresAt: past() }))).toBe('expired')
  })

  it("l'expiration prime sur les verrous", async () => {
    mockGetSession.mockResolvedValue({ clientId: 'c1' })
    expect(
      await checkAlbumAccess(album({ clientId: 'c1', expiresAt: past() })),
    ).toBe('expired')
  })

  it('client propriétaire connecté => client', async () => {
    mockGetSession.mockResolvedValue({ clientId: 'c1' })
    expect(await checkAlbumAccess(album({ clientId: 'c1' }))).toBe('client')
  })

  it('client assigné mais non connecté => need-login', async () => {
    expect(await checkAlbumAccess(album({ clientId: 'c1' }))).toBe('need-login')
  })

  it('mauvais client connecté => need-login', async () => {
    mockGetSession.mockResolvedValue({ clientId: 'autre' })
    expect(await checkAlbumAccess(album({ clientId: 'c1' }))).toBe('need-login')
  })

  it('mot de passe déjà validé => password-ok', async () => {
    mockHasAlbumAccess.mockResolvedValue(true)
    expect(await checkAlbumAccess(album({ passwordHash: 'h' }))).toBe('password-ok')
  })

  it('mot de passe requis, non validé => need-password', async () => {
    expect(await checkAlbumAccess(album({ passwordHash: 'h' }))).toBe('need-password')
  })

  it('le client propriétaire prime sur le mot de passe', async () => {
    mockGetSession.mockResolvedValue({ clientId: 'c1' })
    expect(
      await checkAlbumAccess(album({ clientId: 'c1', passwordHash: 'h' })),
    ).toBe('client')
  })

  it('privé sans verrou => private (invisible)', async () => {
    expect(await checkAlbumAccess(album())).toBe('private')
  })
})

describe('isViewable', () => {
  it('états visibles', () => {
    for (const s of ['public', 'client', 'password-ok'] as const) {
      expect(isViewable(s)).toBe(true)
    }
  })
  it('états non visibles', () => {
    for (const s of ['need-login', 'need-password', 'expired', 'private'] as const) {
      expect(isViewable(s)).toBe(false)
    }
  })
})
