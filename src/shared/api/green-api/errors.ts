import { GreenApiError } from './client'

/** Человекочитаемое описание ошибки запроса к GREEN-API */
export function describeError(error: unknown): string {
  if (error instanceof GreenApiError) {
    // Пока в инстансе задан webhookUrl, receiveNotification отвечает 400 — частая причина «ответы не приходят»
    if (error.status === 400 && /webhook/i.test(error.message)) {
      return 'В инстансе задан webhookUrl — очистите его в личном кабинете GREEN-API, иначе входящие не приходят'
    }
    switch (error.status) {
      case 0:
        return 'Не удалось связаться с GREEN-API. Проверьте apiUrl и подключение к интернету'
      case 401:
      case 403:
        return 'Неверный idInstance или apiTokenInstance'
      case 429:
        return 'Слишком много запросов, попробуйте чуть позже'
      case 466:
        return 'Исчерпан лимит тарифа GREEN-API (число чатов или проверок номеров)'
      default:
        return `Ошибка GREEN-API (${error.status})`
    }
  }
  if (error instanceof Error) return error.message
  return 'Неизвестная ошибка'
}
