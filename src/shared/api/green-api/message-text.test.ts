import { describe, expect, test } from 'vitest'
import { getMessageText } from './message-text'

describe('getMessageText', () => {
  test('textMessage', () => {
    expect(
      getMessageText({ typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } }),
    ).toBe('Привет')
  })

  test('extendedTextMessage', () => {
    expect(
      getMessageText({ typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'Ссылка' } }),
    ).toBe('Ссылка')
  })

  test('не текстовое сообщение или нет данных → null', () => {
    expect(getMessageText({ typeMessage: 'imageMessage' })).toBeNull()
    expect(getMessageText(undefined)).toBeNull()
  })
})
