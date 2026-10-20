import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { mockGreenApi } from '@/shared/lib/test'
import { createChat } from './create-chat'

const session = { apiUrl: 'https://3100.api.green-api.com', idInstance: '3100000001', apiTokenInstance: 't' }

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createChat', () => {
  test('находит chatId по номеру, создаёт чат и делает его активным', async () => {
    const checkAccount = vi.fn((_body: unknown) => ({ exist: true, chatId: '10000000' }))
    mockGreenApi({ checkAccount: ({ body }) => checkAccount(body) })

    const key = await createChat('max', session, '+7 (999) 123-45-67')

    expect(checkAccount).toHaveBeenCalledWith({ phoneNumber: 79991234567 })
    expect(key).toBe('max:10000000')
    expect(useChatStore.getState().chats[key]).toMatchObject({ chatId: '10000000', phone: '79991234567' })
    expect(useChatStore.getState().activeChatKey.max).toBe(key)
  })

  test('невалидный номер → ошибка без запроса к API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(createChat('max', session, '12345')).rejects.toThrow('Введите номер в международном формате')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('номера нет в мессенджере → ошибка, чат не создаётся', async () => {
    mockGreenApi({ checkAccount: () => ({ exist: false, chatId: '' }) })

    await expect(createChat('max', session, '79991234567')).rejects.toThrow('не зарегистрирован в MAX')
    expect(useChatStore.getState().chats).toEqual({})
  })

  test('ошибка API → понятный текст', async () => {
    mockGreenApi({ checkAccount: () => new Response('', { status: 466 }) })

    await expect(createChat('max', session, '79991234567')).rejects.toThrow('лимит тарифа')
  })
})

describe('createChat в других мессенджерах', () => {
  test('Telegram: chatId из checkAccount', async () => {
    mockGreenApi({ checkAccount: () => ({ exist: true, chatId: '555' }) })

    await expect(createChat('telegram', session, '79991234567')).resolves.toBe('telegram:555')
  })

  test('WhatsApp: чат номер@c.us, @lid из checkWhatsapp сохраняется как alias', async () => {
    mockGreenApi({
      checkWhatsapp: () => ({ existsWhatsapp: true, chatId: '123@lid', phoneNumber: '79991234567@c.us' }),
    })

    const key = await createChat('whatsapp', session, '+7 999 123-45-67')

    expect(key).toBe('whatsapp:79991234567@c.us')
    expect(useChatStore.getState().chats[key].aliases).toEqual(['123@lid'])
  })

  test('WhatsApp: номера нет → ошибка с названием мессенджера', async () => {
    mockGreenApi({ checkWhatsapp: () => ({ existsWhatsapp: false }) })

    await expect(createChat('whatsapp', session, '79991234567')).rejects.toThrow('не зарегистрирован в WhatsApp')
  })
})
