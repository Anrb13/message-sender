import { describe, expect, test, vi } from 'vitest'
import type { GreenApiClient } from '../client'
import { getAdapter } from './index'

function clientMock(overrides: Partial<GreenApiClient>) {
  return overrides as GreenApiClient
}

describe.each(['max', 'telegram'] as const)('адаптер %s (checkAccount)', (messenger) => {
  const adapter = getAdapter(messenger)

  test('номер есть в мессенджере → chatId из checkAccount', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '10000000' })

    await expect(adapter.resolveChatId(clientMock({ checkAccount }), '79991234567')).resolves.toEqual({
      chatId: '10000000',
      aliases: [],
    })
    expect(checkAccount).toHaveBeenCalledWith('79991234567')
  })

  test('номера нет → null', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: false, chatId: '' })

    await expect(adapter.resolveChatId(clientMock({ checkAccount }), '79991234567')).resolves.toBeNull()
  })
})

describe('адаптер WhatsApp (checkWhatsapp)', () => {
  const adapter = getAdapter('whatsapp')

  test('основной chatId — номер@c.us, а @lid из ответа сохраняется как alias', async () => {
    const checkWhatsapp = vi
      .fn()
      .mockResolvedValue({ existsWhatsapp: true, chatId: '123456789012345@lid', phoneNumber: '79991234567@c.us' })

    await expect(adapter.resolveChatId(clientMock({ checkWhatsapp }), '79991234567')).resolves.toEqual({
      chatId: '79991234567@c.us',
      aliases: ['123456789012345@lid'],
    })
    expect(checkWhatsapp).toHaveBeenCalledWith('79991234567')
  })

  test('старый формат ответа без chatId → только номер@c.us', async () => {
    const checkWhatsapp = vi.fn().mockResolvedValue({ existsWhatsapp: true })

    await expect(adapter.resolveChatId(clientMock({ checkWhatsapp }), '79991234567')).resolves.toEqual({
      chatId: '79991234567@c.us',
      aliases: [],
    })
  })

  test('номера нет в WhatsApp → null', async () => {
    const checkWhatsapp = vi.fn().mockResolvedValue({ existsWhatsapp: false })

    await expect(adapter.resolveChatId(clientMock({ checkWhatsapp }), '79991234567')).resolves.toBeNull()
  })
})
