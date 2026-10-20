import { describe, expect, test } from 'vitest'
import { isNearBottom } from './scroll'

describe('isNearBottom', () => {
  test('прокрутка у самого низа — true', () => {
    expect(isNearBottom({ scrollTop: 900, scrollHeight: 1000, clientHeight: 100 })).toBe(true)
  })

  test('прокручено выше порога — false', () => {
    expect(isNearBottom({ scrollTop: 700, scrollHeight: 1000, clientHeight: 100 })).toBe(false)
  })

  test('контент короче вьюпорта — true', () => {
    expect(isNearBottom({ scrollTop: 0, scrollHeight: 80, clientHeight: 100 })).toBe(true)
  })

  test('порог настраивается', () => {
    expect(isNearBottom({ scrollTop: 800, scrollHeight: 1000, clientHeight: 100 }, 200)).toBe(true)
  })
})
