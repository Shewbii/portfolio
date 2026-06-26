import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('password', () => {
  it('valide le bon mot de passe', () => {
    const stored = hashPassword('secret123')
    expect(verifyPassword('secret123', stored)).toBe(true)
  })
  it('rejette un mauvais mot de passe', () => {
    const stored = hashPassword('secret123')
    expect(verifyPassword('mauvais', stored)).toBe(false)
  })
  it('rejette un hash mal formé', () => {
    expect(verifyPassword('x', 'pas-de-deux-points')).toBe(false)
    expect(verifyPassword('x', '')).toBe(false)
  })
  it('utilise un sel aléatoire (deux hash différents)', () => {
    expect(hashPassword('a')).not.toBe(hashPassword('a'))
  })
})
