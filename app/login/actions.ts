'use server'

import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { clearSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendMagicLink } from '@/lib/mail'
import { clients, loginTokens } from '@/lib/schema'

const TOKEN_TTL_MIN = 15

export type LoginState = { ok: boolean; message: string }

export async function requestLogin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  if (!email || !email.includes('@')) {
    return { ok: false, message: 'Adresse e-mail invalide.' }
  }

  // On n'envoie un lien QUE si le client existe (créé par le photographe en
  // assignant un album). Pas de message qui révèle l'existence du compte.
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.email, email))
    .limit(1)

  if (client) {
    const raw = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(raw).digest('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000)
    await db.insert(loginTokens).values({ clientId: client.id, tokenHash, expiresAt })

    const base = process.env.APP_URL ?? 'http://localhost:3000'
    await sendMagicLink(email, `${base}/login/verify?token=${raw}`)
  }

  return {
    ok: true,
    message:
      'Si un compte existe pour cette adresse, un lien de connexion vient d’être envoyé. Vérifiez vos e-mails.',
  }
}

export async function logout() {
  await clearSession()
  redirect('/')
}
