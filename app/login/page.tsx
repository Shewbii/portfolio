'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type LoginState, requestLogin } from './actions'

const initial: LoginState = { ok: false, message: '' }

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestLogin, initial)

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-light">Espace client</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Entrez votre e-mail pour recevoir un lien de connexion.
      </p>

      <form action={action} className="space-y-3">
        <Input
          type="email"
          name="email"
          required
          placeholder="vous@exemple.com"
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Envoi…' : 'Recevoir le lien'}
        </Button>
      </form>

      {state.message && (
        <p
          className={`mt-4 text-sm ${state.ok ? 'text-green-700' : 'text-destructive'}`}
        >
          {state.message}
        </p>
      )}
    </main>
  )
}
