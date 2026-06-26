import { existsSync } from 'node:fs'
import { Readable } from 'node:stream'
import { ZipArchive } from 'archiver'
import { and, asc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { checkAlbumAccess, isViewable } from '@/lib/access'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatToExt, storagePath } from '@/lib/images'
import { albums, photos, selections } from '@/lib/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.slug, slug))
    .limit(1)
  if (!album) return new NextResponse('Not found', { status: 404 })

  // Même contrôle d'accès que la page (jamais dupliqué : helper partagé).
  const access = await checkAlbumAccess(album)
  if (!isViewable(access)) {
    return new NextResponse('Accès refusé', { status: 403 })
  }

  let pics = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))

  // ?selection=1 : seulement les favoris du client connecté propriétaire.
  const onlySelection = req.nextUrl.searchParams.get('selection') === '1'
  let suffix = ''
  if (onlySelection && access === 'client' && album.clientId) {
    const favs = await db
      .select({ photoId: selections.photoId })
      .from(selections)
      .where(
        and(
          eq(selections.albumId, album.id),
          eq(selections.clientId, album.clientId),
        ),
      )
    const favSet = new Set(favs.map((f) => f.photoId))
    pics = pics.filter((p) => favSet.has(p.id))
    suffix = '-selection'
  }

  if (pics.length === 0) {
    return new NextResponse('Aucune photo à télécharger', { status: 404 })
  }

  // Niveau 0 : les JPEG/WebP sont déjà compressés, on évite de gaspiller du CPU.
  const archive = new ZipArchive({ zlib: { level: 0 } })
  archive.on('error', (err) => archive.destroy(err))

  pics.forEach((p, i) => {
    const file = storagePath(p.storageKey, 'original')
    if (existsSync(file)) {
      const num = String(i + 1).padStart(3, '0')
      archive.file(file, { name: `${num}.${formatToExt(p.originalFormat)}` })
    }
  })

  archive.finalize()

  const filename = `${slug}${suffix}.zip`
  return new NextResponse(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
