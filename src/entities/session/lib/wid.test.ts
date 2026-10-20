import { describe, expect, test } from 'vitest'
import { formatWid } from './wid'

describe('formatWid', () => {
  test('номер аккаунта из wid', () => {
    expect(formatWid('79991234567@c.us')).toBe('+79991234567')
  })

  test('нечисловой идентификатор возвращается без суффикса', () => {
    expect(formatWid('user123@c.us')).toBe('user123')
  })
})
