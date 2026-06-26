'use client'

import { useRef, useState } from 'react'
import { createAlbum } from './actions'

export default function AlbumForm() {
  const ref = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setBusy(true)
        try {
          await createAlbum(fd)
          ref.current?.reset()
        } finally {
          setBusy(false)
        }
      }}
      className="space-y-3"
    >
      <input
        name="title"
        placeholder="Titre de l’album"
        required
        className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublic" defaultChecked />
        Public (visible dans la liste des albums)
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Créer l’album
      </button>
    </form>
  )
}
