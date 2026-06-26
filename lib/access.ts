import { getSession, hasAlbumAccess } from './auth'

type AlbumAccessInput = {
  id: string
  isPublic: boolean
  expiresAt: Date | null
  clientId: string | null
  passwordHash: string | null
}

export type AccessResult =
  | 'public' // ouvert à tous
  | 'client' // client propriétaire connecté
  | 'password-ok' // mot de passe déjà validé (cookie)
  | 'need-login' // privé + client, non connecté
  | 'need-password' // privé + mot de passe, non validé
  | 'expired' // lien expiré
  | 'private' // privé sans verrou : invisible

export async function checkAlbumAccess(
  album: AlbumAccessInput,
): Promise<AccessResult> {
  if (album.isPublic) return 'public'
  if (album.expiresAt && album.expiresAt < new Date()) return 'expired'

  if (album.clientId) {
    const session = await getSession()
    if (session && session.clientId === album.clientId) return 'client'
  }

  if (album.passwordHash) {
    if (await hasAlbumAccess(album.id)) return 'password-ok'
    return 'need-password'
  }

  if (album.clientId) return 'need-login'
  return 'private'
}

/** L'album peut-il être affiché / téléchargé ? */
export function isViewable(result: AccessResult): boolean {
  return result === 'public' || result === 'client' || result === 'password-ok'
}
