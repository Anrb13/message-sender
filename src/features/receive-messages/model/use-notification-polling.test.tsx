import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { mockGreenApi } from '@/shared/lib/test'
import { useConnectionStore } from './connection-store'
import { useNotificationPolling } from './use-notification-polling'

function Poller() {
  useNotificationPolling()
  return null
}

const incoming = {
  receiptId: 1,
  body: {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1_763_115_112,
    idMessage: 'in-1',
    senderData: { chatId: '10000000', senderName: 'Иван' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Ответ из MAX' } },
  },
}

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
  useConnectionStore.setState(useConnectionStore.getInitialState())
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('для подключённой сессии входящее сообщение попадает в чат и удаляется из очереди', async () => {
  const queue: unknown[] = [incoming]
  const deleted: string[] = []
  mockGreenApi({
    // Пустая очередь: имитируем long polling короткой паузой
    receiveNotification: async () => queue.shift() ?? new Promise((resolve) => setTimeout(() => resolve(null), 50)),
    deleteNotification: ({ url }) => {
      deleted.push(url.split('/').at(-1)!)
      return { result: true }
    },
  })
  useSessionStore.getState().login('max', { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' })

  const screen = await render(<Poller />)

  await expect.poll(() => useChatStore.getState().messages['max:10000000']?.[0]?.text).toBe('Ответ из MAX')
  expect(deleted).toEqual(['1'])
  await screen.unmount()
})

test('без сессий запросов нет', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')

  const screen = await render(<Poller />)

  expect(fetchSpy).not.toHaveBeenCalled()
  await screen.unmount()
})

test('ошибка приёма отражается в статусе соединения мессенджера', async () => {
  mockGreenApi({ receiveNotification: () => new Response('custom webhook url is set', { status: 400 }) })
  useSessionStore.getState().login('max', { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' })

  const screen = await render(<Poller />)

  await expect.poll(() => useConnectionStore.getState().errors.max).toContain('webhookUrl')
  await screen.unmount()
})
