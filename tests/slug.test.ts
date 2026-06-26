import { describe, expect, it } from 'vitest'
import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it('met en minuscules et remplace les espaces', () => {
    expect(slugify('Mariage Dupont')).toBe('mariage-dupont')
  })
  it('enlève les accents', () => {
    expect(slugify('Été à Paris')).toBe('ete-a-paris')
  })
  it('rogne les tirets de début/fin', () => {
    expect(slugify('  Bonjour !  ')).toBe('bonjour')
  })
  it('réduit les suites de caractères non alphanumériques', () => {
    expect(slugify('a@@@b')).toBe('a-b')
  })
  it('retombe sur "album" si vide', () => {
    expect(slugify('!!!')).toBe('album')
    expect(slugify('')).toBe('album')
  })
  it('plafonne la longueur à 60', () => {
    expect(slugify('a'.repeat(100))).toHaveLength(60)
  })
})
