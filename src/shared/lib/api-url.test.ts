import { describe, expect, test } from 'vitest'
import { defaultApiUrl } from './api-url'

describe('defaultApiUrl', () => {
  test('строит хост по первым 4 цифрам idInstance', () => {
    expect(defaultApiUrl('3100123456')).toBe('https://3100.api.green-api.com')
    expect(defaultApiUrl(' 7103987654 ')).toBe('https://7103.api.green-api.com')
  })

  test('без валидного idInstance возвращает общий хост', () => {
    expect(defaultApiUrl('')).toBe('https://api.green-api.com')
    expect(defaultApiUrl('12')).toBe('https://api.green-api.com')
    expect(defaultApiUrl('abcd1234')).toBe('https://api.green-api.com')
  })
})
