import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { mockGreenApi, renderWithMantine } from '@/shared/lib/test'
import { MessageComposer } from './MessageComposer'

let chatKey: string

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
  useSessionStore.getState().login('max', { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' })
  chatKey = useChatStore.getState().upsertChat({ messenger: 'max', chatId: '10000000' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const sentTexts = () => (useChatStore.getState().messages[chatKey] ?? []).map((m) => m.text)

describe('MessageComposer', () => {
  test('Enter отправляет сообщение и очищает поле', async () => {
    mockGreenApi({ sendMessage: () => ({ idMessage: '1' }) })
    const screen = await renderWithMantine(<MessageComposer messenger="max" chatKey={chatKey} />)

    const input = screen.getByRole('textbox', { name: 'Сообщение' })
    await input.click()
    await userEvent.keyboard('Привет{Enter}')

    await expect.poll(sentTexts).toEqual(['Привет'])
    await expect.element(input).toHaveValue('')
  })

  test('Shift+Enter переносит строку, а не отправляет', async () => {
    const fetchSpy = mockGreenApi({ sendMessage: () => ({ idMessage: '1' }) })
    const screen = await renderWithMantine(<MessageComposer messenger="max" chatKey={chatKey} />)

    const input = screen.getByRole('textbox', { name: 'Сообщение' })
    await input.click()
    await userEvent.keyboard('Первая{Shift>}{Enter}{/Shift}Вторая')

    await expect.element(input).toHaveValue('Первая\nВторая')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('кнопка отправки неактивна для пустого текста', async () => {
    const screen = await renderWithMantine(<MessageComposer messenger="max" chatKey={chatKey} />)

    await expect.element(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()
    await screen.getByRole('textbox', { name: 'Сообщение' }).fill('Текст')
    await expect.element(screen.getByRole('button', { name: 'Отправить' })).toBeEnabled()
  })

  test('ошибка отправки показывается под полем', async () => {
    mockGreenApi({ sendMessage: () => new Response('', { status: 500 }) })
    const screen = await renderWithMantine(<MessageComposer messenger="max" chatKey={chatKey} />)

    await screen.getByRole('textbox', { name: 'Сообщение' }).fill('Привет')
    await screen.getByRole('button', { name: 'Отправить' }).click()

    await expect.element(screen.getByText('Ошибка GREEN-API (500)')).toBeVisible()
  })
})
