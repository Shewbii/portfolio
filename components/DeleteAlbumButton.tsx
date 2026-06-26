'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { deleteAlbum } from '@/app/admin/actions'

export default function DeleteAlbumButton({ albumId }: { albumId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm('Supprimer cet album et TOUTES ses photos ? Action irréversible.')) {
          startTransition(async () => {
            await deleteAlbum(albumId)
            router.push('/admin')
          })
        }
      }}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      Supprimer l’album
    </button>
  )
}
