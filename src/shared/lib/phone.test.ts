import { describe, expect, test } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  test.each([
    ['79991234567', '79991234567'],
    ['+7 (999) 123-45-67', '79991234567'],
    ['8 999 123 45 67', '79991234567'],
    ['9991234567', '79991234567'],
    ['+375 29 123-45-67', '375291234567'],
    ['  +1 202 555 0143 ', '12025550143'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  test.each(['', 'abc', '12345', '+7 999 123', '1234567890123456'])('невалидный номер %j → null', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})
