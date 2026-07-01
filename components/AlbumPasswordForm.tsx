'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <p className="mb-6 text-sm text-muted-foreground">
        Cet album est protégé. Entrez le mot de passe communiqué par le
        photographe.
      </p>
      <form action={formAction} className="space-y-3">
        <Input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Mot de passe"
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Vérification…' : 'Accéder à l’album'}
        </Button>
      </form>
      {state.error && (
        <p className="mt-4 text-sm text-destructive">{state.error}</p>
      )}
    </main>
  )
}
