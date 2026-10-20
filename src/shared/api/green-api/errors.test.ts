import { describe, expect, test } from 'vitest'
import { GreenApiError, GreenApiRejectError } from './client'
import { describeError } from './errors'

describe('describeError', () => {
  test.each([
    [0, 'Не удалось связаться с GREEN-API'],
    [401, 'Неверный idInstance или apiTokenInstance'],
    [403, 'Неверный idInstance или apiTokenInstance'],
    [429, 'Слишком много запросов'],
    [466, 'лимит'],
    [469, 'подождите пару часов'],
    [500, 'Ошибка GREEN-API (500)'],
  ])('статус %i → «%s…»', (status, text) => {
    expect(describeError(new GreenApiError(status, ''))).toContain(text)
  })

  test('400 «custom webhook url is set» → подсказка очистить webhookUrl', () => {
    expect(describeError(new GreenApiError(400, 'custom webhook url is set'))).toContain('webhookUrl')
  })

  test.each([
    ['bad phone number, valid 11 or 12 digits', 'формат номера'],
    ['Validation failed. Details: Wrong format. phoneNumber must contain only digits', 'формат номера'],
    ['check phone number timeout limit exceeded', 'не успел проверить'],
  ])('400 «%s» → понятная подсказка', (message, expected) => {
    expect(describeError(new GreenApiError(400, message))).toContain(expected)
  })

  test('неизвестная 400-ошибка показывает текст ответа, а не только код', () => {
    expect(describeError(new GreenApiError(400, 'unexpected detail'))).toContain('unexpected detail')
  })

  test('таймаут отличается от сетевого сбоя: подсказка не про apiUrl', () => {
    const text = describeError(new GreenApiError(0, 'GREEN-API не ответил за 30 с', { timeout: true }))

    expect(text).toContain('не ответил вовремя')
    expect(text).not.toContain('apiUrl')
  })

  test.each([
    ['instance is starting or not authorized', 'не авторизован'],
    ['User get contact info limit reached', 'лимит'],
  ])('отказ в теле ответа «%s» → понятная причина', (reason, expected) => {
    expect(describeError(new GreenApiRejectError(reason))).toContain(expected)
  })

  test('неизвестная причина отказа → исходная формулировка GREEN-API', () => {
    expect(describeError(new GreenApiRejectError('something new'))).toBe('GREEN-API отклонил запрос: something new')
  })

  test('обычная ошибка → её текст', () => {
    expect(describeError(new Error('Что-то сломалось'))).toBe('Что-то сломалось')
  })

  test('неизвестное значение → общий текст', () => {
    expect(describeError('oops')).toBe('Неизвестная ошибка')
  })
})
