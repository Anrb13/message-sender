import { describe, expect, test } from 'vitest'
import { GreenApiError } from './client'
import { describeError } from './errors'

describe('describeError', () => {
  test.each([
    [0, 'Не удалось связаться с GREEN-API'],
    [401, 'Неверный idInstance или apiTokenInstance'],
    [403, 'Неверный idInstance или apiTokenInstance'],
    [429, 'Слишком много запросов'],
    [466, 'лимит'],
    [500, 'Ошибка GREEN-API (500)'],
  ])('статус %i → «%s…»', (status, text) => {
    expect(describeError(new GreenApiError(status, ''))).toContain(text)
  })

  test('обычная ошибка → её текст', () => {
    expect(describeError(new Error('Что-то сломалось'))).toBe('Что-то сломалось')
  })

  test('неизвестное значение → общий текст', () => {
    expect(describeError('oops')).toBe('Неизвестная ошибка')
  })
})
