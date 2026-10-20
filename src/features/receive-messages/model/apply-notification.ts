import { useChatStore } from '@/entities/chat'
import { getMessageText } from '@/shared/api'
import type { MessageWebhook, MessengerType, StatusWebhook, WebhookBody } from '@/shared/api'

const MESSAGE_WEBHOOKS = new Set(['incomingMessageReceived', 'outgoingMessageReceived', 'outgoingAPIMessageReceived'])

const isMessageWebhook = (body: WebhookBody): body is MessageWebhook => MESSAGE_WEBHOOKS.has(body.typeWebhook)
const isStatusWebhook = (body: WebhookBody): body is StatusWebhook => body.typeWebhook === 'outgoingMessageStatus'

/** Переводит уведомление GREEN-API в изменения переписки. Нетекстовые и прочие уведомления игнорируются */
export function applyNotification(messenger: MessengerType, body: WebhookBody): void {
  const { upsertChat, addMessage, updateStatus } = useChatStore.getState()

  if (isStatusWebhook(body)) {
    updateStatus(messenger, body.chatId, body.idMessage, body.status)
    return
  }
  if (!isMessageWebhook(body)) return

  const text = getMessageText(body.messageData)
  if (text === null) return

  const incoming = body.typeWebhook === 'incomingMessageReceived'
  const { chatId, chatName, senderName, senderContactName, senderPhoneNumber } = body.senderData

  // В исходящих senderName и senderPhoneNumber — это мы сами, а собеседника описывает только chatName
  const chatKey = upsertChat({
    messenger,
    chatId,
    name: chatName || (incoming ? senderContactName || senderName : undefined),
    phone: incoming && senderPhoneNumber ? String(senderPhoneNumber) : undefined,
  })

  addMessage(chatKey, {
    idMessage: body.idMessage,
    direction: incoming ? 'incoming' : 'outgoing',
    text,
    // GREEN-API присылает время в секундах
    timestamp: body.timestamp * 1000,
    ...(incoming ? {} : { status: 'sent' as const }),
  })
}
