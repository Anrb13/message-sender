import { describe, expect, test } from 'vitest'
import { bem } from './bem'

describe('bem', () => {
  const b = bem('message-bubble')

  test('блок', () => {
    expect(b()).toBe('message-bubble')
  })

  test('элемент', () => {
    expect(b('meta')).toBe('message-bubble__meta')
  })

  test('булевы модификаторы блока: true добавляет, false и undefined пропускаются', () => {
    expect(b({ outgoing: true, selected: false, hidden: undefined })).toBe(
      'message-bubble message-bubble--outgoing',
    )
  })

  test('модификатор ключ-значение', () => {
    expect(b('status', { status: 'read' })).toBe('message-bubble__status message-bubble__status--status_read')
  })

  test('несколько модификаторов элемента', () => {
    expect(b('status', { error: true, status: 'failed' })).toBe(
      'message-bubble__status message-bubble__status--error message-bubble__status--status_failed',
    )
  })
})
