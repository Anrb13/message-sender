import { describe, expect, test } from 'vitest'
import { getSettingsFix } from './settings'

const ready = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
} as const

describe('getSettingsFix', () => {
  test('всё настроено → null', () => {
    expect(getSettingsFix(ready)).toBeNull()
  })

  test('выключенные уведомления → только недостающие флаги', () => {
    expect(getSettingsFix({ ...ready, incomingWebhook: 'no', outgoingWebhook: 'no' })).toEqual({
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
    })
  })

  test('заданный webhookUrl мешает HTTP API → сбрасываем его', () => {
    expect(getSettingsFix({ ...ready, webhookUrl: 'https://example.com/hook' })).toEqual({ webhookUrl: '' })
  })

  test('отсутствующие поля считаются выключенными', () => {
    expect(getSettingsFix({})).toEqual({
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
    })
  })
})
