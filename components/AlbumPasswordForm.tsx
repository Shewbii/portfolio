'use client'

import { useActionState } from 'react'
import { type UnlockState, unlockAlbum } from '@/app/albums/actions'

export default function AlbumPasswordForm({
  albumId,
  slug,
  title,
}: {
  albumId: string
  slug: string
  title: string
}) {
  const action = unlockAlbum.bind(null, albumId, slug)
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    action,
    {},
  )

  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="mb-2 text-2xl font-light">{title}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Cet album est protégé. Entrez le mot de passe communiqué par le
        photographe.
      </p>
      <form action={formAction} className="space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Mot de passe"
          className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Vérification…' : 'Accéder à l’album'}
        </button>
      </form>
      {state.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}
    </main>
  )
}
