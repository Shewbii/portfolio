'use client'

import { ChevronLeft, ChevronRight, Download, Heart, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toggleFavorite } from '@/app/albums/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

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

  // Escape et le verrouillage du focus/scroll sont gérés par le Dialog Radix ;
  // on ne câble ici que la navigation clavier gauche/droite.
  useEffect(() => {
    if (open === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, prev, next])

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
          <div className="ml-auto flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/albums/${slug}/download`}>
                <Download />
                Télécharger l’album
              </a>
            </Button>
            {canFavorite && favs.size > 0 && (
              <Button asChild size="sm">
                <a href={`/albums/${slug}/download?selection=1`}>
                  <Heart />
                  Télécharger ma sélection ({favs.size})
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="text-muted-foreground">Cet album est vide.</p>
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
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => toggle(p.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/80 backdrop-blur hover:bg-white"
                  aria-label={favs.has(p.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  aria-pressed={favs.has(p.id)}
                >
                  <Heart
                    className={
                      favs.has(p.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-neutral-400'
                    }
                  />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(o) => !o && close()}>
        {current && (
          <DialogContent
            showCloseButton={false}
            aria-describedby={undefined}
            onClick={close}
            className="top-0 left-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none border-0 bg-black/90 p-0 ring-0 sm:max-w-none"
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>

            <Button
              variant="ghost"
              size="icon-lg"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:bg-white/10 hover:text-white sm:left-6"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="size-8" />
            </Button>

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
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(current.id)
                }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 hover:bg-white"
                aria-pressed={favs.has(current.id)}
              >
                <Heart
                  className={
                    favs.has(current.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-neutral-500'
                  }
                />
                {favs.has(current.id)
                  ? 'Dans ma sélection'
                  : 'Ajouter à ma sélection'}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon-lg"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:bg-white/10 hover:text-white sm:right-6"
              aria-label="Photo suivante"
            >
              <ChevronRight className="size-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="absolute right-4 top-4 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X className="size-6" />
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </main>
  )
}
