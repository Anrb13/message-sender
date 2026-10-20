import type { Chat } from '../model/types'

/** Заголовок чата: имя собеседника, иначе номер телефона, иначе chatId */
export function getChatTitle(chat: Pick<Chat, 'name' | 'phone' | 'chatId'>): string {
  return chat.name || (chat.phone ? `+${chat.phone}` : chat.chatId)
}
