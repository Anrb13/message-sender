import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { GreenApiClient, Notification } from '@/shared/api'
import { GreenApiError } from '@/shared/api'
import { pollNotifications } from './poll'

const notification: Notification = { receiptId: 7, body: { typeWebhook: 'stateInstanceChanged', timestamp: 1 } }

/** Клиент, который отдаёт заготовленные ответы по очереди, а затем останавливает цикл */
function scriptedClient(controller: AbortController, responses: Array<Notification | null | Error>) {
  const receiveNotification = vi.fn(async () => {
    const next = responses.shift()
    if (responses.length === 0 && next === undefined) controller.abort()
    if (next === undefined) {
      controller.abort()
      throw new DOMException('Aborted', 'AbortError')
    }
    if (next instanceof Error) throw next
    return next
  })
  const deleteNotification = vi.fn(async () => ({ result: true }))
  return {
    client: { receiveNotification, deleteNotification } as unknown as GreenApiClient,
    receiveNotification,
    deleteNotification,
  }
}

let controller: AbortController

beforeEach(() => {
  controller = new AbortController()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pollNotifications', () => {
  test('каждое уведомление обрабатывается и удаляется по receiptId', async () => {
    const { client, deleteNotification } = scriptedClient(controller, [notification, null])
    const onNotification = vi.fn()

    await pollNotifications({ client, signal: controller.signal, onNotification })

    expect(onNotification).toHaveBeenCalledWith(notification.body)
    expect(deleteNotification).toHaveBeenCalledWith(7, controller.signal)
  })

  test('ошибка обработчика не блокирует очередь: уведомление всё равно удаляется', async () => {
    const { client, deleteNotification } = scriptedClient(controller, [notification])
    // Сбой обработчика логируется — в этом тесте он ожидаем
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onNotification = vi.fn(() => {
      throw new Error('boom')
    })

    await pollNotifications({ client, signal: controller.signal, onNotification })

    expect(deleteNotification).toHaveBeenCalledWith(7, controller.signal)
  })

  test('пустая очередь (null) → следующий запрос без удаления', async () => {
    const { client, receiveNotification, deleteNotification } = scriptedClient(controller, [null, null])

    await pollNotifications({ client, signal: controller.signal, onNotification: vi.fn() })

    expect(receiveNotification).toHaveBeenCalledTimes(3)
    expect(deleteNotification).not.toHaveBeenCalled()
  })

  test('ошибка API → onStatus с текстом ошибки, повтор после паузы, затем восстановление', async () => {
    const { client, receiveNotification } = scriptedClient(controller, [new GreenApiError(500, ''), null])
    const onStatus = vi.fn()

    await pollNotifications({ client, signal: controller.signal, onNotification: vi.fn(), onStatus, retryDelays: [1] })

    expect(onStatus).toHaveBeenNthCalledWith(1, 'Ошибка GREEN-API (500)')
    expect(onStatus).toHaveBeenNthCalledWith(2, null)
    expect(receiveNotification).toHaveBeenCalledTimes(3)
  })

  test('отменённый signal останавливает цикл сразу', async () => {
    controller.abort()
    const { client, receiveNotification } = scriptedClient(controller, [null])

    await pollNotifications({ client, signal: controller.signal, onNotification: vi.fn() })

    expect(receiveNotification).not.toHaveBeenCalled()
  })
})
