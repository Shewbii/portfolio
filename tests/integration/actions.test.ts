import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// On n'exécute pas Next : on mocke ses API. Le cookie store est partagé avec les tests.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock('next/headers', async () => {
  const { cookieStore } = await import('./cookie-store')
  return { cookies: async () => cookieStore }
})

import {
  createAlbum,
  deleteAlbum,
  deletePhoto,
  setAlbumAccess,
  setAlbumPassword,
} from '@/app/admin/actions'
import { toggleFavorite, unlockAlbum } from '@/app/albums/actions'
import { requestLogin } from '@/app/login/actions'
import { createSessionToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import {
  albums,
  clients,
  loginTokens,
  photos,
  selections,
} from '@/lib/schema'
import { clearCookies, setRawCookie } from './cookie-store'
import { resetDb } from './db-utils'

function fd(obj: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) f.set(k, v)
  return f
}

let counter = 0
const uniq = () => `x${counter++}`

async function insertAlbum(overrides: Record<string, unknown> = {}) {
  const [a] = await db
    .insert(albums)
    .values({ slug: `slug-${uniq()}`, title: 'Titre', ...overrides })
    .returning()
  return a
}

async function insertPhoto(albumId: string) {
  const [p] = await db
    .insert(photos)
    .values({
      albumId,
      storageKey: `key-${uniq()}`,
      width: 100,
      height: 100,
      blurDataUrl: 'data:image/jpeg;base64,xx',
    })
    .returning()
  return p
}

async function insertClient(email: string) {
  const [c] = await db.insert(clients).values({ email }).returning()
  return c
}

beforeEach(async () => {
  await resetDb()
  clearCookies()
})

describe('createAlbum', () => {
  it('génère des slugs uniques et respecte isPublic', async () => {
    await createAlbum(fd({ title: 'Mariage Été', isPublic: 'on' }))
    await createAlbum(fd({ title: 'Mariage Été' }))

    const rows = await db.select().from(albums)
    const first = rows.find((r) => r.slug === 'mariage-ete')
    const second = rows.find((r) => r.slug === 'mariage-ete-2')

    expect(first?.isPublic).toBe(true)
    expect(second?.isPublic).toBe(false)
  })
})

describe('setAlbumAccess', () => {
  it('crée le client (email normalisé) et fixe expiration ; vider efface', async () => {
    const a = await insertAlbum()
    await setAlbumAccess(
      a.id,
      fd({ clientEmail: 'Client@Test.fr', expiresAt: '2030-01-01' }),
    )

    const [updated] = await db.select().from(albums).where(eq(albums.id, a.id))
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, 'client@test.fr'))

    expect(client).toBeTruthy()
    expect(updated.clientId).toBe(client.id)
    expect(updated.expiresAt?.toISOString().slice(0, 10)).toBe('2030-01-01')

    await setAlbumAccess(a.id, fd({ clientEmail: '', expiresAt: '' }))
    const [cleared] = await db.select().from(albums).where(eq(albums.id, a.id))
    expect(cleared.clientId).toBeNull()
    expect(cleared.expiresAt).toBeNull()
  })
})

describe('setAlbumPassword', () => {
  it('définit un mot de passe vérifiable puis le retire', async () => {
    const a = await insertAlbum()

    await setAlbumPassword(a.id, fd({ password: 'hunter2' }))
    let [u] = await db.select().from(albums).where(eq(albums.id, a.id))
    expect(u.passwordHash).toBeTruthy()
    expect(verifyPassword('hunter2', u.passwordHash as string)).toBe(true)

    await setAlbumPassword(a.id, fd({ remove: 'on' }))
    ;[u] = await db.select().from(albums).where(eq(albums.id, a.id))
    expect(u.passwordHash).toBeNull()
  })
})

