import { describe, expect, test } from 'vitest'
import { formatTime, toMilliseconds } from './time'

describe('formatTime', () => {
  test('форматирует время в ЧЧ:ММ', () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5).getTime())).toBe('09:05')
    expect(formatTime(new Date(2026, 0, 1, 23, 59).getTime())).toBe('23:59')
  })
})

describe('toMilliseconds', () => {
  test('секунды GREEN-API превращаются в миллисекунды', () => {
    expect(toMilliseconds(1_763_115_112)).toBe(1_763_115_112_000)
  })

  test('значение в миллисекундах не умножается повторно', () => {
    expect(toMilliseconds(1_763_115_112_000)).toBe(1_763_115_112_000)
  })

  test('ноль остаётся нулём', () => {
    expect(toMilliseconds(0)).toBe(0)
  })
})
