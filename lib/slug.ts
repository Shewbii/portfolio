export function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return base || 'album'
}
