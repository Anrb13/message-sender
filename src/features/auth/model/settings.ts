import type { InstanceSettings } from '@/shared/api'

/**
 * Уведомления, без которых чат не работает (по умолчанию в новом инстансе все выключены):
 * входящие сообщения, статусы доставки и сообщения, отправленные с телефона.
 */
const REQUIRED_FLAGS = ['incomingWebhook', 'outgoingWebhook', 'outgoingMessageWebhook'] as const

/**
 * Какие настройки нужно изменить, чтобы получать уведомления через HTTP API; null — менять ничего не нужно.
 * Заданный webhookUrl мешает HTTP API: receiveNotification отвечает ошибкой, пока он не сброшен.
 */
export function getSettingsFix(settings: InstanceSettings): InstanceSettings | null {
  const fix: InstanceSettings = {}
  if (settings.webhookUrl) fix.webhookUrl = ''
  for (const flag of REQUIRED_FLAGS) {
    if (settings[flag] !== 'yes') fix[flag] = 'yes'
  }
  return Object.keys(fix).length > 0 ? fix : null
}
