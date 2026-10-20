import { beforeEach, describe, expect, test } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { renderWithMantine } from '@/shared/lib/test'
import { ChatWindow } from './ChatWindow'

const chats = () => useChatStore.getState()

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
  useSessionStore.getState().login('max', { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' })
})

describe('ChatWindow', () => {
  test('без выбранного чата — подсказка', async () => {
    const screen = await renderWithMantine(<ChatWindow messenger="max" />)

    await expect.element(screen.getByText('Выберите чат или создайте новый')).toBeVisible()
  })

  test('шапка с именем и номером, сообщения и поле ввода', async () => {
    const key = chats().upsertChat({ messenger: 'max', chatId: '1', name: 'Иван', phone: '79991234567' })
    chats().addMessage(key, { idMessage: 'a', direction: 'outgoing', text: 'Привет', timestamp: 1, status: 'sent' })
    chats().addMessage(key, { idMessage: 'b', direction: 'incoming', text: 'Здравствуй', timestamp: 2 })
    chats().setActiveChat('max', key)

    const screen = await renderWithMantine(<ChatWindow messenger="max" />)

    await expect.element(screen.getByRole('heading', { name: 'Иван' })).toBeVisible()
    await expect.element(screen.getByText('+79991234567')).toBeVisible()
    await expect.element(screen.getByText('Привет')).toBeVisible()
    await expect.element(screen.getByText('Здравствуй')).toBeVisible()
    await expect.element(screen.getByRole('textbox', { name: 'Сообщение' })).toBeVisible()
  })

  test('пустой чат — подсказка о первом сообщении', async () => {
    const key = chats().upsertChat({ messenger: 'max', chatId: '1', name: 'Иван' })
    chats().setActiveChat('max', key)

    const screen = await renderWithMantine(<ChatWindow messenger="max" />)

    await expect.element(screen.getByText(/Сообщений пока нет/)).toBeVisible()
  })

  test('кнопка «Назад» снимает выбор чата (для узких экранов)', async () => {
    const key = chats().upsertChat({ messenger: 'max', chatId: '1', name: 'Иван' })
    chats().setActiveChat('max', key)
    const screen = await renderWithMantine(<ChatWindow messenger="max" />)

    await screen.getByRole('button', { name: 'Назад к чатам' }).click()

    expect(chats().activeChatKey.max).toBeUndefined()
  })
})
