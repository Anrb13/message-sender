import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { MESSAGE_MAX_LENGTH } from '@/shared/config'
import { mockGreenApi } from '@/shared/lib/test'
import { sendMessage } from './send-message'

const session = { apiUrl: 'https://3100.api.green-api.com', idInstance: '3100000001', apiTokenInstance: 't' }
let chatKey: string

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  chatKey = useChatStore.getState().upsertChat({ messenger: 'max', chatId: '10000000' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const messages = () => useChatStore.getState().messages[chatKey] ?? []

describe('sendMessage', () => {
  test('отправляет текст в chatId чата и сохраняет сообщение с idMessage', async () => {
    const send = vi.fn((_body: unknown) => ({ idMessage: '1763115112345' }))
    mockGreenApi({ sendMessage: ({ body }) => send(body) })

    await sendMessage(session, chatKey, '  Привет!  ')

    expect(send).toHaveBeenCalledWith({ chatId: '10000000', message: 'Привет!' })
    expect(messages()).toEqual([
      expect.objectContaining({ idMessage: '1763115112345', direction: 'outgoing', text: 'Привет!', status: 'sent' }),
    ])
  })

  test('до ответа API сообщение уже видно со статусом pending', async () => {
    let respond!: (value: unknown) => void
    mockGreenApi({ sendMessage: () => new Promise((resolve) => (respond = resolve)) })

    const promise = sendMessage(session, chatKey, 'Привет')

    await expect.poll(() => messages()[0]?.status).toBe('pending')
    respond({ idMessage: 'real' })
    await promise
    expect(messages()[0]).toMatchObject({ idMessage: 'real', status: 'sent' })
  })

  test('ошибка API: сообщение помечается failed, бросается понятная ошибка', async () => {
    mockGreenApi({ sendMessage: () => new Response('', { status: 401 }) })

    await expect(sendMessage(session, chatKey, 'Привет')).rejects.toThrow('Неверный idInstance')
    expect(messages()[0]).toMatchObject({ text: 'Привет', status: 'failed' })
  })

  test('пустой текст не отправляется', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await sendMessage(session, chatKey, '   \n ')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(messages()).toEqual([])
  })

  test(`текст длиннее ${MESSAGE_MAX_LENGTH} символов → ошибка без запроса`, async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(sendMessage(session, chatKey, 'a'.repeat(MESSAGE_MAX_LENGTH + 1))).rejects.toThrow(
      String(MESSAGE_MAX_LENGTH),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
