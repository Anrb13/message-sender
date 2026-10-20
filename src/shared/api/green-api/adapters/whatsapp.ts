import type { MessengerAdapter } from './types'

/**
 * WhatsApp: отправка надёжно работает по классическому chatId «номер@c.us», а checkWhatsapp в новом формате
 * дополнительно возвращает скрытый идентификатор «…@lid». Входящие могут прийти с любого из них, поэтому
 * @lid сохраняется как alias того же чата.
 */
export const whatsappAdapter: MessengerAdapter = {
  async resolveChatId(client, phone) {
    const { existsWhatsapp, chatId, phoneNumber } = await client.checkWhatsapp(phone)
    if (!existsWhatsapp) return null

    const primary = `${phone}@c.us`
    const aliases = [...new Set([chatId, phoneNumber])].filter((id): id is string => !!id && id !== primary)
    return { chatId: primary, aliases }
  },
}
