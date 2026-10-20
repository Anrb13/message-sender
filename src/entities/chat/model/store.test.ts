import { beforeEach, describe, expect, test } from 'vitest'
import { findChatKey, useChatStore } from './store'
import type { Message } from './types'

function message(overrides: Partial<Message> = {}): Message {
  return {
    idMessage: 'm1',
    direction: 'incoming',
    text: 'Привет',
    timestamp: 1_000,
    ...overrides,
  }
}

const store = () => useChatStore.getState()

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
})

describe('upsertChat', () => {
  test('создаёт чат с ключом messenger:chatId', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '10000000', name: 'Иван', phone: '79991234567' })

    expect(key).toBe('max:10000000')
    expect(store().chats[key]).toMatchObject({
      key,
      messenger: 'max',
      chatId: '10000000',
      name: 'Иван',
      phone: '79991234567',
      aliases: [],
      unread: 0,
    })
  })

  test('повторный вызов обновляет чат, не затирая имя пустым значением', () => {
    store().upsertChat({ messenger: 'max', chatId: '1', name: 'Иван' })
    store().upsertChat({ messenger: 'max', chatId: '1', phone: '79991234567' })

    expect(store().chats['max:1']).toMatchObject({ name: 'Иван', phone: '79991234567' })
  })

  test('чат находится по alias и пополняет aliases', () => {
    store().upsertChat({ messenger: 'whatsapp', chatId: '123@lid', aliases: ['79991234567@c.us'] })
    const key = store().upsertChat({ messenger: 'whatsapp', chatId: '79991234567@c.us', aliases: ['x@lid'] })

    expect(key).toBe('whatsapp:123@lid')
    expect(store().chats[key].aliases).toEqual(['79991234567@c.us', 'x@lid'])
    expect(Object.keys(store().chats)).toHaveLength(1)
  })

  test('одинаковый chatId в разных мессенджерах — разные чаты', () => {
    store().upsertChat({ messenger: 'max', chatId: '1' })
    store().upsertChat({ messenger: 'telegram', chatId: '1' })

    expect(Object.keys(store().chats)).toEqual(['max:1', 'telegram:1'])
  })
})

describe('findChatKey', () => {
  test('ищет по chatId и aliases в пределах мессенджера', () => {
    store().upsertChat({ messenger: 'whatsapp', chatId: '123@lid', aliases: ['79991234567@c.us'] })
    const { chats } = store()

    expect(findChatKey(chats, 'whatsapp', '123@lid')).toBe('whatsapp:123@lid')
    expect(findChatKey(chats, 'whatsapp', '79991234567@c.us')).toBe('whatsapp:123@lid')
    expect(findChatKey(chats, 'max', '123@lid')).toBeNull()
  })
})

describe('addMessage', () => {
  test('добавляет сообщения по порядку времени и игнорирует дубли idMessage', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, message({ idMessage: 'b', timestamp: 2_000 }))
    store().addMessage(key, message({ idMessage: 'a', timestamp: 1_000 }))
    store().addMessage(key, message({ idMessage: 'b', timestamp: 2_000, text: 'дубль' }))

    expect(store().messages[key].map((m) => m.idMessage)).toEqual(['a', 'b'])
    expect(store().messages[key][1].text).toBe('Привет')
  })

  test('входящее в неактивный чат увеличивает unread, в активный — нет', () => {
    const a = store().upsertChat({ messenger: 'max', chatId: 'a' })
    const b = store().upsertChat({ messenger: 'max', chatId: 'b' })
    store().setActiveChat('max', a)

    store().addMessage(a, message({ idMessage: '1' }))
    store().addMessage(b, message({ idMessage: '2' }))
    store().addMessage(b, message({ idMessage: '3', direction: 'outgoing' }))

    expect(store().chats[a].unread).toBe(0)
    expect(store().chats[b].unread).toBe(1)
  })

  test('обновляет lastMessageAt чата', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, message({ timestamp: 5_000 }))

    expect(store().chats[key].lastMessageAt).toBe(5_000)
  })
})

describe('updateStatus', () => {
  test('обновляет статус исходящего сообщения по chatId (с учётом aliases)', () => {
    const key = store().upsertChat({ messenger: 'whatsapp', chatId: '123@lid', aliases: ['7999@c.us'] })
    store().addMessage(key, message({ idMessage: 'out', direction: 'outgoing', status: 'sent' }))

    store().updateStatus('whatsapp', '7999@c.us', 'out', 'delivered')
    expect(store().messages[key][0].status).toBe('delivered')
  })

  test('не понижает статус: read не сменяется на delivered', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, message({ idMessage: 'out', direction: 'outgoing', status: 'read' }))

    store().updateStatus('max', '1', 'out', 'delivered')
    expect(store().messages[key][0].status).toBe('read')
  })

  test('ошибка доставки перекрывает любой статус', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, message({ idMessage: 'out', direction: 'outgoing', status: 'sent' }))

    store().updateStatus('max', '1', 'out', 'failed')
    expect(store().messages[key][0].status).toBe('failed')
  })

  test('неизвестный чат или сообщение — ничего не делает', () => {
    expect(() => store().updateStatus('max', 'nope', 'x', 'read')).not.toThrow()
  })
})

describe('setActiveChat', () => {
  test('выбирает чат в своём мессенджере и сбрасывает unread', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, message())
    store().setActiveChat('max', key)

    expect(store().activeChatKey.max).toBe(key)
    expect(store().chats[key].unread).toBe(0)
  })
})

describe('resetMessenger', () => {
  test('удаляет чаты и сообщения только одного мессенджера', () => {
    const max = store().upsertChat({ messenger: 'max', chatId: '1' })
    const tg = store().upsertChat({ messenger: 'telegram', chatId: '1' })
    store().addMessage(max, message())
    store().addMessage(tg, message())
    store().setActiveChat('max', max)

    store().resetMessenger('max')

    expect(Object.keys(store().chats)).toEqual([tg])
    expect(Object.keys(store().messages)).toEqual([tg])
    expect(store().activeChatKey.max).toBeUndefined()
  })
})

describe('settleMessage', () => {
  const pending = (overrides: Partial<Message> = {}) =>
    message({ idMessage: 'local-1', direction: 'outgoing', status: 'pending', ...overrides })

  test('успешная отправка: временный id заменяется на idMessage, статус sent', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, pending())

    store().settleMessage(key, 'local-1', { idMessage: 'real-1' })

    expect(store().messages[key]).toEqual([expect.objectContaining({ idMessage: 'real-1', status: 'sent' })])
  })

  test('уведомление пришло раньше ответа sendMessage: временная копия удаляется', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, pending())
    store().addMessage(key, message({ idMessage: 'real-1', direction: 'outgoing', status: 'delivered' }))

    store().settleMessage(key, 'local-1', { idMessage: 'real-1' })

    expect(store().messages[key]).toEqual([expect.objectContaining({ idMessage: 'real-1', status: 'delivered' })])
  })

  test('ошибка отправки: статус failed', () => {
    const key = store().upsertChat({ messenger: 'max', chatId: '1' })
    store().addMessage(key, pending())

    store().settleMessage(key, 'local-1', 'failed')

    expect(store().messages[key][0]).toMatchObject({ idMessage: 'local-1', status: 'failed' })
  })
})
