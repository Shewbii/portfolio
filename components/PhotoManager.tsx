'use client'

import { ArrowLeft, ArrowRight, Heart, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deletePhoto, movePhoto, setCover } from '@/app/admin/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

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
  const [toDelete, setToDelete] = useState<string | null>(null)
  const favs = new Set(favoritePhotoIds)

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune photo.</p>
  }

  return (
    <>
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
                <Heart className="absolute right-1 top-1 size-4 fill-red-500 text-red-500 drop-shadow" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending || i === 0}
                onClick={() => run(() => movePhoto(p.id, 'up'))}
                aria-label="Déplacer vers la gauche"
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending || i === photos.length - 1}
                onClick={() => run(() => movePhoto(p.id, 'down'))}
                aria-label="Déplacer vers la droite"
              >
                <ArrowRight />
              </Button>
              {albumId && coverPhotoId !== p.id && (
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pending}
                  onClick={() => run(() => setCover(albumId, p.id))}
                >
                  <Star />
                  couv.
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon-xs"
                className="ml-auto"
                disabled={pending}
                aria-label="Supprimer la photo"
                onClick={() => setToDelete(p.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>
              La photo sera définitivement supprimée. Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const id = toDelete
                if (id) run(() => deletePhoto(id))
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
