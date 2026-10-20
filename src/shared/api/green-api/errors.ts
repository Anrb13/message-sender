import { GreenApiError, GreenApiRejectError } from './client'

/** Частые причины отказа, которые GREEN-API объясняет по-английски */
const REASON_MESSAGES: [RegExp, string][] = [
  [
    /not authorized|is starting/i,
    'Инстанс ещё запускается или не авторизован — подождите пару минут и войдите заново',
  ],
  [/limit reached|too many/i, 'Превышен лимит запросов в мессенджере — попробуйте позже'],
]

/** Текст отказа из тела ответа: для известных причин — перевод, иначе исходная формулировка */
export function describeRejectReason(reason: string): string {
  const known = REASON_MESSAGES.find(([pattern]) => pattern.test(reason))
  return known ? known[1] : `GREEN-API отклонил запрос: ${reason}`
}

/** Человекочитаемое описание ошибки запроса к GREEN-API */
export function describeError(error: unknown): string {
  if (error instanceof GreenApiRejectError) return describeRejectReason(error.reason)

  if (error instanceof GreenApiError) {
    // Пока в инстансе задан webhookUrl, receiveNotification отвечает 400 — частая причина «ответы не приходят»
    if (error.status === 400 && /webhook/i.test(error.message)) {
      return 'В инстансе задан webhookUrl — очистите его в личном кабинете GREEN-API, иначе входящие не приходят'
    }
    switch (error.status) {
      case 0:
        return error.timeout
          ? 'GREEN-API не ответил вовремя. Проверьте подключение и попробуйте ещё раз'
          : 'Не удалось связаться с GREEN-API. Проверьте apiUrl и подключение к интернету'
      case 401:
      case 403:
        return 'Неверный idInstance или apiTokenInstance'
      case 429:
        return 'Слишком много запросов, попробуйте чуть позже'
      case 466:
        return 'Исчерпан лимит тарифа GREEN-API (число чатов или проверок номеров)'
      case 469:
        return 'Слишком часто проверяли номера — подождите пару часов и повторите'
      default:
        return `Ошибка GREEN-API (${error.status})`
    }
  }
  if (error instanceof Error) return error.message
  return 'Неизвестная ошибка'
}
