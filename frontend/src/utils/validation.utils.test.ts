import { emailSchema, passwordSchema } from './validation.utils'

describe('validation schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true)
    })

    it('should fail invalid email', () => {
      const res = emailSchema.safeParse('invalid-email')
      expect(res.success).toBe(false)
    })
  })

  describe('passwordSchema', () => {
    it('should validate password of 8 characters or more', () => {
      expect(passwordSchema.safeParse('password123').success).toBe(true)
    })

    it('should fail password shorter than 8 characters', () => {
      const res = passwordSchema.safeParse('short')
      expect(res.success).toBe(false)
    })
  })
})
