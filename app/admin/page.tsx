import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { db } from '@/lib/db'
import { albums } from '@/lib/schema'
import AlbumForm from './AlbumForm'
import Uploader from './Uploader'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  const list = await db.select().from(albums).orderBy(desc(albums.createdAt))

  return (
    <main className="mx-auto max-w-2xl space-y-12 px-4 py-12">
      <div>
        <h1 className="text-2xl font-light">Admin</h1>
        <p className="mt-1 text-sm text-amber-700">
          Page non protégée pour l’instant (l’authentification arrive à l’étape 3).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-light">Uploader une photo</h2>
        <Uploader albums={list.map((a) => ({ id: a.id, title: a.title }))} />
        <p className="text-sm">
          <Link href="/admin/portfolio" className="underline">
            Gérer le portfolio
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-light">Créer un album</h2>
        <AlbumForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-light">Albums ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-sm text-neutral-400">Aucun album.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 text-sm">
            {list.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <Link href={`/admin/albums/${a.slug}`} className="underline">
                  {a.title}
                </Link>
                <span className="text-neutral-400">/{a.slug}</span>
                <span
                  className={a.isPublic ? 'text-green-600' : 'text-neutral-400'}
                >
                  {a.isPublic ? 'public' : 'privé'}
                </span>
                <Link
                  href={`/admin/albums/${a.slug}`}
                  className="ml-auto text-neutral-500 hover:underline"
                >
                  gérer
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
