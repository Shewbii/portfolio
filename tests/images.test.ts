import { describe, expect, it } from 'vitest'
import { formatToExt } from '@/lib/images'

describe('formatToExt', () => {
  it('jpeg devient jpg', () => expect(formatToExt('jpeg')).toBe('jpg'))
  it('png reste png', () => expect(formatToExt('png')).toBe('png'))
  it('webp reste webp', () => expect(formatToExt('webp')).toBe('webp'))
  it('null retombe sur jpg', () => expect(formatToExt(null)).toBe('jpg'))
  it('undefined retombe sur jpg', () => expect(formatToExt(undefined)).toBe('jpg'))
})
