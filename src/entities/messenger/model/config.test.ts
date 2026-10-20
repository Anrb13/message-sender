import { describe, expect, test } from 'vitest'
import { MESSENGERS, MESSENGER_ORDER } from './config'

describe('конфиг мессенджеров', () => {
  test('порядок табов: MAX, Telegram, WhatsApp', () => {
    expect(MESSENGER_ORDER).toEqual(['max', 'telegram', 'whatsapp'])
  })

  test('у каждого мессенджера есть название и цвет', () => {
    for (const type of MESSENGER_ORDER) {
      expect(MESSENGERS[type].title).toBeTruthy()
      expect(MESSENGERS[type].color).toBeTruthy()
    }
  })
})
