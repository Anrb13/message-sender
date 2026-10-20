import { useChatStore } from '@/entities/chat'
import { createGreenApiClient, describeError } from '@/shared/api'
import type { Credentials } from '@/shared/api'
import { MESSAGE_MAX_LENGTH } from '@/shared/config'

let localIdCounter = 0

/**
 * Отправляет текст в чат. Сообщение сразу появляется в переписке со статусом pending (оптимистично),
 * после ответа API получает настоящий idMessage, при ошибке — статус failed.
 * Бросает Error с понятным пользователю текстом.
 */
export async function sendMessage(credentials: Credentials, chatKey: string, rawText: string) {
  const text = rawText.trim()
  if (!text) return
  if (text.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Сообщение длиннее ${MESSAGE_MAX_LENGTH} символов`)
  }

  const { chats, addMessage, settleMessage } = useChatStore.getState()
  const chat = chats[chatKey]
  if (!chat) throw new Error('Чат не найден')

  const tempId = `local-${Date.now()}-${++localIdCounter}`
  addMessage(chatKey, { idMessage: tempId, direction: 'outgoing', text, timestamp: Date.now(), status: 'pending' })

  try {
    const { idMessage } = await createGreenApiClient(credentials).sendMessage({ chatId: chat.chatId, message: text })
    settleMessage(chatKey, tempId, { idMessage })
  } catch (error) {
    settleMessage(chatKey, tempId, 'failed')
    throw new Error(describeError(error), { cause: error })
  }
}
