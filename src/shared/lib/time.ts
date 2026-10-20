const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** Время сообщения в формате ЧЧ:ММ; timestamp — в миллисекундах */
export function formatTime(timestamp: number): string {
  return timeFormat.format(timestamp)
}
