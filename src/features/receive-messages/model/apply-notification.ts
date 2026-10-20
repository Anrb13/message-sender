import { useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { getMessageText } from '@/shared/api'
import type { MessageWebhook, MessengerType, StatusWebhook, WebhookBody } from '@/shared/api'
import { toMilliseconds } from '@/shared/lib'

const MESSAGE_WEBHOOKS = new Set(['incomingMessageReceived', 'outgoingMessageReceived', 'outgoingAPIMessageReceived'])

const isMessageWebhook = (body: WebhookBody): body is MessageWebhook => MESSAGE_WEBHOOKS.has(body.typeWebhook)
const isStatusWebhook = (body: WebhookBody): body is StatusWebhook => body.typeWebhook === 'outgoingMessageStatus'

/**
 * Видит ли пользователь чат прямо сейчас: выбран нужный таб мессенджера, в нём выбран этот чат
 * и вкладка браузера не скрыта. Только тогда входящее считается прочитанным.
 */
export function isChatVisible(messenger: MessengerType, chatKey: string, { hidden }: { hidden: boolean }): boolean {
  if (hidden) return false
  if (useSessionStore.getState().activeMessenger !== messenger) return false
  return useChatStore.getState().activeChatKey[messenger] === chatKey
}

/** Переводит уведомление GREEN-API в изменения переписки. Нетекстовые и прочие уведомления игнорируются */
export function applyNotification(messenger: MessengerType, body: WebhookBody): void {
  const { upsertChat, addMessage, updateStatus } = useChatStore.getState()

  if (isStatusWebhook(body)) {
    updateStatus(messenger, body.chatId, body.idMessage, body.status)
    return
  }
  if (!isMessageWebhook(body)) return

  const text = getMessageText(body.messageData)
  // Пустой текст — тоже «нечего показывать»: пузырь без содержимого только путает
  if (!text) return

  const incoming = body.typeWebhook === 'incomingMessageReceived'
  const { chatId, chatName, senderName, senderContactName, senderPhoneNumber } = body.senderData

  // В исходящих senderName и senderPhoneNumber — это мы сами, а собеседника описывает только chatName.
  // WhatsApp не присылает senderPhoneNumber, но номер есть в chatId вида 79991234567@c.us
  const phoneFromChatId = /^(\d+)@c\.us$/.exec(chatId)?.[1]
  const chatKey = upsertChat({
    messenger,
    chatId,
    name: chatName || (incoming ? senderContactName || senderName : undefined),
    phone: phoneFromChatId ?? (incoming && senderPhoneNumber ? String(senderPhoneNumber) : undefined),
  })

  addMessage(
    chatKey,
    {
      idMessage: body.idMessage,
      direction: incoming ? 'incoming' : 'outgoing',
      text,
      timestamp: toMilliseconds(body.timestamp),
      ...(incoming ? {} : { status: 'sent' as const }),
    },
    { visible: isChatVisible(messenger, chatKey, { hidden: document.hidden }) },
  )
}