describe('toggleFavorite', () => {
  it('ajoute puis retire pour le client propriétaire', async () => {
    const client = await insertClient('owner@t.fr')
    const a = await insertAlbum({ clientId: client.id, isPublic: false })
    const p = await insertPhoto(a.id)
    setRawCookie('session', createSessionToken(client.id))

    await toggleFavorite(a.id, p.id)
    expect(await db.select().from(selections)).toHaveLength(1)

    await toggleFavorite(a.id, p.id)
    expect(await db.select().from(selections)).toHaveLength(0)
  })

  it("refuse un client qui n'est pas le propriétaire", async () => {
    const owner = await insertClient('o@t.fr')
    const other = await insertClient('x@t.fr')
    const a = await insertAlbum({ clientId: owner.id })
    const p = await insertPhoto(a.id)
    setRawCookie('session', createSessionToken(other.id))

    await toggleFavorite(a.id, p.id)
    expect(await db.select().from(selections)).toHaveLength(0)
  })

  it("refuse une photo n'appartenant pas à l'album", async () => {
    const client = await insertClient('c@t.fr')
    const a = await insertAlbum({ clientId: client.id })
    const otherAlbum = await insertAlbum()
    const foreignPhoto = await insertPhoto(otherAlbum.id)
    setRawCookie('session', createSessionToken(client.id))

    await toggleFavorite(a.id, foreignPhoto.id)
    expect(await db.select().from(selections)).toHaveLength(0)
  })
})

describe('unlockAlbum', () => {
  it('redirige avec le bon mot de passe, renvoie une erreur sinon', async () => {
    const a = await insertAlbum({ isPublic: false })
    await setAlbumPassword(a.id, fd({ password: 'open-sesame' }))

    await expect(
      unlockAlbum(a.id, a.slug, {}, fd({ password: 'open-sesame' })),
    ).rejects.toThrow(`REDIRECT:/albums/${a.slug}`)

    const res = await unlockAlbum(a.id, a.slug, {}, fd({ password: 'mauvais' }))
    expect(res.error).toBeTruthy()
  })
})

describe('suppressions (clés étrangères)', () => {
  it('deleteAlbum purge favoris + photos sans erreur FK', async () => {
    const client = await insertClient('d@t.fr')
    const a = await insertAlbum({ clientId: client.id })
    const p = await insertPhoto(a.id)
    await db
      .insert(selections)
      .values({ albumId: a.id, photoId: p.id, clientId: client.id })

    await deleteAlbum(a.id)

    expect(await db.select().from(albums).where(eq(albums.id, a.id))).toHaveLength(0)
    expect(await db.select().from(photos).where(eq(photos.albumId, a.id))).toHaveLength(0)
    expect(await db.select().from(selections)).toHaveLength(0)
  })

  it('deletePhoto purge les favoris liés', async () => {
    const client = await insertClient('e@t.fr')
    const a = await insertAlbum({ clientId: client.id })
    const p = await insertPhoto(a.id)
    await db
      .insert(selections)
      .values({ albumId: a.id, photoId: p.id, clientId: client.id })

    await deletePhoto(p.id)

    expect(await db.select().from(photos).where(eq(photos.id, p.id))).toHaveLength(0)
    expect(await db.select().from(selections)).toHaveLength(0)
  })
})

describe('requestLogin', () => {
  it('crée un jeton pour un client existant', async () => {
    const client = await insertClient('known@t.fr')
    const res = await requestLogin({ ok: false, message: '' }, fd({ email: 'known@t.fr' }))
    expect(res.ok).toBe(true)
    expect(
      await db.select().from(loginTokens).where(eq(loginTokens.clientId, client.id)),
    ).toHaveLength(1)
  })

  it('ne crée aucun jeton pour un email inconnu (anti-énumération)', async () => {
    const res = await requestLogin({ ok: false, message: '' }, fd({ email: 'ghost@t.fr' }))
    expect(res.ok).toBe(true)
    expect(await db.select().from(loginTokens)).toHaveLength(0)
  })
})
