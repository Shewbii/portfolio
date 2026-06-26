import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setAlbumAccess, setAlbumPassword, updateAlbum } from '@/app/admin/actions'
import DeleteAlbumButton from '@/components/DeleteAlbumButton'
import PhotoManager from '@/components/PhotoManager'
import { db } from '@/lib/db'
import { albums, clients, photos, selections } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default async function ManageAlbum({
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

  const pics = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))

  // Client actuellement autorisé (le cas échéant) pour préremplir le formulaire.
  let clientEmail = ''
  if (album.clientId) {
    const [c] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, album.clientId))
      .limit(1)
    clientEmail = c?.email ?? ''
  }
  const expiresValue = album.expiresAt
    ? album.expiresAt.toISOString().slice(0, 10)
    : ''

  // Sélection du client (favoris) sur cet album.
  const favs = await db
    .select({ photoId: selections.photoId })
    .from(selections)
    .where(eq(selections.albumId, album.id))
  const favoritePhotoIds = favs.map((f) => f.photoId)

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/admin" className="text-neutral-400 hover:underline">
          ← Admin
        </Link>
        {album.isPublic && (
          <Link href={`/albums/${album.slug}`} className="text-neutral-400 hover:underline">
            Voir la page publique
          </Link>
        )}
      </div>

      <section className="space-y-3">
        <h1 className="text-2xl font-light">Album : {album.title}</h1>
        <form action={updateAlbum.bind(null, album.id)} className="space-y-3">
          <input
            name="title"
            defaultValue={album.title}
            required
            className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" defaultChecked={album.isPublic} />
            Public
          </label>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-lg font-light">Accès privé</h2>
        <p className="text-sm text-neutral-500">
          Réserve l’album à un client (connexion par e-mail) et fixe une date
          d’expiration. {album.isPublic && (
            <span className="text-amber-700">
              L’album est actuellement <strong>public</strong> : décoche « Public »
              ci-dessus pour que ces restrictions s’appliquent.
            </span>
          )}
        </p>
        <form action={setAlbumAccess.bind(null, album.id)} className="space-y-3">
          <label className="block text-sm">
            <span className="text-neutral-600">E-mail du client</span>
            <input
              type="email"
              name="clientEmail"
              defaultValue={clientEmail}
              placeholder="client@exemple.com (vide = aucun)"
              className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-neutral-600">Expire le</span>
            <input
              type="date"
              name="expiresAt"
              defaultValue={expiresValue}
              className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Enregistrer l’accès
          </button>
        </form>

        <div className="border-t border-neutral-100 pt-4">
          <p className="mb-2 text-sm text-neutral-600">
            Mot de passe :{' '}
            <strong>{album.passwordHash ? 'défini' : 'aucun'}</strong>
          </p>
          <form
            action={setAlbumPassword.bind(null, album.id)}
            className="space-y-2"
          >
            <input
              type="text"
              name="password"
              placeholder="Nouveau mot de passe"
              className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input type="checkbox" name="remove" />
              Supprimer le mot de passe
            </label>
            <button
              type="submit"
              className="rounded border border-neutral-300 px-4 py-2 text-sm"
            >
              Enregistrer le mot de passe
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-light">
          Photos ({pics.length}){' '}
          <span className="text-sm text-neutral-400">— flèches pour réordonner</span>
        </h2>
        {favoritePhotoIds.length > 0 && (
          <p className="text-sm text-red-500">
            ♥ {favoritePhotoIds.length} photo(s) dans la sélection du client
          </p>
        )}
        <PhotoManager
          albumId={album.id}
          coverPhotoId={album.coverPhotoId}
          favoritePhotoIds={favoritePhotoIds}
          photos={pics.map((p) => ({
            id: p.id,
            storageKey: p.storageKey,
            width: p.width,
            height: p.height,
            blurDataUrl: p.blurDataUrl,
          }))}
        />
        <p className="text-xs text-neutral-400">
          Astuce : uploade des photos dans cet album depuis la page Admin.
        </p>
      </section>

      <section className="border-t border-neutral-100 pt-6">
        <DeleteAlbumButton albumId={album.id} />
      </section>
    </main>
  )
}
