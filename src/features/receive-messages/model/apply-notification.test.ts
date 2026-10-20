import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import type { MessageWebhook, StatusWebhook, WebhookBody } from '@/shared/api'
import { applyNotification } from './apply-notification'

const store = () => useChatStore.getState()

function messageWebhook(overrides: Partial<MessageWebhook> = {}): MessageWebhook {
  return {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1_763_115_112,
    idMessage: 'in-1',
    senderData: {
      chatId: '10000000',
      chatName: 'Иван Петров',
      sender: '10000000',
      senderName: 'Иван Петров',
      senderPhoneNumber: 79876543210,
    },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет от Green-API!' } },
    ...overrides,
  }
}

function statusWebhook(overrides: Partial<StatusWebhook> = {}): StatusWebhook {
  return {
    typeWebhook: 'outgoingMessageStatus',
    timestamp: 1_763_115_200,
    idMessage: 'out-1',
    chatId: '10000000',
    status: 'delivered',
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('applyNotification: входящие', () => {
  test('новый собеседник → создаётся чат с именем и телефоном, сообщение со временем в мс', () => {
    applyNotification('max', messageWebhook())

    expect(store().chats['max:10000000']).toMatchObject({ name: 'Иван Петров', phone: '79876543210', unread: 1 })
    expect(store().messages['max:10000000']).toEqual([
      { idMessage: 'in-1', direction: 'incoming', text: 'Привет от Green-API!', timestamp: 1_763_115_112_000 },
    ])
  })

  test('сообщение попадает в существующий чат, найденный по alias', () => {
    const key = store().upsertChat({ messenger: 'whatsapp', chatId: '123@lid', aliases: ['79876543210@c.us'] })

    applyNotification('whatsapp', messageWebhook({ senderData: { chatId: '79876543210@c.us' } }))

    expect(Object.keys(store().chats)).toEqual([key])
    expect(store().messages[key]).toHaveLength(1)
  })

  test('extendedTextMessage тоже текст', () => {
    applyNotification(
      'max',
      messageWebhook({ messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'Ссылка' } } }),
    )

    expect(store().messages['max:10000000'][0].text).toBe('Ссылка')
  })

  test('нетекстовые сообщения игнорируются', () => {
    applyNotification('max', messageWebhook({ messageData: { typeMessage: 'imageMessage' } }))

    expect(store().chats).toEqual({})
  })

  test('повторное уведомление не дублирует сообщение', () => {
    applyNotification('max', messageWebhook())
    applyNotification('max', messageWebhook())

    expect(store().messages['max:10000000']).toHaveLength(1)
  })
})

describe('applyNotification: исходящие', () => {
  test('отправленное с телефона → исходящее со статусом sent; свои имя и номер не подставляются', () => {
    applyNotification(
      'max',
      messageWebhook({
        typeWebhook: 'outgoingMessageReceived',
        idMessage: 'out-phone',
        senderData: {
          chatId: '10000000',
          chatName: 'Иван Петров',
          senderName: 'Я сам',
          senderPhoneNumber: 79990000000,
        },
      }),
    )

    const chat = store().chats['max:10000000']
    expect(chat).toMatchObject({ name: 'Иван Петров', unread: 0 })
    expect(chat.phone).toBeUndefined()
    expect(store().messages['max:10000000'][0]).toMatchObject({ direction: 'outgoing', status: 'sent' })
  })

  test('отправленное через API уже есть в переписке → дубля нет', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '10000000' })
    store().addMessage(key, { idMessage: 'out-api', direction: 'outgoing', text: 'Привет', timestamp: 1, status: 'sent' })

    applyNotification('max', messageWebhook({ typeWebhook: 'outgoingAPIMessageReceived', idMessage: 'out-api' }))

    expect(store().messages[key]).toHaveLength(1)
  })
})

describe('applyNotification: статусы', () => {
  test('обновляет статус исходящего сообщения', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '10000000' })
    store().addMessage(key, { idMessage: 'out-1', direction: 'outgoing', text: 'x', timestamp: 1, status: 'sent' })

    applyNotification('max', statusWebhook({ status: 'read' }))

    expect(store().messages[key][0].status).toBe('read')
  })

  test('статус для неизвестного сообщения ничего не создаёт', () => {
    applyNotification('max', statusWebhook())

    expect(store().chats).toEqual({})
  })
})

test('прочие уведомления игнорируются', () => {
  const body: WebhookBody = { typeWebhook: 'stateInstanceChanged', timestamp: 1 }

  expect(() => applyNotification('max', body)).not.toThrow()
  expect(store().chats).toEqual({})
})

test('WhatsApp: телефон собеседника берётся из chatId вида номер@c.us', () => {
  applyNotification(
    'whatsapp',
    messageWebhook({ senderData: { chatId: '79876543210@c.us', senderName: 'Пётр' } }),
  )

  expect(store().chats['whatsapp:79876543210@c.us']).toMatchObject({ name: 'Пётр', phone: '79876543210' })
})

describe('applyNotification: видимость чата', () => {
  test('входящее в выбранный чат активного таба не увеличивает unread', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '10000000' })
    store().setActiveChat('max', key)
    useSessionStore.getState().setActiveMessenger('max')

    applyNotification('max', messageWebhook())

    expect(store().chats[key].unread).toBe(0)
  })

  test('входящее в выбранный чат неактивного таба увеличивает unread', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '10000000' })
    store().setActiveChat('max', key)
    useSessionStore.getState().setActiveMessenger('telegram')

    applyNotification('max', messageWebhook())

    expect(store().chats[key].unread).toBe(1)
  })

  test('в свёрнутой вкладке браузера unread растёт даже в выбранном чате', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '10000000' })
    store().setActiveChat('max', key)
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

    applyNotification('max', messageWebhook())

    expect(store().chats[key].unread).toBe(1)
  })
})

describe('applyNotification: время и пустой текст', () => {
  test('timestamp в секундах переводится в миллисекунды', () => {
    applyNotification('max', messageWebhook({ timestamp: 1_763_115_112 }))

    expect(store().messages['max:10000000'][0].timestamp).toBe(1_763_115_112_000)
  })

  test('timestamp в миллисекундах не умножается повторно', () => {
    applyNotification('max', messageWebhook({ timestamp: 1_763_115_112_000 }))

    expect(store().messages['max:10000000'][0].timestamp).toBe(1_763_115_112_000)
  })

  test('пустой текст не создаёт ни сообщение, ни чат', () => {
    applyNotification(
      'max',
      messageWebhook({ messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: '' } } }),
    )

    expect(store().chats).toEqual({})
  })
})
