import { describe, it, expect } from 'vitest'
import { initials, avatarGrad, AVATAR_GRADIENTS } from './avatar.utils'

describe('avatar.utils', () => {
  describe('initials', () => {
    it('returns initials for a single word name', () => {
      expect(initials('John')).toBe('J')
    })

    it('returns initials for a multi-word name', () => {
      expect(initials('John Doe')).toBe('JD')
    })

    it('limits initials to two characters', () => {
      expect(initials('John Doe Smith')).toBe('JD')
    })

    it('capitalizes initials', () => {
      expect(initials('john doe')).toBe('JD')
    })

    it('handles empty names', () => {
      expect(initials('')).toBe('')
    })
  })

  describe('avatarGrad', () => {
    it('returns a valid gradient string based on the name', () => {
      const grad = avatarGrad('John')
      expect(AVATAR_GRADIENTS).toContain(grad)
    })

    it('returns deterministic gradients for the same name', () => {
      const grad1 = avatarGrad('John')
      const grad2 = avatarGrad('John')
      expect(grad1).toBe(grad2)
    })

    it('handles short names', () => {
      const grad = avatarGrad('A')
      expect(AVATAR_GRADIENTS).toContain(grad)
    })
  })
})
