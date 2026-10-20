import { describe, expect, test, vi } from 'vitest'
import { renderWithMantine } from '@/shared/lib/test'
import { ChatListItem } from './ChatListItem'
import type { Chat } from '../model/types'

function chat(overrides: Partial<Chat> = {}): Chat {
  return {
    key: 'max:1',
    messenger: 'max',
    chatId: '1',
    aliases: [],
    name: 'Иван Петров',
    phone: '79991234567',
    unread: 0,
    ...overrides,
  }
}

describe('ChatListItem', () => {
  test('показывает имя и последнее сообщение', async () => {
    const screen = await renderWithMantine(<ChatListItem chat={chat()} lastMessage="До встречи" />)

    await expect.element(screen.getByText('Иван Петров')).toBeVisible()
    await expect.element(screen.getByText('До встречи')).toBeVisible()
  })

  test('без имени показывает номер телефона', async () => {
    const screen = await renderWithMantine(<ChatListItem chat={chat({ name: undefined })} />)

    await expect.element(screen.getByText('+79991234567')).toBeVisible()
  })

  test('показывает счётчик непрочитанных', async () => {
    const screen = await renderWithMantine(<ChatListItem chat={chat({ unread: 3 })} />)

    await expect.element(screen.getByText('3')).toBeVisible()
  })

  test('клик выбирает чат, активный помечен aria-current', async () => {
    const onSelect = vi.fn()
    const screen = await renderWithMantine(<ChatListItem chat={chat()} active onSelect={onSelect} />)

    const button = screen.getByRole('button', { name: /Иван Петров/ })
    await expect.element(button).toHaveAttribute('aria-current', 'true')
    await button.click()
    expect(onSelect).toHaveBeenCalledWith('max:1')
  })

  test('у неактивного чата атрибута aria-current нет, а не aria-current="false"', async () => {
    const screen = await renderWithMantine(<ChatListItem chat={chat()} />)

    await expect.element(screen.getByRole('button', { name: /Иван Петров/ })).not.toHaveAttribute('aria-current')
  })
})
