/**
 * Envoi d'e-mail via l'API HTTP Resend (pas de dépendance npm).
 * En dev sans clé : on logue le lien dans la console du serveur.
 */
export async function sendMagicLink(email: string, url: string) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM ?? 'onboarding@resend.dev'

  if (!key) {
    // eslint-disable-next-line no-console
    console.log(
      `\n──────── [DEV] Magic link pour ${email} ────────\n${url}\n────────────────────────────────────────────\n`,
    )
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Votre lien de connexion',
      html: `<p>Bonjour,</p>
<p>Cliquez sur ce lien pour accéder à vos albums :</p>
<p><a href="${url}">${url}</a></p>
<p>Ce lien expire dans 15 minutes et ne fonctionne qu'une fois.</p>`,
    }),
  })

  if (!res.ok) {
    throw new Error(`Resend a renvoyé ${res.status}`)
  }
}
