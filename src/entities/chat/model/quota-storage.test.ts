import { describe, expect, test, vi } from 'vitest'
import type { Message } from './types'
import { createQuotaSafeStorage } from './quota-storage'

interface Persisted {
  messages: Record<string, Message[]>
}

function messageList(count: number): Message[] {
  return Array.from({ length: count }, (_, index) => ({
    idMessage: `m${index}`,
    direction: 'incoming',
    text: 'x',
    timestamp: index,
  }))
}

/** localStorage-подобное хранилище с пределом на длину строки — как квота в браузере */
function storageWithLimit(limitChars: number) {
  let stored: string | null = null
  const api = {
    getItem: () => stored,
    setItem: (_name: string, value: string) => {
      if (value.length > limitChars) throw new DOMException('exceeded', 'QuotaExceededError')
      stored = value
    },
    removeItem: () => {
      stored = null
    },
  } as unknown as Storage

  return { api, read: () => stored }
}

const saved = (messages: Record<string, Message[]>) => ({ state: { messages }, version: 1 })

describe('createQuotaSafeStorage', () => {
  test('запись в пределах квоты сохраняется без обрезки', () => {
    const onTrim = vi.fn()
    const { api, read } = storageWithLimit(1_000_000)
    const storage = createQuotaSafeStorage<Persisted>({ storage: api, onTrim })

    storage.setItem('message-sender:chats', saved({ 'max:1': messageList(10) }))

    expect(onTrim).not.toHaveBeenCalled()
    expect(JSON.parse(read()!).state.messages['max:1']).toHaveLength(10)
  })

  test('при переполнении история обрезается, а запись повторяется', () => {
    const onTrim = vi.fn()
    // 10 сообщений (~750 символов) не влезают, 5 (~430) — влезают
    const { api, read } = storageWithLimit(500)
    const storage = createQuotaSafeStorage<Persisted>({ storage: api, onTrim })

    storage.setItem('message-sender:chats', saved({ 'max:1': messageList(10) }))

    expect(JSON.parse(read()!).state.messages['max:1']).toHaveLength(5)
    expect(onTrim).toHaveBeenCalledWith({ 'max:1': expect.any(Array) }, 5)
  })

  test('если обрезать уже нечего — ошибка квоты пробрасывается, старые данные не теряются', () => {
    const onTrim = vi.fn()
    const { api, read } = storageWithLimit(10)
    const storage = createQuotaSafeStorage<Persisted>({ storage: api, onTrim })

    expect(() => storage.setItem('message-sender:chats', saved({ 'max:1': messageList(1) }))).toThrow(
      /exceeded|quota/i,
    )
    expect(onTrim).not.toHaveBeenCalled()
    expect(read()).toBeNull()
  })

  test('getItem возвращает null, пока ничего не сохранено, и разбирает сохранённое', () => {
    const { api } = storageWithLimit(1_000_000)
    const storage = createQuotaSafeStorage<Persisted>({ storage: api, onTrim: vi.fn() })

    expect(storage.getItem('message-sender:chats')).toBeNull()

    storage.setItem('message-sender:chats', saved({ 'max:1': messageList(2) }))

    expect(storage.getItem('message-sender:chats')).toEqual({ state: { messages: { 'max:1': messageList(2) } }, version: 1 })
  })

  test('сбой обработчика предупреждения не мешает сохранению', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { api, read } = storageWithLimit(500)
    const storage = createQuotaSafeStorage<Persisted>({
      storage: api,
      onTrim: () => {
        throw new Error('подписчик упал')
      },
    })

    expect(() => storage.setItem('message-sender:chats', saved({ 'max:1': messageList(10) }))).not.toThrow()
    expect(JSON.parse(read()!).state.messages['max:1']).toHaveLength(5)
  })
})
