import { and, asc, eq, gt, isNull, or } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { albums, clients, photos } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default async function MyAlbums() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, session.clientId))
    .limit(1)
  if (!client) redirect('/login')

  const now = new Date()
  const list = await db
    .select()
    .from(albums)
    .where(
      and(
        eq(albums.clientId, client.id),
        or(isNull(albums.expiresAt), gt(albums.expiresAt, now)),
      ),
    )
    .orderBy(asc(albums.title))

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
      <h1 className="mb-1 text-3xl font-light tracking-tight">Mes albums</h1>
      <p className="mb-8 text-sm text-muted-foreground">{client.email}</p>

      {withCovers.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun album disponible pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {withCovers.map((a) => (
            <Link key={a.id} href={`/albums/${a.slug}`} className="group block">
              <Card className="gap-0 py-0 transition hover:ring-foreground/20">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
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
                <CardContent className="py-3">
                  <h2 className="text-lg font-light">{a.title}</h2>
                  {a.expiresAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Disponible jusqu’au{' '}
                      {a.expiresAt.toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
