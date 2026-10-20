const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** Время сообщения в формате ЧЧ:ММ; timestamp — в миллисекундах */
export function formatTime(timestamp: number): string {
  return timeFormat.format(timestamp)
}

/**
 * Приводит время из уведомления к миллисекундам. GREEN-API присылает секунды, но если сервер
 * когда-нибудь отдаст миллисекунды, сообщение не улетит в 57-й век. 1e11 секунд — это 5138 год,
 * а 1e11 миллисекунд — 1973, поэтому всё, что меньше порога, считается секундами.
 */
export function toMilliseconds(timestamp: number): number {
  return timestamp < 1e11 ? timestamp * 1000 : timestamp
}
