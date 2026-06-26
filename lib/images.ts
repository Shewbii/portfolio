import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// Racine de stockage : volume disque en prod (monté par Coolify), ./data en dev.
const STORAGE_DIR =
  process.env.STORAGE_DIR ?? path.join(process.cwd(), 'data', 'photos')

export type ProcessedImage = {
  storageKey: string
  width: number
  height: number
  blurDataURL: string
  format: string | null
}

/** Extension de fichier pour un format sharp donné (défaut : jpg). */
export function formatToExt(format: string | null | undefined): string {
  if (!format) return 'jpg'
  return format === 'jpeg' ? 'jpg' : format
}

/**
 * Génère les dérivés web à partir d'un original :
 *  - original      : conservé tel quel (HD / sauvegarde / téléchargement futur)
 *  - web.webp      : max 2000px, pour l'affichage
 *  - thumb.webp    : max 600px, pour les grilles
 *  - blurDataURL   : minuscule base64 pour le placeholder flou de next/image
 */
export async function processUpload(
  buffer: Buffer,
  storageKey: string,
): Promise<ProcessedImage> {
  const dir = path.join(STORAGE_DIR, storageKey)
  await mkdir(dir, { recursive: true })

  // .rotate() applique l'orientation EXIF puis la supprime des dérivés.
  const base = sharp(buffer, { failOn: 'none' }).rotate()

  await writeFile(path.join(dir, 'original'), buffer)

  const webBuf = await base
    .clone()
    .resize({ width: 2000, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
  await writeFile(path.join(dir, 'web.webp'), webBuf)

  const thumbBuf = await base
    .clone()
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  await writeFile(path.join(dir, 'thumb.webp'), thumbBuf)

  const blurBuf = await base
    .clone()
    .resize({ width: 16 })
    .blur()
    .jpeg({ quality: 50 })
    .toBuffer()
  const blurDataURL = `data:image/jpeg;base64,${blurBuf.toString('base64')}`

  const meta = await sharp(webBuf).metadata()
  const original = await sharp(buffer).metadata()

  return {
    storageKey,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    blurDataURL,
    format: original.format ?? null,
  }
}

export function storagePath(storageKey: string, variant: string) {
  return path.join(STORAGE_DIR, storageKey, variant)
}

/** Supprime tous les dérivés + l'original d'une photo. */
export async function deletePhotoFiles(storageKey: string) {
  await rm(path.join(STORAGE_DIR, storageKey), { recursive: true, force: true })
}
