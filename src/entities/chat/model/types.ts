import type { MessengerType, OutgoingMessageStatus } from '@/shared/api'

export interface Chat {
  /** Уникальный ключ `${messenger}:${chatId}` — один chatId может встречаться в разных мессенджерах */
  key: string
  messenger: MessengerType
  chatId: string
  /** Другие chatId того же собеседника, по которым могут приходить уведомления */
  aliases: string[]
  name?: string
  /** Номер телефона, только цифры */
  phone?: string
  unread: number
  /** Время последнего сообщения в мс — для сортировки списка чатов */
  lastMessageAt?: number
}

/** pending — запрос sendMessage ещё выполняется */
export type MessageStatus = 'pending' | OutgoingMessageStatus

export interface Message {
  idMessage: string
  direction: 'incoming' | 'outgoing'
  text: string
  /** Время в миллисекундах */
  timestamp: number
  /** Только у исходящих */
  status?: MessageStatus
}

export interface UpsertChatInput {
  messenger: MessengerType
  chatId: string
  aliases?: string[]
  name?: string
  phone?: string
}
