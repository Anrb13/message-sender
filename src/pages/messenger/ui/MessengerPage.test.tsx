import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { mockGreenApi, renderWithMantine } from '@/shared/lib/test'
import { MessengerPage } from './MessengerPage'

const session = { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't', wid: '79991234567@c.us' }

let queue: unknown[] = []

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState(useSessionStore.getInitialState())
  useChatStore.setState(useChatStore.getInitialState())
  // Страница запускает приём уведомлений: отдаём очередь, а при пустой — имитируем long polling
  queue = []
  mockGreenApi({
    receiveNotification: async () => queue.shift() ?? new Promise((resolve) => setTimeout(() => resolve(null), 50)),
    deleteNotification: () => ({ result: true }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MessengerPage', () => {
  test('табы мессенджеров, по умолчанию выбран MAX', async () => {
    const screen = await renderWithMantine(<MessengerPage />)

    await expect.element(screen.getByRole('tab', { name: /MAX/ })).toHaveAttribute('aria-selected', 'true')
    await expect.element(screen.getByRole('tab', { name: /Telegram/ })).toBeInTheDocument()
    await expect.element(screen.getByRole('tab', { name: /WhatsApp/ })).toBeInTheDocument()
  })

  test('без сессии в табе показывается форма входа', async () => {
    const screen = await renderWithMantine(<MessengerPage />)

    await expect.element(screen.getByRole('button', { name: 'Войти' })).toBeVisible()
  })

  test('с сессией форма входа скрыта, доступен выход', async () => {
    useSessionStore.getState().login('max', session)
    const screen = await renderWithMantine(<MessengerPage />)

    await expect.element(screen.getByRole('button', { name: 'Выйти' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Войти' })).not.toBeInTheDocument()
  })

  test('на табе показывается число непрочитанных', async () => {
    const key = useChatStore.getState().upsertChat({ messenger: 'max', chatId: '1' })
    useChatStore.getState().addMessage(key, { idMessage: 'a', direction: 'incoming', text: 'x', timestamp: 1 })
    useChatStore.getState().addMessage(key, { idMessage: 'b', direction: 'incoming', text: 'y', timestamp: 2 })
    const screen = await renderWithMantine(<MessengerPage />)

    await expect.element(screen.getByRole('tab', { name: /MAX/ })).toHaveTextContent('2')
  })

  test('входящее сообщение из MAX появляется в списке чатов', async () => {
    useSessionStore.getState().login('max', session)
    queue.push({
      receiptId: 1,
      body: {
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1_763_115_112,
        idMessage: 'in-1',
        senderData: { chatId: '10000000', senderName: 'Иван' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Ответ получателя' } },
      },
    })
    const screen = await renderWithMantine(<MessengerPage />)

    await expect.element(screen.getByRole('button', { name: /Иван/ })).toHaveTextContent('Ответ получателя')
  })

  test.each([
    ['Telegram', 'telegram'],
    ['WhatsApp', 'whatsapp'],
  ] as const)('таб %s доступен и открывает свою форму входа', async (title, messenger) => {
    const screen = await renderWithMantine(<MessengerPage />)

    await screen.getByRole('tab', { name: title }).click()

    await expect.element(screen.getByRole('heading', { name: `Вход в ${title}` })).toBeVisible()
    expect(useSessionStore.getState().activeMessenger).toBe(messenger)
  })
})
