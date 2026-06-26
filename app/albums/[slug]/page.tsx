import { and, asc, eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import AlbumGallery from '@/components/AlbumGallery'
import AlbumPasswordForm from '@/components/AlbumPasswordForm'
import { checkAlbumAccess } from '@/lib/access'
import { db } from '@/lib/db'
import { albums, photos, selections } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.slug, slug))
    .limit(1)
  if (!album) notFound()

  const access = await checkAlbumAccess(album)

  if (access === 'expired') {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="mb-2 text-2xl font-light">{album.title}</h1>
        <p className="text-neutral-500">
          Cet album n’est plus disponible (lien expiré). Contactez le
          photographe pour en prolonger l’accès.
        </p>
      </main>
    )
  }
  if (access === 'need-password') {
    return (
      <AlbumPasswordForm albumId={album.id} slug={album.slug} title={album.title} />
    )
  }
  if (access === 'need-login') redirect('/login')
  if (access === 'private') notFound()

  // Ici : public | client | password-ok
  const pics = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))

  // Favoris : uniquement pour le client propriétaire connecté.
  const canFavorite = access === 'client' && !!album.clientId
  let favoritePhotoIds: string[] = []
  if (canFavorite && album.clientId) {
    const favs = await db
      .select({ photoId: selections.photoId })
      .from(selections)
      .where(
        and(
          eq(selections.albumId, album.id),
          eq(selections.clientId, album.clientId),
        ),
      )
    favoritePhotoIds = favs.map((f) => f.photoId)
  }

  return (
    <AlbumGallery
      title={album.title}
      slug={album.slug}
      albumId={album.id}
      canFavorite={canFavorite}
      favoritePhotoIds={favoritePhotoIds}
      photos={pics.map((p) => ({
        id: p.id,
        storageKey: p.storageKey,
        width: p.width,
        height: p.height,
        blurDataUrl: p.blurDataUrl,
      }))}
    />
  )
}
