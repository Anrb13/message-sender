import { beforeEach, describe, expect, test } from 'vitest'
import { useChatStore, useStorageNoticeStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { renderWithMantine } from '@/shared/lib/test'
import { Sidebar } from './Sidebar'

const chats = () => useChatStore.getState()

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
  useStorageNoticeStore.setState(useStorageNoticeStore.getInitialState())
  useSessionStore.getState().login('max', {
    apiUrl: 'https://x',
    idInstance: '1',
    apiTokenInstance: 't',
    wid: '79990000000@c.us',
  })
})

describe('Sidebar', () => {
  test('показывает свой номер, кнопку выхода и форму создания чата', async () => {
    const screen = await renderWithMantine(<Sidebar messenger="max" />)

    await expect.element(screen.getByText('+79990000000')).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Выйти' })).toBeVisible()
    await expect.element(screen.getByLabelText('Номер телефона')).toBeVisible()
  })

  test('пустой список → подсказка', async () => {
    const screen = await renderWithMantine(<Sidebar messenger="max" />)

    await expect.element(screen.getByText(/Чатов пока нет/)).toBeVisible()
  })

  test('чаты своего мессенджера, свежие сверху, с последним сообщением', async () => {
    const old = chats().upsertChat({ messenger: 'max', chatId: '1', name: 'Старый' })
    const fresh = chats().upsertChat({ messenger: 'max', chatId: '2', name: 'Свежий' })
    chats().upsertChat({ messenger: 'telegram', chatId: '3', name: 'Чужой' })
    chats().addMessage(old, { idMessage: 'a', direction: 'incoming', text: 'давно', timestamp: 1_000 })
    chats().addMessage(fresh, { idMessage: 'b', direction: 'incoming', text: 'только что', timestamp: 2_000 })

    const screen = await renderWithMantine(<Sidebar messenger="max" />)

    const items = screen.getByRole('list', { name: 'Чаты' }).getByRole('button')
    await expect.element(items.nth(0)).toHaveTextContent('Свежий')
    await expect.element(items.nth(0)).toHaveTextContent('только что')
    await expect.element(items.nth(1)).toHaveTextContent('Старый')
    expect(items.elements()).toHaveLength(2)
  })

  test('клик по чату делает его активным', async () => {
    const key = chats().upsertChat({ messenger: 'max', chatId: '1', name: 'Иван' })
    const screen = await renderWithMantine(<Sidebar messenger="max" />)

    await screen.getByRole('button', { name: /Иван/ }).click()

    expect(chats().activeChatKey.max).toBe(key)
  })

  test('предупреждает об обрезке истории и позволяет скрыть предупреждение', async () => {
    useStorageNoticeStore.getState().notify(7)
    const screen = await renderWithMantine(<Sidebar messenger="max" />)

    await expect.element(screen.getByText(/Удалено старых сообщений: 7/)).toBeVisible()

    await screen.getByRole('button', { name: 'Скрыть' }).click()

    expect(useStorageNoticeStore.getState().removed).toBe(0)
    expect(screen.container.textContent).not.toContain('История обрезана')
  })
})
