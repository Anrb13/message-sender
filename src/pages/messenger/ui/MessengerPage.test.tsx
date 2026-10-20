import { beforeEach, describe, expect, test } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { renderWithMantine } from '@/shared/lib/test'
import { MessengerPage } from './MessengerPage'

const session = { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't', wid: '79991234567@c.us' }

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState(useSessionStore.getInitialState())
  useChatStore.setState(useChatStore.getInitialState())
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
})
