import type { MessageData } from './types'

/** Текст сообщения из уведомления; null — сообщение не текстовое (фото, файл и т.п.) */
export function getMessageText(messageData: MessageData | undefined): string | null {
  return messageData?.textMessageData?.textMessage ?? messageData?.extendedTextMessageData?.text ?? null
}
