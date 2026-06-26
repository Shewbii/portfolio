'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { deletePhoto, movePhoto, setCover } from '@/app/admin/actions'

type Pic = {
  id: string
  storageKey: string
  width: number
  height: number
  blurDataUrl: string
}

export default function PhotoManager({
  photos,
  albumId,
  coverPhotoId,
  favoritePhotoIds = [],
}: {
  photos: Pic[]
  albumId: string | null
  coverPhotoId?: string | null
  favoritePhotoIds?: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const favs = new Set(favoritePhotoIds)

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  if (photos.length === 0) {
    return <p className="text-sm text-neutral-400">Aucune photo.</p>
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${pending ? 'pointer-events-none opacity-60' : ''}`}
    >
      {photos.map((p, i) => (
        <div key={p.id} className="space-y-1.5">
          <div className="relative overflow-hidden rounded">
            <Image
              src={`/images/${p.storageKey}/thumb.webp`}
              alt=""
              width={p.width}
              height={p.height}
              placeholder="blur"
              blurDataURL={p.blurDataUrl}
              className="aspect-square w-full object-cover"
            />
            {coverPhotoId === p.id && (
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
                couverture
              </span>
            )}
            {favs.has(p.id) && (
              <span className="absolute right-1 top-1 text-lg text-red-500 drop-shadow">
                ♥
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              disabled={pending || i === 0}
              onClick={() => run(() => movePhoto(p.id, 'up'))}
              className="rounded border border-neutral-300 px-1.5 py-0.5 disabled:opacity-30"
              aria-label="Déplacer vers la gauche"
            >
              ←
            </button>
            <button
              disabled={pending || i === photos.length - 1}
              onClick={() => run(() => movePhoto(p.id, 'down'))}
              className="rounded border border-neutral-300 px-1.5 py-0.5 disabled:opacity-30"
              aria-label="Déplacer vers la droite"
            >
              →
            </button>
            {albumId && coverPhotoId !== p.id && (
              <button
                disabled={pending}
                onClick={() => run(() => setCover(albumId, p.id))}
                className="rounded border border-neutral-300 px-1.5 py-0.5"
              >
                couv.
              </button>
            )}
            <button
              disabled={pending}
              onClick={() => {
                if (confirm('Supprimer définitivement cette photo ?')) {
                  run(() => deletePhoto(p.id))
                }
              }}
              className="ml-auto rounded border border-red-200 px-1.5 py-0.5 text-red-600"
            >
              suppr.
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
