'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toggleFavorite } from '@/app/albums/actions'

export type Pic = {
  id: string
  storageKey: string
  width: number
  height: number
  blurDataUrl: string
}

export default function AlbumGallery({
  title,
  photos,
  slug,
  albumId,
  canFavorite = false,
  favoritePhotoIds = [],
}: {
  title: string
  photos: Pic[]
  slug?: string
  albumId?: string
  canFavorite?: boolean
  favoritePhotoIds?: string[]
}) {
  const [open, setOpen] = useState<number | null>(null)
  const [favs, setFavs] = useState<Set<string>>(new Set(favoritePhotoIds))
  const [, startTransition] = useTransition()
  const router = useRouter()

  const close = useCallback(() => setOpen(null), [])
  const prev = useCallback(
    () =>
      setOpen((i) => (i === null ? i : (i + photos.length - 1) % photos.length)),
    [photos.length],
  )
  const next = useCallback(
    () => setOpen((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length],
  )

  useEffect(() => {
    if (open === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, prev, next])

  function toggle(photoId: string) {
    if (!albumId || !canFavorite) return
    // optimiste
    setFavs((prev) => {
      const n = new Set(prev)
      if (n.has(photoId)) n.delete(photoId)
      else n.add(photoId)
      return n
    })
    startTransition(async () => {
      await toggleFavorite(albumId, photoId)
      router.refresh()
    })
  }

  const current = open === null ? null : photos[open]

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-light tracking-tight">{title}</h1>
        {slug && photos.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-2 text-sm">
            <a
              href={`/albums/${slug}/download`}
              className="rounded border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
            >
              Télécharger l’album
            </a>
            {canFavorite && favs.size > 0 && (
              <a
                href={`/albums/${slug}/download?selection=1`}
                className="rounded bg-black px-3 py-1.5 text-white"
              >
                Télécharger ma sélection ({favs.size})
              </a>
            )}
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="text-neutral-400">Cet album est vide.</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {photos.map((p, i) => (
            <div key={p.id} className="relative">
              <button
                onClick={() => setOpen(i)}
                className="block w-full cursor-zoom-in"
                aria-label="Agrandir la photo"
              >
                <Image
                  src={`/images/${p.storageKey}/thumb.webp`}
                  alt=""
                  width={p.width}
                  height={p.height}
                  placeholder="blur"
                  blurDataURL={p.blurDataUrl}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full rounded-lg"
                />
              </button>
              {canFavorite && (
                <button
                  onClick={() => toggle(p.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-lg leading-none backdrop-blur"
                  aria-label={favs.has(p.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  aria-pressed={favs.has(p.id)}
                >
                  <span className={favs.has(p.id) ? 'text-red-500' : 'text-neutral-400'}>
                    {favs.has(p.id) ? '♥' : '♡'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-2 text-3xl text-white/70 hover:text-white sm:left-6"
            aria-label="Photo précédente"
          >
            ‹
          </button>

          <Image
            src={`/images/${current.storageKey}/web.webp`}
            alt=""
            width={current.width}
            height={current.height}
            placeholder="blur"
            blurDataURL={current.blurDataUrl}
            className="max-h-[90vh] w-auto object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {canFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggle(current.id)
              }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm"
              aria-pressed={favs.has(current.id)}
            >
              <span className={favs.has(current.id) ? 'text-red-500' : 'text-neutral-500'}>
                {favs.has(current.id) ? '♥ Dans ma sélection' : '♡ Ajouter à ma sélection'}
              </span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-3xl text-white/70 hover:text-white sm:right-6"
            aria-label="Photo suivante"
          >
            ›
          </button>

          <button
            onClick={close}
            className="absolute right-4 top-4 px-2 text-2xl text-white/70 hover:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  )
}
