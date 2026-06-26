'use server'

import { asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { deletePhotoFiles } from '@/lib/images'
import { hashPassword } from '@/lib/password'
import { albums, clients, photos, selections, zipJobs } from '@/lib/schema'
import { slugify } from '@/lib/slug'

// Pages dynamiques + actions admin : on rafraîchit tout l'arbre sous le layout.
function refresh() {
  revalidatePath('/', 'layout')
}

export async function createAlbum(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return

  // Slug unique : on suffixe -2, -3… en cas de collision.
  const base = slugify(title)
  let slug = base
  let n = 1
  while (true) {
    const existing = await db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.slug, slug))
      .limit(1)
    if (existing.length === 0) break
    n += 1
    slug = `${base}-${n}`
  }

  const isPublic = formData.get('isPublic') === 'on'

  await db.insert(albums).values({
    title,
    slug,
    isPublic,
    status: isPublic ? 'published' : 'draft',
  })

  refresh()
}

/** Renomme / (dé)publie un album. Le slug n'est PAS modifié (stabilité des liens). */
export async function updateAlbum(albumId: string, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  const isPublic = formData.get('isPublic') === 'on'

  await db
    .update(albums)
    .set({ title, isPublic, status: isPublic ? 'published' : 'draft' })
    .where(eq(albums.id, albumId))

  refresh()
}

/**
 * Définit l'accès privé d'un album : client autorisé (par e-mail, créé si besoin)
 * et date d'expiration. E-mail vide => plus de client assigné ; date vide => pas
 * d'expiration. Pour rendre l'album privé, pense à décocher « Public ».
 */
export async function setAlbumAccess(albumId: string, formData: FormData) {
  const email = String(formData.get('clientEmail') ?? '')
    .trim()
    .toLowerCase()
  const expiresStr = String(formData.get('expiresAt') ?? '').trim()

  let clientId: string | null = null
  if (email) {
    let [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, email))
      .limit(1)
    if (!client) {
      ;[client] = await db.insert(clients).values({ email }).returning()
    }
    clientId = client.id
  }

  const expiresAt = expiresStr ? new Date(expiresStr) : null

  await db.update(albums).set({ clientId, expiresAt }).where(eq(albums.id, albumId))
  refresh()
}

/**
 * Gère le mot de passe d'un album.
 * - case « supprimer » cochée   => retire le mot de passe
 * - sinon, champ non vide        => (ré)définit le mot de passe
 * - champ vide                   => aucun changement
 */
export async function setAlbumPassword(albumId: string, formData: FormData) {
  const remove = formData.get('remove') === 'on'
  const password = String(formData.get('password') ?? '')

  if (remove) {
    await db.update(albums).set({ passwordHash: null }).where(eq(albums.id, albumId))
  } else if (password.length > 0) {
    await db
      .update(albums)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(albums.id, albumId))
  }
  refresh()
}

export async function deleteAlbum(albumId: string) {
  const pics = await db
    .select({ storageKey: photos.storageKey })
    .from(photos)
    .where(eq(photos.albumId, albumId))

  // Dépendances d'abord (clés étrangères), puis photos, puis album.
  await db.delete(selections).where(eq(selections.albumId, albumId))
  await db.delete(zipJobs).where(eq(zipJobs.albumId, albumId))
  await db.delete(photos).where(eq(photos.albumId, albumId))
  await db.delete(albums).where(eq(albums.id, albumId))

  await Promise.all(pics.map((p) => deletePhotoFiles(p.storageKey)))
  refresh()
}

export async function setCover(albumId: string, photoId: string) {
  await db
    .update(albums)
    .set({ coverPhotoId: photoId })
    .where(eq(albums.id, albumId))
  refresh()
}

export async function deletePhoto(photoId: string) {
  const [photo] = await db
    .select()
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1)
  if (!photo) return

  // Si cette photo servait de couverture, on enlève la référence.
  await db
    .update(albums)
    .set({ coverPhotoId: null })
    .where(eq(albums.coverPhotoId, photoId))

  // Favoris référençant cette photo (clé étrangère).
  await db.delete(selections).where(eq(selections.photoId, photoId))

  await db.delete(photos).where(eq(photos.id, photoId))
  await deletePhotoFiles(photo.storageKey)
  refresh()
}

/**
 * Déplace une photo d'un cran dans son contexte (album précis OU portfolio).
 * Réassigne sort_order = position pour tout le lot (robuste même si les valeurs
 * historiques valent toutes 0).
 */
export async function movePhoto(photoId: string, direction: 'up' | 'down') {
  const [photo] = await db
    .select()
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1)
  if (!photo) return

  const scope = photo.albumId
    ? eq(photos.albumId, photo.albumId)
    : eq(photos.isPortfolio, true)

  const list = await db
    .select({ id: photos.id })
    .from(photos)
    .where(scope)
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))

  const idx = list.findIndex((p) => p.id === photoId)
  const target = direction === 'up' ? idx - 1 : idx + 1
  if (idx === -1 || target < 0 || target >= list.length) return

  const swapped = [...list]
  ;[swapped[idx], swapped[target]] = [swapped[target], swapped[idx]]

  await Promise.all(
    swapped.map((p, i) =>
      db.update(photos).set({ sortOrder: i }).where(eq(photos.id, p.id)),
    ),
  )
  refresh()
}
