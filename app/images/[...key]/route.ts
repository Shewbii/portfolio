import { readFile, stat } from 'node:fs/promises'
import { type NextRequest } from 'next/server'
import { storagePath } from '@/lib/images'

export const runtime = 'nodejs'

const MIME: Record<string, string> = {
  'web.webp': 'image/webp',
  'thumb.webp': 'image/webp',
}

// Sert les dérivés depuis le volume disque.
// Cache-Control long => Cloudflare met en cache au bord, cette route est rarement touchée.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params
  const [storageKey, variant] = key

  if (
    !storageKey ||
    !variant ||
    storageKey.includes('..') ||
    variant.includes('..') ||
    !(variant in MIME)
  ) {
    return new Response('Not found', { status: 404 })
  }

  const filePath = storagePath(storageKey, variant)

  try {
    const info = await stat(filePath)
    const data = await readFile(filePath)
    return new Response(data, {
      headers: {
        'Content-Type': MIME[variant],
        'Content-Length': String(info.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
