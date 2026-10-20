import { describe, expect, test } from 'vitest'
import { formatTime } from './time'

describe('formatTime', () => {
  test('форматирует время в ЧЧ:ММ', () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5).getTime())).toBe('09:05')
    expect(formatTime(new Date(2026, 0, 1, 23, 59).getTime())).toBe('23:59')
  })
})
