import { afterEach, describe, expect, test, vi } from 'vitest'
import { mockGreenApi } from '@/shared/lib/test'
import { verifyCredentials } from './verify'

const credentials = { apiUrl: 'https://3100.api.green-api.com', idInstance: '3100000001', apiTokenInstance: 't' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('verifyCredentials', () => {
  test('авторизованный инстанс → wid и нужные исправления настроек', async () => {
    mockGreenApi({
      getStateInstance: () => ({ stateInstance: 'authorized' }),
      getSettings: () => ({ wid: '79991234567@c.us', webhookUrl: '', incomingWebhook: 'no' }),
    })

    await expect(verifyCredentials(credentials)).resolves.toEqual({
      wid: '79991234567@c.us',
      settingsFix: { incomingWebhook: 'yes', outgoingWebhook: 'yes', outgoingMessageWebhook: 'yes' },
    })
  })

  test.each([
    ['notAuthorized', 'не авторизован'],
    ['starting', 'запускается'],
    ['blocked', 'заблокирован'],
  ])('состояние %s → ошибка «…%s…»', async (stateInstance, text) => {
    mockGreenApi({ getStateInstance: () => ({ stateInstance }) })

    await expect(verifyCredentials(credentials)).rejects.toThrow(text)
  })

  test('неверный токен → понятная ошибка', async () => {
    mockGreenApi({ getStateInstance: () => new Response('', { status: 401 }) })

    await expect(verifyCredentials(credentials)).rejects.toThrow('Неверный idInstance или apiTokenInstance')
  })
})
