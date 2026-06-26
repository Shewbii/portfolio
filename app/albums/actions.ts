'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession, grantAlbumAccess } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { albums, photos, selections } from '@/lib/schema'

export type UnlockState = { error?: string }

export async function unlockAlbum(
  albumId: string,
  slug: string,
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const password = String(formData.get('password') ?? '')

  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, albumId))
    .limit(1)

  if (!album || !album.passwordHash) {
    return { error: 'Album introuvable.' }
  }
  if (!verifyPassword(password, album.passwordHash)) {
    return { error: 'Mot de passe incorrect.' }
  }

  await grantAlbumAccess(albumId)
  redirect(`/albums/${slug}`)
}

/**
 * Bascule un favori. Réservé au client propriétaire connecté : on revérifie
 * côté serveur que la session correspond au client de l'album et que la photo
 * appartient bien à cet album (on ne fait jamais confiance au client).
 */
export async function toggleFavorite(albumId: string, photoId: string) {
  const session = await getSession()
  if (!session) return

  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, albumId))
    .limit(1)
  if (!album || album.clientId !== session.clientId) return

  const [photo] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.albumId, albumId)))
    .limit(1)
  if (!photo) return

  const where = and(
    eq(selections.albumId, albumId),
    eq(selections.photoId, photoId),
    eq(selections.clientId, session.clientId),
  )
  const [existing] = await db.select().from(selections).where(where).limit(1)

  if (existing) {
    await db.delete(selections).where(where)
  } else {
    await db
      .insert(selections)
      .values({ albumId, photoId, clientId: session.clientId })
  }

  revalidatePath(`/albums/${album.slug}`)
}
