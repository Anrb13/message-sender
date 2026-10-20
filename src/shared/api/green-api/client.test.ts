import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest'
import { createGreenApiClient, GreenApiError } from './client'

const credentials = {
  apiUrl: 'https://3100.api.green-api.com/',
  idInstance: '3100000001',
  apiTokenInstance: 'token123',
}
const base = 'https://3100.api.green-api.com/waInstance3100000001'

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

let fetchMock: MockInstance<typeof fetch>

beforeEach(() => {
  fetchMock = vi.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  vi.restoreAllMocks()
})

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return { url: String(url), init: init ?? {} }
}

describe('createGreenApiClient', () => {
  const client = createGreenApiClient(credentials)

  test('getStateInstance: GET по шаблону {apiUrl}/waInstance{id}/{method}/{token}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ stateInstance: 'authorized' }))

    await expect(client.getStateInstance()).resolves.toEqual({ stateInstance: 'authorized' })
    const { url, init } = lastCall()
    expect(url).toBe(`${base}/getStateInstance/token123`)
    expect(init.method).toBe('GET')
  })

  test('getSettings возвращает настройки инстанса', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ wid: '79991234567@c.us', incomingWebhook: 'yes' }))

    await expect(client.getSettings()).resolves.toMatchObject({ incomingWebhook: 'yes' })
    expect(lastCall().url).toBe(`${base}/getSettings/token123`)
  })

  test('setSettings: POST с JSON-телом', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ saveSettings: true }))

    await expect(client.setSettings({ webhookUrl: '', incomingWebhook: 'yes' })).resolves.toEqual({
      saveSettings: true,
    })
    const { url, init } = lastCall()
    expect(url).toBe(`${base}/setSettings/token123`)
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(String(init.body))).toEqual({ webhookUrl: '', incomingWebhook: 'yes' })
  })

  test('checkAccount отправляет phoneNumber числом', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ exist: true, chatId: '10000000' }))

    await expect(client.checkAccount('79991234567')).resolves.toEqual({ exist: true, chatId: '10000000' })
    const { url, init } = lastCall()
    expect(url).toBe(`${base}/checkAccount/token123`)
    expect(JSON.parse(String(init.body))).toEqual({ phoneNumber: 79991234567 })
  })

  test('sendMessage возвращает idMessage', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ idMessage: '1763115112345' }))

    await expect(client.sendMessage({ chatId: '10000000', message: 'Привет' })).resolves.toEqual({
      idMessage: '1763115112345',
    })
    const { url, init } = lastCall()
    expect(url).toBe(`${base}/sendMessage/token123`)
    expect(JSON.parse(String(init.body))).toEqual({ chatId: '10000000', message: 'Привет' })
  })

  test('receiveNotification передаёт receiveTimeout и AbortSignal', async () => {
    const notification = { receiptId: 1, body: { typeWebhook: 'incomingMessageReceived' } }
    fetchMock.mockResolvedValue(jsonResponse(notification))
    const controller = new AbortController()

    await expect(client.receiveNotification({ receiveTimeout: 20, signal: controller.signal })).resolves.toEqual(
      notification,
    )
    const { url, init } = lastCall()
    expect(url).toBe(`${base}/receiveNotification/token123?receiveTimeout=20`)
    expect(init.signal).toBe(controller.signal)
  })

  test.each([
    ['пустое тело', () => new Response('', { status: 200 })],
    ['null', () => jsonResponse(null)],
  ])('receiveNotification: %s → null (очередь пуста)', async (_, response) => {
    fetchMock.mockResolvedValue(response())

    await expect(client.receiveNotification()).resolves.toBeNull()
  })

  test('deleteNotification: DELETE с receiptId в пути', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ result: true }))

    await expect(client.deleteNotification(1234567)).resolves.toEqual({ result: true })
    const { url, init } = lastCall()
    expect(url).toBe(`${base}/deleteNotification/token123/1234567`)
    expect(init.method).toBe('DELETE')
  })

  test('HTTP-ошибка → GreenApiError со статусом', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))

    const error = await client.getStateInstance().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GreenApiError)
    expect(error).toMatchObject({ status: 401 })
  })

  test('сетевая ошибка → GreenApiError со статусом 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(client.getStateInstance()).rejects.toMatchObject({ name: 'GreenApiError', status: 0 })
  })

  test('отмена запроса пробрасывает AbortError как есть', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(client.receiveNotification()).rejects.toMatchObject({ name: 'AbortError' })
  })
})
