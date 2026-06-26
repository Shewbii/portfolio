import { asc, eq } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'
import { albums, photos } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default async function AlbumsPage() {
  const list = await db
    .select()
    .from(albums)
    .where(eq(albums.isPublic, true))
    .orderBy(asc(albums.title))

  // Couverture : la photo choisie manuellement (coverPhotoId), sinon la première.
  const withCovers = await Promise.all(
    list.map(async (a) => {
      let cover = null
      if (a.coverPhotoId) {
        ;[cover] = await db
          .select()
          .from(photos)
          .where(eq(photos.id, a.coverPhotoId))
          .limit(1)
      }
      if (!cover) {
        ;[cover] = await db
          .select()
          .from(photos)
          .where(eq(photos.albumId, a.id))
          .orderBy(asc(photos.sortOrder), asc(photos.createdAt))
          .limit(1)
      }
      return { ...a, cover: cover ?? null }
    }),
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-light tracking-tight">Albums</h1>

      {withCovers.length === 0 ? (
        <p className="text-neutral-400">Aucun album public pour l’instant.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {withCovers.map((a) => (
            <Link key={a.id} href={`/albums/${a.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100">
                {a.cover && (
                  <Image
                    src={`/images/${a.cover.storageKey}/thumb.webp`}
                    alt=""
                    width={a.cover.width}
                    height={a.cover.height}
                    placeholder="blur"
                    blurDataURL={a.cover.blurDataUrl}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <h2 className="mt-2 text-lg font-light">{a.title}</h2>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
