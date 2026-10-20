/** Мессенджеры, которые поддерживает приложение. У каждого — свой инстанс GREEN-API */
export type MessengerType = 'max' | 'telegram' | 'whatsapp'

export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type InstanceState =
  | 'notAuthorized'
  | 'authorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'suspended'
  | 'yellowCard'
  | 'pendingPassword'

export interface StateInstanceResponse {
  stateInstance: InstanceState
}

type YesNo = 'yes' | 'no'

/** Часть настроек инстанса, нужная приложению */
export interface InstanceSettings {
  wid?: string
  webhookUrl?: string
  incomingWebhook?: YesNo
  outgoingWebhook?: YesNo
  outgoingMessageWebhook?: YesNo
  outgoingAPIMessageWebhook?: YesNo
}

export interface SetSettingsResponse {
  saveSettings: boolean
}

export interface CheckAccountResponse {
  exist: boolean
  chatId: string
}

/** WhatsApp. Новый формат ответа содержит chatId (может быть …@lid) и phoneNumber (…@c.us), старый — только флаг */
export interface CheckWhatsappResponse {
  existsWhatsapp: boolean
  chatId?: string
  phoneNumber?: string
}

export interface SendMessageRequest {
  chatId: string
  message: string
}

export interface SendMessageResponse {
  idMessage: string
}

export interface DeleteNotificationResponse {
  result: boolean
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string }
}

export interface SenderData {
  chatId: string
  chatName?: string
  sender?: string
  senderName?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

interface WebhookBase {
  instanceData?: { idInstance: number; wid: string; typeInstance: string }
  /** Unix-время в секундах */
  timestamp: number
}

/** Входящее сообщение, исходящее с телефона или исходящее через API — формат у них общий */
export interface MessageWebhook extends WebhookBase {
  typeWebhook: 'incomingMessageReceived' | 'outgoingMessageReceived' | 'outgoingAPIMessageReceived'
  idMessage: string
  senderData: SenderData
  messageData?: MessageData
}

export type OutgoingMessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup'

/** Статус исходящего сообщения. В отличие от сообщений, chatId лежит на верхнем уровне */
export interface StatusWebhook extends WebhookBase {
  typeWebhook: 'outgoingMessageStatus'
  idMessage: string
  chatId: string
  status: OutgoingMessageStatus
}

/** Прочие уведомления (stateInstanceChanged и т.п.) приложение не обрабатывает, но обязано удалить */
export interface OtherWebhook extends WebhookBase {
  typeWebhook: string
}

export type WebhookBody = MessageWebhook | StatusWebhook | OtherWebhook

export interface Notification {
  receiptId: number
  body: WebhookBody
}
