'use client'

import { useActionState } from 'react'
import { type LoginState, requestLogin } from './actions'

const initial: LoginState = { ok: false, message: '' }

export default function LoginPage() {
  const [state, action, pending] = useActionState(requestLogin, initial)

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-light">Espace client</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Entrez votre e-mail pour recevoir un lien de connexion.
      </p>

      <form action={action} className="space-y-3">
        <input
          type="email"
          name="email"
          required
          placeholder="vous@exemple.com"
          className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Envoi…' : 'Recevoir le lien'}
        </button>
      </form>

      {state.message && (
        <p
          className={`mt-4 text-sm ${state.ok ? 'text-green-700' : 'text-red-600'}`}
        >
          {state.message}
        </p>
      )}
    </main>
  )
}
