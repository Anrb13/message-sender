import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { mockGreenApi, renderWithMantine } from '@/shared/lib/test'
import { CreateChatForm } from './CreateChatForm'

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
  useSessionStore.getState().login('max', { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CreateChatForm', () => {
  test('создаёт чат и очищает поле', async () => {
    mockGreenApi({ checkAccount: () => ({ exist: true, chatId: '10000000' }) })
    const screen = await renderWithMantine(<CreateChatForm messenger="max" />)

    const input = screen.getByLabelText('Номер телефона')
    await input.fill('+7 999 123-45-67')
    await screen.getByRole('button', { name: 'Создать чат' }).click()

    await expect.poll(() => useChatStore.getState().activeChatKey.max).toBe('max:10000000')
    await expect.element(input).toHaveValue('')
  })

  test('показывает ошибку и сохраняет введённый номер', async () => {
    mockGreenApi({ checkAccount: () => ({ exist: false, chatId: '' }) })
    const screen = await renderWithMantine(<CreateChatForm messenger="max" />)

    const input = screen.getByLabelText('Номер телефона')
    await input.fill('79991234567')
    await input.click()
    await screen.getByRole('button', { name: 'Создать чат' }).click()

    await expect.element(screen.getByText(/не зарегистрирован в MAX/)).toBeVisible()
    await expect.element(input).toHaveValue('79991234567')
  })
})
