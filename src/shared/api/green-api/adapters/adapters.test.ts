import { describe, expect, test, vi } from 'vitest'
import type { GreenApiClient } from '../client'
import { getAdapter } from './index'

function clientMock(overrides: Partial<GreenApiClient>) {
  return overrides as GreenApiClient
}

describe('адаптер MAX', () => {
  const adapter = getAdapter('max')

  test('resolveChatId: номер есть в MAX → chatId из checkAccount', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '10000000' })

    await expect(adapter.resolveChatId(clientMock({ checkAccount }), '79991234567')).resolves.toEqual({
      chatId: '10000000',
      aliases: [],
    })
    expect(checkAccount).toHaveBeenCalledWith('79991234567')
  })

  test('resolveChatId: номера нет в MAX → null', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: false, chatId: '' })

    await expect(adapter.resolveChatId(clientMock({ checkAccount }), '79991234567')).resolves.toBeNull()
  })
})
