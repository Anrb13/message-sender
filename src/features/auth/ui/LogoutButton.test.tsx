import { beforeEach, expect, test } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { renderWithMantine } from '@/shared/lib/test'
import { LogoutButton } from './LogoutButton'

const session = { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' }

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState(useSessionStore.getInitialState())
  useChatStore.setState(useChatStore.getInitialState())
})

test('выход удаляет сессию и чаты только этого мессенджера', async () => {
  useSessionStore.getState().login('max', session)
  useSessionStore.getState().login('telegram', session)
  useChatStore.getState().upsertChat({ messenger: 'max', chatId: '1' })
  useChatStore.getState().upsertChat({ messenger: 'telegram', chatId: '1' })

  const screen = await renderWithMantine(<LogoutButton messenger="max" />)
  await screen.getByRole('button', { name: 'Выйти' }).click()

  expect(useSessionStore.getState().sessions.max).toBeUndefined()
  expect(useSessionStore.getState().sessions.telegram).toEqual(session)
  expect(Object.keys(useChatStore.getState().chats)).toEqual(['telegram:1'])
})
