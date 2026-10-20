import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { renderWithMantine } from '@/shared/lib/test'
import { ChatWindow } from './ChatWindow'

const chats = () => useChatStore.getState()

/** Даёт React применить обновление стора и выполнить эффекты */
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  localStorage.clear()
  useChatStore.setState(useChatStore.getInitialState())
  useSessionStore.setState(useSessionStore.getInitialState())
  useSessionStore.getState().login('max', { apiUrl: 'https://x', idInstance: '1', apiTokenInstance: 't' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Чат с историей, которой хватает на прокрутку */
function seededChat(messageCount = 50, chatId = '1'): string {
  const key = chats().upsertChat({ messenger: 'max', chatId, name: 'Иван' })
  for (let index = 0; index < messageCount; index++) {
    chats().addMessage(key, {
      idMessage: `${chatId}-${index}`,
      direction: 'incoming',
      text: `Сообщение номер ${index} с достаточно длинным текстом для прокрутки`,
      timestamp: index,
    })
  }
  return key
}

function viewportOf(container: HTMLElement): HTMLElement {
  const viewport = container.querySelector<HTMLElement>('[data-scrollarea-viewport]')
  if (!viewport) throw new Error('не нашли viewport ScrollArea')
  return viewport
}

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

  test('новое сообщение при прокрутке внизу прокручивает переписку', async () => {
    const key = seededChat()
    chats().setActiveChat('max', key)
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')

    const screen = await renderWithMantine(<ChatWindow messenger="max" />)
    await expect.element(screen.getByRole('heading', { name: 'Иван' })).toBeVisible()
    scrollIntoView.mockClear()

    chats().addMessage(key, { idMessage: 'new', direction: 'incoming', text: 'Новое', timestamp: 1_000 })
    await nextTick()

    expect(scrollIntoView).toHaveBeenCalled()
  })

  test('не прокручивает вниз, если пользователь читает историю выше', async () => {
    const key = seededChat()
    chats().setActiveChat('max', key)
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')

    const screen = await renderWithMantine(<ChatWindow messenger="max" />)
    await expect.element(screen.getByRole('heading', { name: 'Иван' })).toBeVisible()

    const viewport = viewportOf(screen.container)
    // В тесте у виджета нет высоты страницы, поэтому ограничиваем вьюпорт вручную
    viewport.style.height = '300px'
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)

    viewport.scrollTop = 0
    viewport.dispatchEvent(new Event('scroll'))
    scrollIntoView.mockClear()

    chats().addMessage(key, { idMessage: 'new', direction: 'incoming', text: 'Новое', timestamp: 1_000 })
    await nextTick()

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
