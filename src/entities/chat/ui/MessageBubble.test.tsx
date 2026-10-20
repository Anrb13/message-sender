import { describe, expect, test } from 'vitest'
import { renderWithMantine } from '@/shared/lib/test'
import { formatTime } from '@/shared/lib'
import { MessageBubble } from './MessageBubble'
import type { Message } from '../model/types'

const timestamp = new Date(2026, 0, 1, 12, 30).getTime()

function message(overrides: Partial<Message> = {}): Message {
  return { idMessage: '1', direction: 'outgoing', text: 'Привет!', timestamp, status: 'sent', ...overrides }
}

describe('MessageBubble', () => {
  test('показывает текст и время', async () => {
    const screen = await renderWithMantine(<MessageBubble message={message()} />)

    await expect.element(screen.getByText('Привет!')).toBeVisible()
    await expect.element(screen.getByText(formatTime(timestamp))).toBeVisible()
  })

  test.each([
    ['pending', 'Отправляется'],
    ['sent', 'Отправлено'],
    ['delivered', 'Доставлено'],
    ['read', 'Прочитано'],
    ['failed', 'Не доставлено'],
    ['noAccount', 'Не доставлено'],
  ] as const)('исходящее со статусом %s → «%s»', async (status, label) => {
    const screen = await renderWithMantine(<MessageBubble message={message({ status })} />)

    await expect.element(screen.getByLabelText(label)).toBeInTheDocument()
  })

  test('у входящего нет статуса доставки', async () => {
    const screen = await renderWithMantine(
      <MessageBubble message={message({ direction: 'incoming', status: undefined })} />,
    )

    expect(screen.container.querySelector('[data-status]')).toBeNull()
  })

  test('направление отражено в data-атрибуте для стилей', async () => {
    const screen = await renderWithMantine(<MessageBubble message={message({ direction: 'incoming' })} />)

    expect(screen.container.querySelector('[data-direction="incoming"]')).not.toBeNull()
  })
})
