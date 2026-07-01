'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <Input name="title" placeholder="Titre de l’album" required />
      <Label className="font-normal">
        <Checkbox name="isPublic" defaultChecked />
        Public (visible dans la liste des albums)
      </Label>
      <Button type="submit" disabled={busy}>
        Créer l’album
      </Button>
    </form>
  )
}
