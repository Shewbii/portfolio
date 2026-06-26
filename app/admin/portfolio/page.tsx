import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import PhotoManager from '@/components/PhotoManager'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default async function ManagePortfolio() {
  const pics = await db
    .select()
    .from(photos)
    .where(eq(photos.isPortfolio, true))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="text-sm">
        <Link href="/admin" className="text-neutral-400 hover:underline">
          ← Admin
        </Link>
      </div>
      <section className="space-y-3">
        <h1 className="text-2xl font-light">
          Portfolio ({pics.length}){' '}
          <span className="text-sm text-neutral-400">— flèches pour réordonner</span>
        </h1>
        <PhotoManager albumId={null} photos={pics.map((p) => ({
          id: p.id,
          storageKey: p.storageKey,
          width: p.width,
          height: p.height,
          blurDataUrl: p.blurDataUrl,
        }))} />
      </section>
    </main>
  )
}
