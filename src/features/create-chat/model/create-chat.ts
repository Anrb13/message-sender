import { useChatStore } from '@/entities/chat'
import { MESSENGERS } from '@/entities/messenger'
import { createGreenApiClient, describeError, getAdapter } from '@/shared/api'
import type { Credentials, MessengerType } from '@/shared/api'
import { normalizePhone } from '@/shared/lib'

/**
 * Создаёт чат по номеру телефона и делает его активным; возвращает ключ чата.
 * chatId берётся у мессенджера (адаптер), а не из номера: в MAX они не совпадают.
 * Бросает Error с понятным пользователю текстом.
 */
export async function createChat(messenger: MessengerType, credentials: Credentials, phoneInput: string) {
  const phone = normalizePhone(phoneInput)
  if (!phone) throw new Error('Введите номер в международном формате, например +7 999 123-45-67')

  let resolved
  try {
    resolved = await getAdapter(messenger).resolveChatId(createGreenApiClient(credentials), phone)
  } catch (error) {
    throw new Error(describeError(error), { cause: error })
  }
  if (!resolved) throw new Error(`Номер +${phone} не зарегистрирован в ${MESSENGERS[messenger].title}`)

  const { upsertChat, setActiveChat } = useChatStore.getState()
  const key = upsertChat({ messenger, chatId: resolved.chatId, aliases: resolved.aliases, phone })
  setActiveChat(messenger, key)
  return key
}
