import { describe, expect, test } from 'vitest'
import type { Message } from '../model/types'
import { isQuotaExceeded, trimMessages } from './quota'

function messageList(count: number): Message[] {
  return Array.from({ length: count }, (_, index) => ({
    idMessage: `m${index}`,
    direction: 'incoming',
    text: 'x',
    timestamp: index,
  }))
}

describe('trimMessages', () => {
  test('оставляет половину сообщений в каждом чате — самые новые', () => {
    const { messages, removed } = trimMessages({ 'max:1': messageList(10), 'max:2': messageList(4) })

    expect(messages['max:1'].map((message) => message.idMessage)).toEqual(['m5', 'm6', 'm7', 'm8', 'm9'])
    expect(messages['max:2'].map((message) => message.idMessage)).toEqual(['m2', 'm3'])
    expect(removed).toBe(7)
  })

  test('чат с одним сообщением обрезать нечего', () => {
    const { removed } = trimMessages({ 'max:1': messageList(1) })

    expect(removed).toBe(0)
  })

  test('пустые чаты остаются на месте', () => {
    const { messages, removed } = trimMessages({ 'max:1': [] })

    expect(messages['max:1']).toEqual([])
    expect(removed).toBe(0)
  })

  test('нечётное число округляется в пользу сохранения', () => {
    const { messages } = trimMessages({ 'max:1': messageList(5) })

    expect(messages['max:1']).toHaveLength(3)
  })
})

describe('isQuotaExceeded', () => {
  test.each(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])('%s — переполнение хранилища', (name) => {
    expect(isQuotaExceeded(new DOMException('нет места', name))).toBe(true)
  })

  test.each([
    ['другая DOMException', new DOMException('aborted', 'AbortError')],
    ['обычная ошибка', new Error('boom')],
    ['не ошибка', 'oops'],
  ])('%s — не переполнение', (_, error) => {
    expect(isQuotaExceeded(error)).toBe(false)
  })
})
